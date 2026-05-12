/**
 * Practice result boundary.
 *
 * UI components must not own where attempt results go. They call into
 * this module so future Question Retry, progress sync, and exam-mode
 * persistence can be wired in without changing the UI.
 *
 * Sprint 1 keeps this in-memory and side-effect free.
 */

import type { Certification, Domain } from "@/types/shared";
import type { AttemptResult, Confidence } from "@/types/review";
import type { QuestionEvaluation } from "./evaluate-question";

export interface PracticeQuestionResult {
  questionId: string;
  cert: Certification;
  domain: Domain;
  selectedAnswerIds: string[];
  correctAnswerIds: string[];
  result: AttemptResult;
  confidence: Confidence;
  retryCandidate: boolean;
  answeredAt: string;
  source: "practice";
}

export interface BuildPracticeQuestionResultInput {
  evaluation: QuestionEvaluation;
  cert: Certification;
  domain: Domain;
  confidence: Confidence;
  answeredAt?: string;
}

/**
 * A result is a retry candidate when the answer was wrong OR when the
 * learner was unsure (low/medium confidence) even if they got it right.
 * Future Question Retry scheduling can read this flag without re-running
 * the evaluation.
 */
export function isRetryCandidate(
  result: AttemptResult,
  confidence: Confidence,
): boolean {
  if (result === "incorrect") return true;
  return confidence === "low" || confidence === "medium";
}

/**
 * Build the result envelope. Pure — no storage, no clock dependence
 * unless answeredAt is omitted.
 */
export function buildPracticeQuestionResult({
  evaluation,
  cert,
  domain,
  confidence,
  answeredAt,
}: BuildPracticeQuestionResultInput): PracticeQuestionResult {
  return {
    questionId: evaluation.questionId,
    cert,
    domain,
    selectedAnswerIds: evaluation.selectedAnswerIds,
    correctAnswerIds: evaluation.correctAnswerIds,
    result: evaluation.result,
    confidence,
    retryCandidate: isRetryCandidate(evaluation.result, confidence),
    answeredAt: answeredAt ?? new Date().toISOString(),
    source: "practice",
  };
}

export interface RecordPracticeQuestionResultOutcome {
  recorded: true;
  result: PracticeQuestionResult;
}

/**
 * Record a practice attempt.
 *
 * In Sprint 1 this is intentionally a no-op pass-through: it accepts a
 * fully built result and echoes it back so the UI does not need to know
 * whether persistence is wired up yet. Step 11+ will replace the body
 * to dispatch into Question Retry / progress without changing callers.
 */
export function recordPracticeQuestionResult(
  result: PracticeQuestionResult,
): RecordPracticeQuestionResultOutcome {
  return { recorded: true, result };
}
