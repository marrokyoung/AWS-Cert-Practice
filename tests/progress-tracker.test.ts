import assert from "node:assert/strict";
import test from "node:test";

import {
  summarizeCertProgress,
  summarizeDomainProgress,
} from "../src/features/progress/progress-tracker";
import type { PracticeQuestionResult } from "../src/features/practice";
import type {
  FlashcardReviewItem,
  QuestionRetryItem,
} from "../src/types/review";

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
    answeredAt: "2026-06-01T00:00:00.000Z",
    source: "practice",
    ...overrides,
  };
}

function makeFlashcard(
  overrides: Partial<FlashcardReviewItem> = {},
): FlashcardReviewItem {
  return {
    cardId: "card-1",
    cert: "SAA-C03",
    domain: "secure-architectures",
    state: "review",
    ease: 2.5,
    intervalDays: 1,
    dueAt: "2026-06-05T00:00:00.000Z",
    repetitions: 3,
    lapseCount: 0,
    ...overrides,
  };
}

function makeRetry(
  overrides: Partial<QuestionRetryItem> = {},
): QuestionRetryItem {
  return {
    questionId: "q1",
    cert: "SAA-C03",
    domain: "secure-architectures",
    status: "queued",
    intervalDays: 1,
    dueAt: "2026-06-05T00:00:00.000Z",
    retryCount: 1,
    ...overrides,
  };
}

test("summarizeDomainProgress: zero counts on empty input", () => {
  const summary = summarizeDomainProgress({
    cert: "SAA-C03",
    domain: "secure-architectures",
    results: [],
    flashcards: [],
    retries: [],
    now: NOW,
  });
  assert.deepEqual(summary, {
    domain: "secure-architectures",
    questionsAttempted: 0,
    questionsCorrect: 0,
    conceptsViewed: 0,
    flashcardsDue: 0,
    retriesDue: 0,
  });
});

test("summarizeDomainProgress: counts only results for the requested cert+domain", () => {
  const results = [
    makeResult({ questionId: "q1", result: "correct" }),
    makeResult({ questionId: "q2", result: "incorrect" }),
    makeResult({ questionId: "q3", cert: "CLF-C02", domain: "cloud-concepts" }),
    makeResult({ questionId: "q4", domain: "resilient-architectures" }),
  ];
  const summary = summarizeDomainProgress({
    cert: "SAA-C03",
    domain: "secure-architectures",
    results,
    flashcards: [],
    retries: [],
    now: NOW,
  });
  assert.equal(summary.questionsAttempted, 2);
  assert.equal(summary.questionsCorrect, 1);
});

test("summarizeDomainProgress: flashcardsDue counts only matching cert+domain and only due items", () => {
  const flashcards = [
    makeFlashcard({ cardId: "due-here" }),
    makeFlashcard({ cardId: "future", dueAt: "2030-01-01T00:00:00.000Z" }),
    makeFlashcard({ cardId: "other-domain", domain: "resilient-architectures" }),
    makeFlashcard({ cardId: "other-cert", cert: "CLF-C02", domain: "cloud-concepts" }),
  ];
  const summary = summarizeDomainProgress({
    cert: "SAA-C03",
    domain: "secure-architectures",
    results: [],
    flashcards,
    retries: [],
    now: NOW,
  });
  assert.equal(summary.flashcardsDue, 1);
});

test("summarizeDomainProgress: retriesDue ignores cleared and cross-cert/domain rows", () => {
  const retries = [
    makeRetry({ questionId: "due-here" }),
    makeRetry({ questionId: "cleared", status: "cleared" }),
    makeRetry({ questionId: "future", dueAt: "2030-01-01T00:00:00.000Z" }),
    makeRetry({ questionId: "other-cert", cert: "CLF-C02", domain: "cloud-concepts" }),
  ];
  const summary = summarizeDomainProgress({
    cert: "SAA-C03",
    domain: "secure-architectures",
    results: [],
    flashcards: [],
    retries,
    now: NOW,
  });
  assert.equal(summary.retriesDue, 1);
});

test("summarizeDomainProgress: conceptsViewed is always 0 in Sprint 1", () => {
  const summary = summarizeDomainProgress({
    cert: "SAA-C03",
    domain: "secure-architectures",
    results: [],
    flashcards: [],
    retries: [],
    now: NOW,
  });
  assert.equal(summary.conceptsViewed, 0);
});

