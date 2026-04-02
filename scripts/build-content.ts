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
import { pathToFileURL } from "node:url";

import { conceptCardSchema } from "../src/schemas/concept.schema";
import { questionSchema } from "../src/schemas/question.schema";
import type { ConceptCard } from "../src/types/concept";
import type { Question } from "../src/types/question";
import { CERTIFICATIONS } from "../src/types/shared";

export interface FileEntry {
  /** Forward-slash relative path from repo root, e.g. content/SAA-C03/domains/... */
  relPath: string;
  absPath: string;
}

export interface ParsedQuestion {
  item: Question;
  file: FileEntry;
}

export interface ParsedConceptCard {
  item: ConceptCard;
  file: FileEntry;
}

export interface Stage1Result {
  questions: ParsedQuestion[];
  conceptCards: ParsedConceptCard[];
  errors: string[];
}

export interface BuildContentOptions {
  rootDir?: string;
  contentDir?: string;
  outputPath?: string;
  logger?: Pick<typeof console, "log" | "error">;
}

export interface BuildContentResult {
  questions: Question[];
  conceptCards: ConceptCard[];
  outputPath: string;
}

export class ContentBuildError extends Error {
  constructor(public readonly errors: string[]) {
    super(`content:build failed with ${errors.length} error(s)`);
    this.name = "ContentBuildError";
  }
}

const SCRIPT_DIR =
  typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(new URL(import.meta.url).pathname);
const DEFAULT_ROOT = path.resolve(SCRIPT_DIR, "..");
const DEFAULT_CONTENT_DIR = path.join(DEFAULT_ROOT, "content");
const DEFAULT_OUTPUT_PATH = path.join(
  DEFAULT_ROOT,
  "src",
  "generated",
  "content-catalog.ts",
);

/** Normalize to forward slashes for deterministic output. */
export function normalizePath(value: string): string {
  return value.replace(/\\/g, "/");
}

function relFromRoot(rootDir: string, absPath: string) {
  return normalizePath(path.relative(rootDir, absPath));
}

/**
 * Recursively discover all .json files under a directory.
 * Returns paths sorted by their forward-slash relative path from rootDir.
 */
