import assert from "node:assert/strict";
import test from "node:test";

import {
  clearRetry,
  enqueueRetry,
  getDueRetries,
} from "../src/features/review/question-retry";
import type { PracticeQuestionResult } from "../src/features/practice";
import type { QuestionRetryItem } from "../src/types/review";

const NOW = "2026-06-06T00:00:00.000Z";
const EARLIER = "2026-06-05T00:00:00.000Z";
const LATER = "2026-06-07T00:00:00.000Z";

function makeResult(
  overrides: Partial<PracticeQuestionResult> = {},
): PracticeQuestionResult {
  return {
    questionId: "q1",
    cert: "SAA-C03",
    domain: "secure-architectures",
    selectedAnswerIds: ["a"],
    correctAnswerIds: ["a"],
    result: "incorrect",
    confidence: "medium",
    retryCandidate: true,
    answeredAt: NOW,
    source: "practice",
    ...overrides,
  };
}

function makeItem(overrides: Partial<QuestionRetryItem> = {}): QuestionRetryItem {
  return {
    questionId: "q1",
    cert: "SAA-C03",
    domain: "secure-architectures",
    status: "queued",
    intervalDays: 1,
    dueAt: NOW,
    retryCount: 1,
    lastAttemptResult: "incorrect",
    lastConfidence: "medium",
    lastReviewedAt: EARLIER,
    ...overrides,
  };
}

test("enqueueRetry: non-candidate with no existing entry is a no-op", () => {
  const result = makeResult({
    result: "correct",
    confidence: "high",
    retryCandidate: false,
  });
  const out = enqueueRetry({ existing: [], result, now: NOW });
  assert.deepEqual(out, []);
});

test("enqueueRetry: first incorrect result enqueues with retryCount=1, intervalDays=1", () => {
  const result = makeResult({ result: "incorrect", confidence: "high" });
  const out = enqueueRetry({ existing: [], result, now: NOW });
  assert.equal(out.length, 1);
  assert.equal(out[0].questionId, "q1");
  assert.equal(out[0].retryCount, 1);
  assert.equal(out[0].intervalDays, 1);
  assert.equal(out[0].status, "queued");
  assert.equal(out[0].dueAt, LATER);
  assert.equal(out[0].lastAttemptResult, "incorrect");
  assert.equal(out[0].lastConfidence, "high");
  assert.equal(out[0].lastReviewedAt, NOW);
  assert.equal(out[0].cert, "SAA-C03");
  assert.equal(out[0].domain, "secure-architectures");
});

test("enqueueRetry: repeat incorrect doubles intervalDays and bumps retryCount", () => {
  const existing = [makeItem({ retryCount: 1, intervalDays: 1 })];
  const result = makeResult({ result: "incorrect", confidence: "low" });
  const out = enqueueRetry({ existing, result, now: NOW });
  assert.equal(out.length, 1);
  assert.equal(out[0].retryCount, 2);
  assert.equal(out[0].intervalDays, 2);
  assert.equal(out[0].dueAt, "2026-06-08T00:00:00.000Z");
  assert.equal(out[0].lastConfidence, "low");
});

test("enqueueRetry: high-confidence correct on a queued item clears it (preserves row)", () => {
  const existing = [makeItem()];
  const result = makeResult({
    result: "correct",
    confidence: "high",
    retryCandidate: false,
  });
  const out = enqueueRetry({ existing, result, now: NOW });
  assert.equal(out.length, 1);
  assert.equal(out[0].status, "cleared");
  // lastReviewedAt comes from result.answeredAt (== NOW in this fixture).
  assert.equal(out[0].lastReviewedAt, NOW);
  // Scheduler fields preserved from the existing row.
  assert.equal(out[0].intervalDays, 1);
  assert.equal(out[0].retryCount, 1);
});

test("enqueueRetry: high-confidence correct clear overwrites stale attempt metadata", () => {
  const existing = [
    makeItem({
      lastAttemptResult: "incorrect",
      lastConfidence: "low",
      lastReviewedAt: EARLIER,
    }),
  ];
  const result = makeResult({
    result: "correct",
    confidence: "high",
    retryCandidate: false,
    answeredAt: NOW,
  });
  const out = enqueueRetry({ existing, result, now: LATER });
  assert.equal(out.length, 1);
  assert.equal(out[0].status, "cleared");
  assert.equal(out[0].lastAttemptResult, "correct");
  assert.equal(out[0].lastConfidence, "high");
  assert.equal(out[0].lastReviewedAt, NOW);
});

