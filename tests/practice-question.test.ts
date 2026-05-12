import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPracticeQuestionResult,
  evaluateQuestion,
  isRetryCandidate,
  recordPracticeQuestionResult,
  type QuestionEvaluation,
} from "../src/features/practice";
import type { Question } from "../src/types/question";

function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: "saa-c03-secure-architectures-test-question",
    cert: "SAA-C03",
    domain: "secure-architectures",
    topic: "test",
    difficulty: "foundational",
    type: "multiple-choice",
    stem: "Test stem.",
    options: [
      { id: "a", text: "A" },
      { id: "b", text: "B" },
      { id: "c", text: "C" },
      { id: "d", text: "D" },
    ],
    correctAnswers: ["a"],
    explanation: "Because A.",
    distractorExplanations: { b: "Not B.", c: "Not C.", d: "Not D." },
    awsSourceUrls: ["https://docs.aws.amazon.com/example.html"],
    examVersion: "SAA-C03",
    tags: ["test"],
    status: "ready",
    ...overrides,
  };
}

test("evaluateQuestion: exact answer match is correct", () => {
  const result = evaluateQuestion(makeQuestion(), ["a"]);
  assert.equal(result.isCorrect, true);
  assert.equal(result.result, "correct");
});

test("evaluateQuestion: answer order does not matter", () => {
  const q = makeQuestion({
    type: "multiple-select",
    correctAnswers: ["a", "c"],
  });
  const result = evaluateQuestion(q, ["c", "a"]);
  assert.equal(result.isCorrect, true);
  assert.deepEqual(result.selectedAnswerIds, ["a", "c"]);
  assert.deepEqual(result.correctAnswerIds, ["a", "c"]);
});

test("evaluateQuestion: extra answer is incorrect", () => {
  const q = makeQuestion({ type: "multiple-select", correctAnswers: ["a"] });
  const result = evaluateQuestion(q, ["a", "b"]);
  assert.equal(result.isCorrect, false);
  assert.equal(result.result, "incorrect");
});

test("evaluateQuestion: missing answer is incorrect", () => {
  const q = makeQuestion({
    type: "multiple-select",
    correctAnswers: ["a", "b"],
  });
  const result = evaluateQuestion(q, ["a"]);
  assert.equal(result.isCorrect, false);
  assert.equal(result.result, "incorrect");
});

test("evaluateQuestion: duplicate selections are deduped before compare", () => {
  const result = evaluateQuestion(makeQuestion(), ["a", "a"]);
  assert.equal(result.isCorrect, true);
  assert.deepEqual(result.selectedAnswerIds, ["a"]);
});

test("evaluateQuestion: empty selection on a question with answers is incorrect", () => {
  const result = evaluateQuestion(makeQuestion(), []);
  assert.equal(result.isCorrect, false);
});

test("isRetryCandidate: incorrect with high confidence is a candidate", () => {
  assert.equal(isRetryCandidate("incorrect", "high"), true);
});

test("isRetryCandidate: correct with low confidence is a candidate", () => {
  assert.equal(isRetryCandidate("correct", "low"), true);
});

test("isRetryCandidate: correct with medium confidence is a candidate", () => {
  assert.equal(isRetryCandidate("correct", "medium"), true);
});

test("isRetryCandidate: correct with high confidence is not a candidate", () => {
  assert.equal(isRetryCandidate("correct", "high"), false);
});

test("buildPracticeQuestionResult: shapes the result for the retry boundary", () => {
  const evaluation: QuestionEvaluation = {
    questionId: "q1",
    selectedAnswerIds: ["b"],
    correctAnswerIds: ["a"],
    result: "incorrect",
    isCorrect: false,
  };
  const built = buildPracticeQuestionResult({
    evaluation,
    cert: "SAA-C03",
    domain: "secure-architectures",
    confidence: "high",
    answeredAt: "2026-05-10T00:00:00.000Z",
  });

  assert.equal(built.questionId, "q1");
  assert.equal(built.cert, "SAA-C03");
  assert.equal(built.domain, "secure-architectures");
  assert.equal(built.result, "incorrect");
  assert.equal(built.confidence, "high");
  assert.equal(built.retryCandidate, true);
  assert.equal(built.source, "practice");
  assert.equal(built.answeredAt, "2026-05-10T00:00:00.000Z");
  assert.deepEqual(built.selectedAnswerIds, ["b"]);
  assert.deepEqual(built.correctAnswerIds, ["a"]);
});

test("buildPracticeQuestionResult: defaults answeredAt to an ISO timestamp", () => {
  const built = buildPracticeQuestionResult({
    evaluation: {
      questionId: "q1",
      selectedAnswerIds: ["a"],
      correctAnswerIds: ["a"],
      result: "correct",
      isCorrect: true,
    },
    cert: "SAA-C03",
    domain: "secure-architectures",
    confidence: "high",
  });
  assert.match(
    built.answeredAt,
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/,
  );
});

test("recordPracticeQuestionResult: echoes the result through the boundary", () => {
  const built = buildPracticeQuestionResult({
    evaluation: {
      questionId: "q1",
      selectedAnswerIds: ["a"],
      correctAnswerIds: ["a"],
      result: "correct",
      isCorrect: true,
    },
    cert: "SAA-C03",
    domain: "secure-architectures",
    confidence: "high",
  });
  const outcome = recordPracticeQuestionResult(built);
  assert.equal(outcome.recorded, true);
  assert.strictEqual(outcome.result, built);
});
