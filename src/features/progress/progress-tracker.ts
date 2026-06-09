/**
 * Progress aggregation seam.
 *
 * Aggregates the per-domain and per-cert progress shapes the Progress
 * page will render. Reads from the Practice result history plus both
 * review tracks (Flashcard scheduler items and Question Retry queue) —
 * the only module that is allowed to depend on both review tracks
 * because its job is precisely to summarize across them.
 *
 * Safe to import from Server and Client Components: no DOM, no storage,
 * no fetch. Deterministic given an explicit `now`.
 */

import {
  getDueFlashcards,
  getDueRetries,
} from "@/features/review";
import type { PracticeQuestionResult } from "@/features/practice";
import type { CertProgress, DomainProgress } from "@/types/progress";
import type { Certification, Domain } from "@/types/shared";
import type {
  FlashcardReviewItem,
  QuestionRetryItem,
} from "@/types/review";

export interface SummarizeDomainProgressInput {
  cert: Certification;
  domain: Domain;
  results: readonly PracticeQuestionResult[];
  flashcards: readonly FlashcardReviewItem[];
  retries: readonly QuestionRetryItem[];
  now?: string;
}

export interface SummarizeCertProgressInput {
  cert: Certification;
  domains: readonly Domain[];
  results: readonly PracticeQuestionResult[];
  flashcards: readonly FlashcardReviewItem[];
  retries: readonly QuestionRetryItem[];
  now?: string;
}

/**
 * Compute the per-domain progress summary.
 *
 * `conceptsViewed` is hardcoded to 0 in Sprint 1 — the Learn flow does
 * not yet emit viewed events. Sprint 2 will add an optional
 * `learnSession`/`viewedCardCount` input and populate this field then.
 */
export function summarizeDomainProgress(
  input: SummarizeDomainProgressInput,
): DomainProgress {
  const { cert, domain, results, flashcards, retries } = input;
  const resolvedNow = input.now ?? new Date().toISOString();

  let questionsAttempted = 0;
  let questionsCorrect = 0;
  for (const r of results) {
    if (r.cert !== cert || r.domain !== domain) continue;
    questionsAttempted += 1;
    if (r.result === "correct") questionsCorrect += 1;
  }

  const flashcardsDue = getDueFlashcards(flashcards, resolvedNow).filter(
    (f) => f.cert === cert && f.domain === domain,
  ).length;

  const retriesDue = getDueRetries(retries, resolvedNow).filter(
    (r) => r.cert === cert && r.domain === domain,
  ).length;

  return {
    domain,
    questionsAttempted,
    questionsCorrect,
    conceptsViewed: 0,
    flashcardsDue,
    retriesDue,
  };
}

/**
 * Compute the cert-level summary by folding `summarizeDomainProgress`
 * across the given domains. `lastStudiedAt` is the max `answeredAt`
 * across results whose cert matches AND whose domain is in the requested
 * list, or omitted if no such result exists.
 */
export function summarizeCertProgress(
  input: SummarizeCertProgressInput,
): CertProgress {
  const { cert, domains, results, flashcards, retries } = input;
  const resolvedNow = input.now ?? new Date().toISOString();

  const domainSummaries = domains.map((domain) =>
    summarizeDomainProgress({
      cert,
      domain,
      results,
      flashcards,
      retries,
      now: resolvedNow,
    }),
  );

  let totalQuestionsAttempted = 0;
  let totalQuestionsCorrect = 0;
  for (const d of domainSummaries) {
    totalQuestionsAttempted += d.questionsAttempted;
    totalQuestionsCorrect += d.questionsCorrect;
  }

  const domainSet = new Set<Domain>(domains);
  let lastStudiedAt: string | undefined;
  let lastStudiedAtMs = Number.NEGATIVE_INFINITY;
  for (const r of results) {
    if (r.cert !== cert) continue;
    if (!domainSet.has(r.domain)) continue;
    const ms = Date.parse(r.answeredAt);
    if (ms > lastStudiedAtMs) {
      lastStudiedAtMs = ms;
      lastStudiedAt = r.answeredAt;
    }
  }

  const summary: CertProgress = {
    cert,
    domains: domainSummaries,
    totalQuestionsAttempted,
    totalQuestionsCorrect,
  };
  if (lastStudiedAt !== undefined) summary.lastStudiedAt = lastStudiedAt;
  return summary;
}