export function discoverJsonFiles(dir: string, rootDir: string): FileEntry[] {
  const entries: FileEntry[] = [];

  function walk(current: string) {
    if (!fs.existsSync(current)) return;

    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);

      if (entry.isDirectory()) {
        walk(full);
        continue;
      }

      if (entry.isFile() && entry.name.endsWith(".json")) {
        entries.push({
          relPath: relFromRoot(rootDir, full),
          absPath: full,
        });
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
export function parseContentPath(relPath: string) {
  const parts = relPath.split("/");

  // parts: ["content", cert, "domains", domain, kind, filename]
  if (parts.length !== 6 || parts[0] !== "content" || parts[2] !== "domains") {
    return null;
  }

  const cert = parts[1];
  const domain = parts[3];
  const kind = parts[4];
  const filename = parts[5];
  const id = filename.replace(/\.json$/, "");

  return { cert, domain, kind, id };
}

export function stage1Validate(files: FileEntry[]): Stage1Result {
  const questions: ParsedQuestion[] = [];
  const conceptCards: ParsedConceptCard[] = [];
  const errors: string[] = [];

  for (const file of files) {
    const pathInfo = parseContentPath(file.relPath);
    if (!pathInfo) {
      errors.push(
        `${file.relPath}: does not match expected path structure content/<cert>/domains/<domain>/(questions|concepts)/<id>.json`,
      );
      continue;
    }

    let raw: unknown;
    try {
      const text = fs.readFileSync(file.absPath, "utf-8");
      raw = JSON.parse(text);
    } catch (error) {
      errors.push(
        `${file.relPath}: failed to parse JSON - ${error instanceof Error ? error.message : String(error)}`,
      );
      continue;
    }

    if (pathInfo.kind === "questions") {
      const result = questionSchema.safeParse(raw);

      if (!result.success) {
        const issues = result.error.issues
          .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
          .join("\n");
        errors.push(`${file.relPath}: schema validation failed\n${issues}`);
        continue;
      }

      questions.push({ item: result.data as Question, file });
      continue;
    }

    if (pathInfo.kind === "concepts") {
      const result = conceptCardSchema.safeParse(raw);

      if (!result.success) {
        const issues = result.error.issues
          .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
          .join("\n");
        errors.push(`${file.relPath}: schema validation failed\n${issues}`);
        continue;
      }

      conceptCards.push({ item: result.data as ConceptCard, file });
      continue;
    }

    errors.push(
      `${file.relPath}: unexpected folder "${pathInfo.kind}" (expected "questions" or "concepts")`,
    );
  }

  return { questions, conceptCards, errors };
}

export function stage2Validate(
  questions: ParsedQuestion[],
  conceptCards: ParsedConceptCard[],
): string[] {
  const errors: string[] = [];
  const kebabCase = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

  for (const { item, file } of [...questions, ...conceptCards]) {
    if (!kebabCase.test(item.id)) {
      errors.push(`${file.relPath}: id "${item.id}" is not lowercase kebab-case`);
    }
  }

  for (const { item, file } of [...questions, ...conceptCards]) {
    const pathInfo = parseContentPath(file.relPath);
    if (!pathInfo) {
      continue;
    }

    if (pathInfo.id !== item.id) {
      errors.push(
        `${file.relPath}: filename "${pathInfo.id}" does not match id "${item.id}"`,
      );
    }
    if (pathInfo.cert !== item.cert) {
      errors.push(
        `${file.relPath}: folder cert "${pathInfo.cert}" does not match item cert "${item.cert}"`,
      );
    }
    if (pathInfo.domain !== item.domain) {
      errors.push(
        `${file.relPath}: folder domain "${pathInfo.domain}" does not match item domain "${item.domain}"`,
      );
    }
  }

  const questionIds = new Map<string, string>();
  for (const { item, file } of questions) {
    const existing = questionIds.get(item.id);
    if (existing) {
      errors.push(
        `${file.relPath}: duplicate question id "${item.id}" (also in ${existing})`,
      );
      continue;
    }

    questionIds.set(item.id, file.relPath);
  }

  const conceptIds = new Map<string, string>();
  for (const { item, file } of conceptCards) {
    const existing = conceptIds.get(item.id);
    if (existing) {
      errors.push(
        `${file.relPath}: duplicate concept card id "${item.id}" (also in ${existing})`,
      );
      continue;
    }

    conceptIds.set(item.id, file.relPath);
  }

  for (const { item, file } of conceptCards) {
    for (const refId of item.relatedQuestionIds) {
      if (!questionIds.has(refId)) {
        errors.push(
          `${file.relPath}: relatedQuestionIds references unknown question "${refId}"`,
        );
        continue;
      }

      const refQuestion = questions.find((question) => question.item.id === refId);
      if (refQuestion && refQuestion.item.cert !== item.cert) {
        errors.push(
          `${file.relPath}: relatedQuestionIds references question "${refId}" from cert "${refQuestion.item.cert}", but this concept card is cert "${item.cert}"`,
        );
      }
    }
  }

  return errors;
}

export function generateCatalog(
  questions: Question[],
  conceptCards: ConceptCard[],
): string {
  const meta: Record<string, { questions: number; conceptCards: number }> = {};

  for (const cert of CERTIFICATIONS) {
    meta[cert] = { questions: 0, conceptCards: 0 };
  }

  for (const question of questions) {
    meta[question.cert].questions++;
  }

  for (const conceptCard of conceptCards) {
    meta[conceptCard.cert].conceptCards++;
  }

  const lines: string[] = [];
  lines.push("/**");
  lines.push(" * AUTO-GENERATED by scripts/build-content.ts - do not edit by hand.");
  lines.push(" * Regenerate with: pnpm content:build");
  lines.push(" */");
  lines.push('import "server-only";');
  lines.push("");
  lines.push('import type { Question } from "../types/question";');
  lines.push('import type { ConceptCard } from "../types/concept";');
  lines.push('import type { Certification } from "../types/shared";');
  lines.push("");
  lines.push(
    `export const questions: Question[] = ${JSON.stringify(questions, null, 2)};`,
  );
  lines.push("");
  lines.push(
    `export const conceptCards: ConceptCard[] = ${JSON.stringify(conceptCards, null, 2)};`,
  );
  lines.push("");
  lines.push(
    `export const contentCatalogMeta: Record<Certification, { questions: number; conceptCards: number }> = ${JSON.stringify(meta, null, 2)};`,
  );
  lines.push("");

  return lines.join("\n");
}

function formatErrors(errors: string[]) {
  const lines = ["", "content:build failed with errors:", ""];

  for (const error of errors) {
    lines.push(`  x ${error}`);
  }

  lines.push("", `${errors.length} error(s) found.`);
  return lines.join("\n");
}

export function buildContent(
  options: BuildContentOptions = {},
): BuildContentResult {
  const rootDir = options.rootDir ?? DEFAULT_ROOT;
  const contentDir = options.contentDir ?? DEFAULT_CONTENT_DIR;
  const outputPath = options.outputPath ?? DEFAULT_OUTPUT_PATH;
  const logger = options.logger ?? console;

  logger.log("content:build - discovering content files...");

  const files = discoverJsonFiles(contentDir, rootDir);
  logger.log(`  found ${files.length} JSON file(s)`);

  const { questions, conceptCards, errors: stage1Errors } = stage1Validate(files);
  const stage2Errors = stage2Validate(questions, conceptCards);
  const allErrors = [...stage1Errors, ...stage2Errors];

  if (allErrors.length > 0) {
    throw new ContentBuildError(allErrors);
  }

  const sortedQuestions = questions
    .map((question) => question.item)
    .sort((a, b) => a.id.localeCompare(b.id));
  const sortedConceptCards = conceptCards
    .map((conceptCard) => conceptCard.item)
    .sort((a, b) => a.id.localeCompare(b.id));
  const output = generateCatalog(sortedQuestions, sortedConceptCards);
  const outDir = path.dirname(outputPath);

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, output, "utf-8");

  logger.log("\ncontent:build succeeded");
  logger.log(`  questions:     ${sortedQuestions.length}`);
  logger.log(`  concept cards: ${sortedConceptCards.length}`);
  logger.log(`  output:        ${relFromRoot(rootDir, outputPath)}`);

  return {
    questions: sortedQuestions,
    conceptCards: sortedConceptCards,
    outputPath,
  };
}

function main() {
  try {
    buildContent();
  } catch (error) {
    if (error instanceof ContentBuildError) {
      console.error(formatErrors(error.errors));
      process.exit(1);
    }

    throw error;
  }
}

const isEntrypoint =
  Boolean(process.argv[1]) &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntrypoint) {
  main();
}
