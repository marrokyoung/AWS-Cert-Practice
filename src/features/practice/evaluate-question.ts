/**
 * Pure question evaluation logic.
 *
 * Has no UI, no storage, and no side effects so it can be reused by the
 * practice flow today and by Question Retry / future exam mode later.
 */

import type { Question } from "@/types/question";
import type { AttemptResult } from "@/types/review";

export type SelectedAnswerIds = readonly string[];

export interface QuestionEvaluation {
  questionId: string;
  selectedAnswerIds: string[];
  correctAnswerIds: string[];
  result: AttemptResult;
  isCorrect: boolean;
}

function toUniqueSortedIds(ids: readonly string[]): string[] {
  return Array.from(new Set(ids)).sort();
}

function setsEqual(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Compare a user's selected answers against the question's correct set.
 *
 * Treats both sides as unordered sets. An exact match (no missing, no
 * extra answers) is required for "correct". Supports both
 * multiple-choice and multiple-select.
 */
export function evaluateQuestion(
  question: Question,
  selectedAnswerIds: SelectedAnswerIds,
): QuestionEvaluation {
  const normalizedSelected = toUniqueSortedIds(selectedAnswerIds);
  const normalizedCorrect = toUniqueSortedIds(question.correctAnswers);
  const isCorrect = setsEqual(normalizedSelected, normalizedCorrect);

  return {
    questionId: question.id,
    selectedAnswerIds: normalizedSelected,
    correctAnswerIds: normalizedCorrect,
    result: isCorrect ? "correct" : "incorrect",
    isCorrect,
  };
}
