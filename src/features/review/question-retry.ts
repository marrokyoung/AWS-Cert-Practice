/**
 * Question Retry queue seam.
 *
 * Receives results from Practice (and later Exam) and decides whether to
 * enqueue, bump, or clear a question. Sprint 1 ships placeholder
 * doubling intervals; Sprint 2 will replace the policy. The shape is
 * locked so persistence and Review UI can be built against stable types.
 *
 * Sprint 1 hard rule: this module must not import from the Flashcard
 * scheduler — the two review tracks are independent.
 *
 * Safe to import from Server and Client Components: no DOM, no storage,
 * no fetch. Deterministic given an explicit `now`.
 */

import type { PracticeQuestionResult } from "@/features/practice";
import type { QuestionRetryItem } from "@/types/review";

const MS_PER_DAY = 86_400_000;

export interface EnqueueRetryInput {
  existing: readonly QuestionRetryItem[];
  result: PracticeQuestionResult;
  now?: string;
}

export interface ClearRetryInput {
  existing: readonly QuestionRetryItem[];
  questionId: string;
  now?: string;
}

function addDaysIso(iso: string, days: number): string {
  return new Date(Date.parse(iso) + days * MS_PER_DAY).toISOString();
}

/**
 * Mark a queued item as cleared while preserving the row so the progress
 * tracker can still see the history. Returns `existing` unchanged when
 * the question is not in the queue.
 */
export function clearRetry(input: ClearRetryInput): QuestionRetryItem[] {
  const resolvedNow = input.now ?? new Date().toISOString();
  let touched = false;
  const next = input.existing.map((item) => {
    if (item.questionId !== input.questionId) return item;
    touched = true;
    return {
      ...item,
      status: "cleared" as const,
      lastReviewedAt: resolvedNow,
    };
  });
  return touched ? next : input.existing.slice();
}

/**
 * Apply a practice result to the retry queue.
 *
 * - A high-confidence correct on a queued item clears it.
 * - A non-candidate (e.g. high-confidence correct) on a question not
 *   already queued is a no-op.
 * - Anything else enqueues a new row or bumps the existing one with a
 *   doubled interval (Sprint 2 will replace this policy).
 */
export function enqueueRetry(input: EnqueueRetryInput): QuestionRetryItem[] {
  const { existing, result } = input;
  const resolvedNow = input.now ?? new Date().toISOString();
  const existingItem = existing.find(
    (item) => item.questionId === result.questionId,
  );

  if (
    existingItem &&
    result.result === "correct" &&
    result.confidence === "high"
  ) {
    return clearRetry({
      existing,
      questionId: result.questionId,
      now: resolvedNow,
    });
  }

  if (!existingItem && !result.retryCandidate) {
    return existing.slice();
  }

  const retryCount = (existingItem?.retryCount ?? 0) + 1;
  const intervalDays = existingItem ? existingItem.intervalDays * 2 : 1;
  const updated: QuestionRetryItem = {
    questionId: result.questionId,
    cert: result.cert,
    domain: result.domain,
    status: "queued",
    intervalDays,
    dueAt: addDaysIso(resolvedNow, intervalDays),
    retryCount,
    lastAttemptResult: result.result,
    lastConfidence: result.confidence,
    lastReviewedAt: result.answeredAt ?? resolvedNow,
  };

  if (!existingItem) {
    return [...existing, updated];
  }
  return existing.map((item) =>
    item.questionId === result.questionId ? updated : item,
  );
}

/**
 * Return non-cleared items whose `dueAt` has elapsed, sorted ascending.
 * Uses lexicographic ISO-8601 comparison (UTC `Z` throughout).
 */
export function getDueRetries(
  items: readonly QuestionRetryItem[],
  now?: string,
): QuestionRetryItem[] {
  const resolvedNow = now ?? new Date().toISOString();
  return items
    .filter((item) => item.status !== "cleared" && item.dueAt <= resolvedNow)
    .slice()
    .sort((a, b) => (a.dueAt < b.dueAt ? -1 : a.dueAt > b.dueAt ? 1 : 0));
}