test("summarizeCertProgress: sums attempted/correct across the listed domains", () => {
  const results = [
    makeResult({ questionId: "q1", domain: "secure-architectures", result: "correct" }),
    makeResult({ questionId: "q2", domain: "secure-architectures", result: "incorrect" }),
    makeResult({ questionId: "q3", domain: "resilient-architectures", result: "correct" }),
  ];
  const summary = summarizeCertProgress({
    cert: "SAA-C03",
    domains: ["secure-architectures", "resilient-architectures"],
    results,
    flashcards: [],
    retries: [],
    now: NOW,
  });
  assert.equal(summary.totalQuestionsAttempted, 3);
  assert.equal(summary.totalQuestionsCorrect, 2);
  assert.equal(summary.domains.length, 2);
});

test("summarizeCertProgress: lastStudiedAt is the max answeredAt across matching results", () => {
  const results = [
    makeResult({ questionId: "q1", answeredAt: "2026-06-01T00:00:00.000Z" }),
    makeResult({ questionId: "q2", answeredAt: "2026-06-04T00:00:00.000Z" }),
    makeResult({
      questionId: "q3",
      domain: "resilient-architectures",
      answeredAt: "2026-06-03T00:00:00.000Z",
    }),
    // Excluded: wrong cert.
    makeResult({
      questionId: "q4",
      cert: "CLF-C02",
      domain: "cloud-concepts",
      answeredAt: "2026-06-05T00:00:00.000Z",
    }),
  ];
  const summary = summarizeCertProgress({
    cert: "SAA-C03",
    domains: ["secure-architectures", "resilient-architectures"],
    results,
    flashcards: [],
    retries: [],
    now: NOW,
  });
  assert.equal(summary.lastStudiedAt, "2026-06-04T00:00:00.000Z");
});

test("summarizeCertProgress: omits lastStudiedAt when no qualifying result exists", () => {
  const results = [
    makeResult({
      cert: "CLF-C02",
      domain: "cloud-concepts",
      answeredAt: "2026-06-05T00:00:00.000Z",
    }),
  ];
  const summary = summarizeCertProgress({
    cert: "SAA-C03",
    domains: ["secure-architectures"],
    results,
    flashcards: [],
    retries: [],
    now: NOW,
  });
  assert.equal(summary.lastStudiedAt, undefined);
  assert.equal(Object.prototype.hasOwnProperty.call(summary, "lastStudiedAt"), false);
});

test("summarizeCertProgress: lastStudiedAt uses chronological (not lexical) ordering across ISO formats", () => {
  // Lexically "2026-06-06T00:00:00Z" > "2026-06-06T00:00:00.001Z" (no-ms beats ms in string sort),
  // but chronologically the .001Z value is later by 1 ms.
  const results = [
    makeResult({ questionId: "earlier", answeredAt: "2026-06-06T00:00:00Z" }),
    makeResult({ questionId: "later", answeredAt: "2026-06-06T00:00:00.001Z" }),
  ];
  const summary = summarizeCertProgress({
    cert: "SAA-C03",
    domains: ["secure-architectures"],
    results,
    flashcards: [],
    retries: [],
    now: NOW,
  });
  assert.equal(summary.lastStudiedAt, "2026-06-06T00:00:00.001Z");
});

test("summarizeCertProgress: lastStudiedAt ignores results whose domain is not in the list", () => {
  const results = [
    makeResult({
      questionId: "q-in-list",
      domain: "secure-architectures",
      answeredAt: "2026-06-01T00:00:00.000Z",
    }),
    makeResult({
      questionId: "q-not-in-list",
      domain: "resilient-architectures",
      answeredAt: "2026-06-04T00:00:00.000Z",
    }),
  ];
  const summary = summarizeCertProgress({
    cert: "SAA-C03",
    domains: ["secure-architectures"],
    results,
    flashcards: [],
    retries: [],
    now: NOW,
  });
  assert.equal(summary.lastStudiedAt, "2026-06-01T00:00:00.000Z");
});

test("summarizeCertProgress: forwards flashcards and retries to per-domain summaries", () => {
  const flashcards = [
    makeFlashcard({ cardId: "secure", domain: "secure-architectures" }),
    makeFlashcard({ cardId: "resilient", domain: "resilient-architectures" }),
  ];
  const retries = [
    makeRetry({ questionId: "secure", domain: "secure-architectures" }),
    makeRetry({ questionId: "resilient", domain: "resilient-architectures" }),
  ];
  const summary = summarizeCertProgress({
    cert: "SAA-C03",
    domains: ["secure-architectures", "resilient-architectures"],
    results: [],
    flashcards,
    retries,
    now: NOW,
  });
  const secure = summary.domains.find((d) => d.domain === "secure-architectures");
  const resilient = summary.domains.find((d) => d.domain === "resilient-architectures");
  assert.ok(secure);
  assert.ok(resilient);
  assert.equal(secure.flashcardsDue, 1);
  assert.equal(secure.retriesDue, 1);
  assert.equal(resilient.flashcardsDue, 1);
  assert.equal(resilient.retriesDue, 1);
});
