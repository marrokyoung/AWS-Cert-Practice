import assert from "node:assert/strict";
import test from "node:test";

import {
  createPracticeSession,
  recordResult,
  selectNextQuestion,
  summarizeSession,
} from "../src/features/sessions/practice-session";
import type { PracticeQuestionResult } from "../src/features/practice";

const NOW = "2026-06-06T00:00:00.000Z";

function makeResult(
  overrides: Partial<PracticeQuestionResult> = {},
): PracticeQuestionResult {
  return {
    questionId: "q1",
    cert: "SAA-C03",
    domain: "secure-architectures",
    selectedAnswerIds: ["a"],
    correctAnswerIds: ["a"],
    result: "correct",
    confidence: "high",
    retryCandidate: false,
    answeredAt: NOW,
    source: "practice",
    ...overrides,
  };
}

test("createPracticeSession: defaults domain to null when omitted", () => {
  const state = createPracticeSession({ cert: "SAA-C03", now: NOW });
  assert.equal(state.cert, "SAA-C03");
  assert.equal(state.domain, null);
  assert.equal(state.startedAt, NOW);
  assert.deepEqual(state.results, []);
  assert.equal(state.currentQuestionId, null);
});

test("createPracticeSession: honors a provided domain", () => {
  const state = createPracticeSession({
    cert: "SAA-C03",
    domain: "resilient-architectures",
    now: NOW,
  });
  assert.equal(state.domain, "resilient-architectures");
});

test("recordResult: appends a new result and updates currentQuestionId", () => {
  const start = createPracticeSession({ cert: "SAA-C03", now: NOW });
  const next = recordResult(start, makeResult({ questionId: "q1" }));
  assert.equal(next.results.length, 1);
  assert.equal(next.currentQuestionId, "q1");
});

test("recordResult: replaces a same-questionId entry instead of duplicating", () => {
  const start = createPracticeSession({ cert: "SAA-C03", now: NOW });
  const first = recordResult(
    start,
    makeResult({ questionId: "q1", result: "incorrect", retryCandidate: true }),
  );
  const replaced = recordResult(
    first,
    makeResult({ questionId: "q1", result: "correct", retryCandidate: false }),
  );
  assert.equal(replaced.results.length, 1);
  assert.equal(replaced.results[0].result, "correct");
  assert.equal(replaced.results[0].retryCandidate, false);
});

test("recordResult: does not mutate the input state", () => {
  const start = createPracticeSession({ cert: "SAA-C03", now: NOW });
  recordResult(start, makeResult({ questionId: "q1" }));
  assert.equal(start.results.length, 0);
  assert.equal(start.currentQuestionId, null);
});

test("selectNextQuestion: returns the first unanswered id preserving order", () => {
  const start = createPracticeSession({ cert: "SAA-C03", now: NOW });
  const next = recordResult(start, makeResult({ questionId: "q1" }));
  assert.equal(selectNextQuestion(next, ["q1", "q2", "q3"]), "q2");
});

test("selectNextQuestion: returns null when all are answered", () => {
  const start = createPracticeSession({ cert: "SAA-C03", now: NOW });
  const next = recordResult(
    recordResult(start, makeResult({ questionId: "q1" })),
    makeResult({ questionId: "q2" }),
  );
  assert.equal(selectNextQuestion(next, ["q1", "q2"]), null);
});

test("summarizeSession: counts correct, incorrect, and retry candidates", () => {
  const start = createPracticeSession({ cert: "SAA-C03", now: NOW });
  const s1 = recordResult(
    start,
    makeResult({
      questionId: "q1",
      result: "incorrect",
      retryCandidate: true,
    }),
  );
  const s2 = recordResult(
    s1,
    makeResult({
      questionId: "q2",
      result: "correct",
      confidence: "low",
      retryCandidate: true,
    }),
  );
  const s3 = recordResult(
    s2,
    makeResult({
      questionId: "q3",
      result: "correct",
      confidence: "high",
      retryCandidate: false,
    }),
  );
  const summary = summarizeSession(s3);
  assert.equal(summary.total, 3);
  assert.equal(summary.correct, 2);
  assert.equal(summary.incorrect, 1);
  assert.equal(summary.retryCandidates, 2);
});

test("summarizeSession: empty session returns all zeros", () => {
  const start = createPracticeSession({ cert: "SAA-C03", now: NOW });
  assert.deepEqual(summarizeSession(start), {
    total: 0,
    correct: 0,
    incorrect: 0,
    retryCandidates: 0,
  });
});
