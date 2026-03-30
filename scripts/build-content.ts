/**
 * Content build pipeline.
 *
 * Discovers JSON content files under content/, validates them against zod
 * schemas, runs repo-level integrity checks, and writes a deterministic
 * TypeScript catalog to src/generated/content-catalog.ts.
 *
 * Usage: pnpm content:build   (runs via tsx)
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { questionSchema } from "../src/schemas/question.schema";
import { conceptCardSchema } from "../src/schemas/concept.schema";
import type { Question } from "../src/types/question";
import type { ConceptCard } from "../src/types/concept";
import { CERTIFICATIONS } from "../src/types/shared";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FileEntry {
  /** Forward-slash relative path from repo root, e.g. content/SAA-C03/domains/... */
  relPath: string;
  absPath: string;
}

interface ParsedQuestion {
  item: Question;
  file: FileEntry;
}

interface ParsedConceptCard {
  item: ConceptCard;
  file: FileEntry;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SCRIPT_DIR = typeof __dirname !== "undefined" ? __dirname : path.dirname(new URL(import.meta.url).pathname);
const ROOT = path.resolve(SCRIPT_DIR, "..");
const CONTENT_DIR = path.join(ROOT, "content");
const OUTPUT_PATH = path.join(ROOT, "src", "generated", "content-catalog.ts");

/** Normalize to forward slashes for deterministic output. */
function normalizePath(p: string): string {
  return p.replace(/\\/g, "/");
}

function relFromRoot(absPath: string): string {
  return normalizePath(path.relative(ROOT, absPath));
}

/**
 * Recursively discover all .json files under a directory.
 * Returns paths sorted by their forward-slash relative path from ROOT.
 */
function discoverJsonFiles(dir: string): FileEntry[] {
  const entries: FileEntry[] = [];

  function walk(current: string) {
    if (!fs.existsSync(current)) return;
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && entry.name.endsWith(".json")) {
        entries.push({ relPath: relFromRoot(full), absPath: full });
      }
    }
  }

  walk(dir);
  entries.sort((a, b) => a.relPath.localeCompare(b.relPath));
  return entries;
}

/**
 * Parse the canonical path segments from a content file's relative path.
 * Expected: content/<cert>/domains/<domain>/(questions|concepts)/<id>.json
 */
function parseContentPath(relPath: string) {
  const parts = relPath.split("/");
  // parts: ["content", cert, "domains", domain, kind, filename]
  if (parts.length !== 6 || parts[0] !== "content" || parts[2] !== "domains") {
    return null;
  }
  const cert = parts[1];
  const domain = parts[3];
  const kind = parts[4]; // "questions" or "concepts"
  const filename = parts[5];
  const id = filename.replace(/\.json$/, "");
  return { cert, domain, kind, id };
}

// ---------------------------------------------------------------------------
// Stage 1: File-local validation
// ---------------------------------------------------------------------------

interface Stage1Result {
  questions: ParsedQuestion[];
  conceptCards: ParsedConceptCard[];
  errors: string[];
}

function stage1Validate(files: FileEntry[]): Stage1Result {
  const questions: ParsedQuestion[] = [];
  const conceptCards: ParsedConceptCard[] = [];
  const errors: string[] = [];

  for (const file of files) {
    const pathInfo = parseContentPath(file.relPath);
    if (!pathInfo) {
      errors.push(`${file.relPath}: does not match expected path structure content/<cert>/domains/<domain>/(questions|concepts)/<id>.json`);
      continue;
    }

    // Read and parse JSON
    let raw: unknown;
    try {
      const text = fs.readFileSync(file.absPath, "utf-8");
      raw = JSON.parse(text);
    } catch (e) {
      errors.push(`${file.relPath}: failed to parse JSON — ${e instanceof Error ? e.message : String(e)}`);
      continue;
    }

    // Validate against the appropriate schema
    if (pathInfo.kind === "questions") {
      const result = questionSchema.safeParse(raw);
      if (!result.success) {
        const issues = result.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
        errors.push(`${file.relPath}: schema validation failed\n${issues}`);
        continue;
      }
      questions.push({ item: result.data as Question, file });
    } else if (pathInfo.kind === "concepts") {
      const result = conceptCardSchema.safeParse(raw);
      if (!result.success) {
        const issues = result.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
        errors.push(`${file.relPath}: schema validation failed\n${issues}`);
        continue;
      }
      conceptCards.push({ item: result.data as ConceptCard, file });
    } else {
      errors.push(`${file.relPath}: unexpected folder "${pathInfo.kind}" (expected "questions" or "concepts")`);
    }
  }

  return { questions, conceptCards, errors };
}

// ---------------------------------------------------------------------------
// Stage 2: Repo-level integrity checks
// ---------------------------------------------------------------------------

