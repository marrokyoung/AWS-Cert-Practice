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

function isQueuedRetryForQuestion(
  item: QuestionRetryItem,
  questionId: string,
): boolean {
  return item.questionId === questionId && item.status === "queued";
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
    if (!isQueuedRetryForQuestion(item, input.questionId)) return item;
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
 * - A high-confidence correct on a queued item clears it AND updates
 *   `lastAttemptResult` / `lastConfidence` / `lastReviewedAt` /
 *   `cert` / `domain` from the result so the cleared row reflects the
 *   final correct attempt instead of the prior miss.
 * - A non-candidate (e.g. high-confidence correct) on a question not
 *   already queued is a no-op.
 * - Anything else enqueues a new row or bumps the existing one with a
 *   doubled interval (Sprint 2 will replace this policy).
 */
export function enqueueRetry(input: EnqueueRetryInput): QuestionRetryItem[] {
  const { existing, result } = input;
  const resolvedNow = input.now ?? new Date().toISOString();
  const existingItem = existing.find(
    (item) => isQueuedRetryForQuestion(item, result.questionId),
  );

  if (
    existingItem &&
    result.result === "correct" &&
    result.confidence === "high"
  ) {
    const cleared: QuestionRetryItem = {
      ...existingItem,
      cert: result.cert,
      domain: result.domain,
      status: "cleared",
      lastAttemptResult: result.result,
      lastConfidence: result.confidence,
      lastReviewedAt: result.answeredAt ?? resolvedNow,
    };
    return existing.map((item) =>
      isQueuedRetryForQuestion(item, result.questionId) ? cleared : item,
    );
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
    isQueuedRetryForQuestion(item, result.questionId) ? updated : item,
  );
}

/**
 * Return non-cleared items whose `dueAt` has elapsed, sorted ascending.
 * Compares parsed epoch ms so different ISO-8601 renderings of the same
 * instant are treated as equal.
 */
export function getDueRetries(
  items: readonly QuestionRetryItem[],
  now?: string,
): QuestionRetryItem[] {
  const resolvedNow = now ?? new Date().toISOString();
  const parsedNow = Date.parse(resolvedNow);
  return items
    .filter(
      (item) =>
        item.status !== "cleared" && Date.parse(item.dueAt) <= parsedNow,
    )
    .slice()
    .sort((a, b) => Date.parse(a.dueAt) - Date.parse(b.dueAt));
}