test("enqueueRetry: clear path falls back to resolvedNow when result.answeredAt is missing", () => {
  const existing = [makeItem()];
  const result = makeResult({
    result: "correct",
    confidence: "high",
    retryCandidate: false,
    answeredAt: undefined as unknown as string,
  });
  const out = enqueueRetry({ existing, result, now: LATER });
  assert.equal(out[0].lastReviewedAt, LATER);
});

test("enqueueRetry: low-confidence correct on a queued item keeps it queued and bumps", () => {
  const existing = [makeItem({ retryCount: 2, intervalDays: 2 })];
  const result = makeResult({
    result: "correct",
    confidence: "low",
    retryCandidate: true,
  });
  const out = enqueueRetry({ existing, result, now: NOW });
  assert.equal(out.length, 1);
  assert.equal(out[0].status, "queued");
  assert.equal(out[0].retryCount, 3);
  assert.equal(out[0].intervalDays, 4);
  assert.equal(out[0].lastAttemptResult, "correct");
  assert.equal(out[0].lastConfidence, "low");
});

test("enqueueRetry: lastReviewedAt falls back to now when result.answeredAt is missing", () => {
  const result = makeResult({ answeredAt: undefined as unknown as string });
  const out = enqueueRetry({ existing: [], result, now: NOW });
  assert.equal(out[0].lastReviewedAt, NOW);
});

test("enqueueRetry: cert and domain on the new row come from the result", () => {
  const result = makeResult({
    cert: "CLF-C02",
    domain: "billing-pricing-support",
  });
  const out = enqueueRetry({ existing: [], result, now: NOW });
  assert.equal(out[0].cert, "CLF-C02");
  assert.equal(out[0].domain, "billing-pricing-support");
});

test("enqueueRetry: existing row for a different question is untouched", () => {
  const existing = [makeItem({ questionId: "q-other", intervalDays: 5 })];
  const result = makeResult({ questionId: "q1" });
  const out = enqueueRetry({ existing, result, now: NOW });
  assert.equal(out.length, 2);
  const other = out.find((i) => i.questionId === "q-other");
  assert.ok(other);
  assert.equal(other.intervalDays, 5);
});

test("enqueueRetry: cleared history row is not treated as an active retry", () => {
  const existing = [makeItem({ questionId: "q1", status: "cleared" })];
  const result = makeResult({
    questionId: "q1",
    result: "correct",
    confidence: "high",
    retryCandidate: false,
  });
  const out = enqueueRetry({ existing, result, now: NOW });
  assert.equal(out.length, 1);
  assert.equal(out[0].questionId, "q1");
  assert.equal(out[0].status, "cleared");
});

test("clearRetry: marks the matching item cleared without removing the row", () => {
  const existing = [makeItem(), makeItem({ questionId: "q-other" })];
  const out = clearRetry({ existing, questionId: "q1", now: NOW });
  assert.equal(out.length, 2);
  const cleared = out.find((i) => i.questionId === "q1");
  assert.ok(cleared);
  assert.equal(cleared.status, "cleared");
  assert.equal(cleared.lastReviewedAt, NOW);
});

test("clearRetry: returns existing unchanged when no match", () => {
  const existing = [makeItem({ questionId: "q-other" })];
  const out = clearRetry({ existing, questionId: "missing", now: NOW });
  assert.deepEqual(out, existing);
});

test("getDueRetries: excludes cleared items", () => {
  const items = [
    makeItem({ status: "queued", dueAt: EARLIER }),
    makeItem({ questionId: "q-clear", status: "cleared", dueAt: EARLIER }),
  ];
  const due = getDueRetries(items, NOW);
  assert.equal(due.length, 1);
  assert.equal(due[0].questionId, "q1");
});

test("getDueRetries: equal instants with different ISO formats compare equal", () => {
  const items = [
    makeItem({ questionId: "no-ms", dueAt: "2026-06-06T00:00:00Z" }),
    makeItem({ questionId: "with-ms", dueAt: "2026-06-06T00:00:00.000Z" }),
  ];
  const due = getDueRetries(items, NOW);
  assert.equal(due.length, 2);
});

test("getDueRetries: excludes future-due items and sorts ascending", () => {
  const items = [
    makeItem({ questionId: "c", dueAt: "2026-06-04T00:00:00.000Z" }),
    makeItem({ questionId: "a", dueAt: "2026-06-02T00:00:00.000Z" }),
    makeItem({ questionId: "b", dueAt: "2026-06-03T00:00:00.000Z" }),
    makeItem({ questionId: "future", dueAt: "2030-01-01T00:00:00.000Z" }),
  ];
  const due = getDueRetries(items, NOW);
  assert.deepEqual(
    due.map((i) => i.questionId),
    ["a", "b", "c"],
  );
});