function stage2Validate(
  questions: ParsedQuestion[],
  conceptCards: ParsedConceptCard[],
): string[] {
  const errors: string[] = [];

  // --- ID format: lowercase kebab-case ---
  const KEBAB_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  for (const { item, file } of [...questions, ...conceptCards]) {
    if (!KEBAB_RE.test(item.id)) {
      errors.push(`${file.relPath}: id "${item.id}" is not lowercase kebab-case`);
    }
  }

  // --- Filename / path consistency ---
  for (const { item, file } of [...questions, ...conceptCards]) {
    const pathInfo = parseContentPath(file.relPath)!;

    if (pathInfo.id !== item.id) {
      errors.push(`${file.relPath}: filename "${pathInfo.id}" does not match id "${item.id}"`);
    }
    if (pathInfo.cert !== item.cert) {
      errors.push(`${file.relPath}: folder cert "${pathInfo.cert}" does not match item cert "${item.cert}"`);
    }
    if (pathInfo.domain !== item.domain) {
      errors.push(`${file.relPath}: folder domain "${pathInfo.domain}" does not match item domain "${item.domain}"`);
    }
  }

  // --- Questions under questions/, concepts under concepts/ ---
  for (const { file } of questions) {
    const pathInfo = parseContentPath(file.relPath)!;
    if (pathInfo.kind !== "questions") {
      errors.push(`${file.relPath}: question found outside questions/ folder`);
    }
  }
  for (const { file } of conceptCards) {
    const pathInfo = parseContentPath(file.relPath)!;
    if (pathInfo.kind !== "concepts") {
      errors.push(`${file.relPath}: concept card found outside concepts/ folder`);
    }
  }

  // --- Unique IDs ---
  const questionIds = new Map<string, string>();
  for (const { item, file } of questions) {
    const existing = questionIds.get(item.id);
    if (existing) {
      errors.push(`${file.relPath}: duplicate question id "${item.id}" (also in ${existing})`);
    } else {
      questionIds.set(item.id, file.relPath);
    }
  }

  const conceptIds = new Map<string, string>();
  for (const { item, file } of conceptCards) {
    const existing = conceptIds.get(item.id);
    if (existing) {
      errors.push(`${file.relPath}: duplicate concept card id "${item.id}" (also in ${existing})`);
    } else {
      conceptIds.set(item.id, file.relPath);
    }
  }

  // --- relatedQuestionIds point to existing questions in same cert ---
  for (const { item, file } of conceptCards) {
    for (const refId of item.relatedQuestionIds) {
      if (!questionIds.has(refId)) {
        errors.push(`${file.relPath}: relatedQuestionIds references unknown question "${refId}"`);
        continue;
      }
      // Find the referenced question's cert
      const refQuestion = questions.find((q) => q.item.id === refId);
      if (refQuestion && refQuestion.item.cert !== item.cert) {
        errors.push(
          `${file.relPath}: relatedQuestionIds references question "${refId}" from cert "${refQuestion.item.cert}", but this concept card is cert "${item.cert}"`,
        );
      }
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Code generation
// ---------------------------------------------------------------------------

function generateCatalog(questions: Question[], conceptCards: ConceptCard[]): string {
  // Build counts by cert and type
  const meta: Record<string, { questions: number; conceptCards: number }> = {};
  for (const cert of CERTIFICATIONS) {
    meta[cert] = { questions: 0, conceptCards: 0 };
  }
  for (const q of questions) {
    meta[q.cert].questions++;
  }
  for (const c of conceptCards) {
    meta[c.cert].conceptCards++;
  }

  const lines: string[] = [];

  lines.push("/**");
  lines.push(" * AUTO-GENERATED by scripts/build-content.ts — do not edit by hand.");
  lines.push(" * Regenerate with: pnpm content:build");
  lines.push(" */");
  lines.push('import "server-only";');
  lines.push("");
  lines.push('import type { Question } from "../types/question";');
  lines.push('import type { ConceptCard } from "../types/concept";');
  lines.push('import type { Certification } from "../types/shared";');
  lines.push("");

  // Questions array
  lines.push("export const questions: Question[] = " + JSON.stringify(questions, null, 2) + ";");
  lines.push("");

  // Concept cards array
  lines.push("export const conceptCards: ConceptCard[] = " + JSON.stringify(conceptCards, null, 2) + ";");
  lines.push("");

  // Meta
  lines.push("export const contentCatalogMeta: Record<Certification, { questions: number; conceptCards: number }> = " + JSON.stringify(meta, null, 2) + ";");
  lines.push("");

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  console.log("content:build — discovering content files...");

  const files = discoverJsonFiles(CONTENT_DIR);
  console.log(`  found ${files.length} JSON file(s)`);

  // Stage 1
  const { questions, conceptCards, errors: stage1Errors } = stage1Validate(files);

  // Stage 2
  const stage2Errors = stage2Validate(questions, conceptCards);

  const allErrors = [...stage1Errors, ...stage2Errors];
  if (allErrors.length > 0) {
    console.error("\ncontent:build failed with errors:\n");
    for (const err of allErrors) {
      console.error(`  ✗ ${err}`);
    }
    console.error(`\n${allErrors.length} error(s) found.`);
    process.exit(1);
  }

  // Sort by id for determinism
  const sortedQuestions = questions.map((q) => q.item).sort((a, b) => a.id.localeCompare(b.id));
  const sortedConcepts = conceptCards.map((c) => c.item).sort((a, b) => a.id.localeCompare(b.id));

  const output = generateCatalog(sortedQuestions, sortedConcepts);

  // Ensure output directory exists
  const outDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_PATH, output, "utf-8");

  console.log(`\ncontent:build succeeded`);
  console.log(`  questions:     ${sortedQuestions.length}`);
  console.log(`  concept cards: ${sortedConcepts.length}`);
  console.log(`  output:        ${relFromRoot(OUTPUT_PATH)}`);
}

main();
