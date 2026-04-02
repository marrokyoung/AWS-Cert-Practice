import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import test from "node:test";

import {
  buildContent,
  ContentBuildError,
} from "../scripts/build-content";
import { awsSourceUrlSchema, awsSourceUrlsSchema } from "../src/schemas/aws-source-url";
import { conceptCardSchema } from "../src/schemas/concept.schema";
import { questionSchema } from "../src/schemas/question.schema";

const silentLogger = {
  error() {},
  log() {},
};

function createQuestion(overrides: Record<string, unknown> = {}) {
  return {
    id: "clf-c02-cloud-concepts-shared-responsibility-001",
    cert: "CLF-C02",
    domain: "cloud-concepts",
    topic: "shared-responsibility",
    difficulty: "foundational",
    type: "multiple-choice",
    stem: "Who is responsible for the physical security of AWS data centers?",
    options: [
      { id: "a", text: "AWS" },
      { id: "b", text: "The customer" },
      { id: "c", text: "The AWS Partner Network" },
    ],
    correctAnswers: ["a"],
    explanation:
      "AWS is responsible for security of the cloud, including the facilities that run AWS services.",
    distractorExplanations: {
      b: "Customers are responsible for what they run in the cloud, not the physical facilities.",
      c: "AWS partners do not operate AWS data centers.",
    },
    awsSourceUrls: [
      "https://docs.aws.amazon.com/whitepapers/latest/aws-risk-and-compliance/shared-responsibility-model.html",
    ],
    examVersion: "CLF-C02",
    tags: ["shared-responsibility", "security"],
    status: "ready",
    ...overrides,
  };
}

function createConceptCard(overrides: Record<string, unknown> = {}) {
  return {
    id: "clf-c02-cloud-concepts-shared-responsibility-card",
    cert: "CLF-C02",
    domain: "cloud-concepts",
    topic: "shared-responsibility",
    type: "concept",
    title: "Shared Responsibility Model",
    front:
      "Who handles physical data center security under the shared responsibility model?",
    back:
      "AWS handles the physical security of the facilities and infrastructure that run AWS services.",
    relatedQuestionIds: ["clf-c02-cloud-concepts-shared-responsibility-001"],
    awsSourceUrls: [
      "https://docs.aws.amazon.com/whitepapers/latest/aws-risk-and-compliance/shared-responsibility-model.html",
    ],
    tags: ["shared-responsibility", "security"],
    status: "ready",
    ...overrides,
  };
}

function writeJson(rootDir: string, relPath: string, value: unknown) {
  const absPath = path.join(rootDir, relPath);
  fs.mkdirSync(path.dirname(absPath), { recursive: true });
  fs.writeFileSync(absPath, JSON.stringify(value, null, 2), "utf-8");
}

function withTempRepo(run: (rootDir: string) => void) {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "aws-cert-practice-"));

  try {
    run(rootDir);
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
}

test("awsSourceUrlSchema accepts docs.aws.amazon.com over https", () => {
  assert.equal(
    awsSourceUrlSchema.parse(
      "https://docs.aws.amazon.com/lambda/latest/dg/welcome.html",
    ),
    "https://docs.aws.amazon.com/lambda/latest/dg/welcome.html",
  );

  assert.equal(
    awsSourceUrlSchema.parse("https://DOCS.AWS.AMAZON.COM/ec2/"),
    "https://DOCS.AWS.AMAZON.COM/ec2/",
  );
});

test("awsSourceUrlsSchema rejects non-docs hosts, http, and empty arrays", () => {
  assert.equal(
    awsSourceUrlSchema.safeParse("http://docs.aws.amazon.com/ec2/").success,
    false,
  );
  assert.equal(
    awsSourceUrlSchema.safeParse("https://aws.amazon.com/ec2/").success,
    false,
  );
  assert.equal(
    awsSourceUrlSchema.safeParse("https://docs.aws.amazon.com.evil.com/ec2/").success,
    false,
  );
  assert.equal(awsSourceUrlsSchema.safeParse([]).success, false);
});

test("question and concept schemas accept ready status and reject removed statuses", () => {
  assert.equal(questionSchema.safeParse(createQuestion()).success, true);
  assert.equal(conceptCardSchema.safeParse(createConceptCard()).success, true);
  assert.equal(
    questionSchema.safeParse(createQuestion({ status: "verified" })).success,
    false,
  );
  assert.equal(
    conceptCardSchema.safeParse(createConceptCard({ status: "community" })).success,
    false,
  );
});

test("buildContent writes a server-only catalog for valid content", () => {
  withTempRepo((rootDir) => {
    writeJson(
      rootDir,
      "content/CLF-C02/domains/cloud-concepts/questions/clf-c02-cloud-concepts-shared-responsibility-001.json",
      createQuestion(),
    );
    writeJson(
      rootDir,
      "content/CLF-C02/domains/cloud-concepts/concepts/clf-c02-cloud-concepts-shared-responsibility-card.json",
      createConceptCard(),
    );

    const outputPath = path.join(rootDir, "src", "generated", "content-catalog.ts");
    const result = buildContent({
      rootDir,
      contentDir: path.join(rootDir, "content"),
      outputPath,
      logger: silentLogger,
    });

    assert.equal(result.questions.length, 1);
    assert.equal(result.conceptCards.length, 1);

    const output = fs.readFileSync(outputPath, "utf-8");
    assert.match(output, /import "server-only";/);
    assert.match(output, /export const questions: Question\[] = \[/);
    assert.match(output, /export const conceptCards: ConceptCard\[] = \[/);
    assert.match(output, /"questions": 1/);
    assert.match(output, /"conceptCards": 1/);
  });
});

test("buildContent fails repo-level validation for invalid ids and broken references", () => {
  withTempRepo((rootDir) => {
    writeJson(
      rootDir,
      "content/CLF-C02/domains/cloud-concepts/questions/Bad_ID.json",
      createQuestion({ id: "Bad_ID" }),
    );
    writeJson(
      rootDir,
      "content/CLF-C02/domains/cloud-concepts/concepts/clf-c02-cloud-concepts-broken-reference.json",
      createConceptCard({
        id: "clf-c02-cloud-concepts-broken-reference",
        relatedQuestionIds: ["missing-question-id"],
      }),
    );

    const outputPath = path.join(rootDir, "src", "generated", "content-catalog.ts");

    assert.throws(
      () =>
        buildContent({
          rootDir,
          contentDir: path.join(rootDir, "content"),
          outputPath,
          logger: silentLogger,
        }),
      (error: unknown) => {
        assert.ok(error instanceof ContentBuildError);
        assert.match(error.errors.join("\n"), /not lowercase kebab-case/);
        assert.match(
          error.errors.join("\n"),
          /references unknown question "missing-question-id"/,
        );
        return true;
      },
    );
  });
});
