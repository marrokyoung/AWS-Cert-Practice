/**
 * Flashcard Review scheduler seam.
 *
 * Placeholder scheduling — Sprint 2 will replace these intervals and the
 * `ease` adjustment with a real SM-2-style algorithm. The interface is
 * locked now so the Review UI and persistence layers can be wired against
 * stable types without churn when the real algorithm lands.
 *
 * Safe to import from Server and Client Components: no DOM, no storage,
 * no fetch. Deterministic given an explicit `now`.
 *
 * Sprint 1 hard rule: this module must not import from the Question Retry
 * seam — the two review tracks own independent scheduler state.
 */

import type { Certification, Domain } from "@/types/shared";
import type {
  FlashcardReviewItem,
  FlashcardState,
  RecallRating,
} from "@/types/review";

const MS_PER_DAY = 86_400_000;

export interface ScheduleFlashcardInput {
  item: FlashcardReviewItem;
  rating: RecallRating;
  now?: string;
}

export interface CreateInitialFlashcardItemInput {
  cardId: string;
  cert: Certification;
  domain: Domain;
  now?: string;
}

function addDaysIso(iso: string, days: number): string {
  return new Date(Date.parse(iso) + days * MS_PER_DAY).toISOString();
}

function nextInterval(rating: RecallRating, current: number): number {
  switch (rating) {
    case "forgot":
      return 1;
    case "hard":
      return Math.max(1, current);
    case "good":
      return Math.max(1, current * 2);
    case "easy":
      return Math.max(2, current * 3);
  }
}

function nextState(
  previous: FlashcardState,
  rating: RecallRating,
  nextRepetitions: number,
): FlashcardState {
  if (rating === "forgot") return "lapsed";
  switch (previous) {
    case "new":
      return "learning";
    case "learning":
      return nextRepetitions >= 2 ? "review" : "learning";
    case "review":
      return "review";
    case "lapsed":
      return "learning";
  }
}

/**
 * Apply a learner's recall rating to a flashcard and return the updated
 * item. Sprint 1 placeholder behavior: `forgot` is the only lapse;
 * `hard`/`good`/`easy` are all successful reps. `ease` is preserved as-is
 * — Sprint 2's SM-2 replacement will adjust it. `cardId`, `cert`, `domain`
 * are pure identity and never change.
 */
export function scheduleNextReview(
  input: ScheduleFlashcardInput,
): FlashcardReviewItem {
  const { item, rating } = input;
  const resolvedNow = input.now ?? new Date().toISOString();

  const isLapse = rating === "forgot";
  const nextRepetitions = isLapse ? item.repetitions : item.repetitions + 1;
  const nextLapseCount = isLapse ? item.lapseCount + 1 : item.lapseCount;
  const intervalDays = nextInterval(rating, item.intervalDays);
  const state = nextState(item.state, rating, nextRepetitions);

  return {
    cardId: item.cardId,
    cert: item.cert,
    domain: item.domain,
    ease: item.ease,
    state,
    intervalDays,
    dueAt: addDaysIso(resolvedNow, intervalDays),
    repetitions: nextRepetitions,
    lapseCount: nextLapseCount,
    lastReviewedAt: resolvedNow,
    lastRating: rating,
  };
}

/**
 * Return the subset of items currently due, sorted by `dueAt` ascending.
 *
 * Compares timestamps as parsed epoch ms so callers may pass any valid
 * ISO-8601 representation (`2026-06-06T00:00:00Z` and
 * `2026-06-06T00:00:00.000Z` are treated as the same instant).
 */
export function getDueFlashcards(
  items: readonly FlashcardReviewItem[],
  now?: string,
): FlashcardReviewItem[] {
  const resolvedNow = now ?? new Date().toISOString();
  const parsedNow = Date.parse(resolvedNow);
  return items
    .filter((item) => Date.parse(item.dueAt) <= parsedNow)
    .slice()
    .sort((a, b) => Date.parse(a.dueAt) - Date.parse(b.dueAt));
}

/**
 * Build a fresh review item for a card the learner has never seen.
 * Default `ease` of 2.5 matches the SM-2 starting value; Sprint 2 will
 * begin mutating it once the real algorithm lands.
 */
export function createInitialFlashcardItem(
  input: CreateInitialFlashcardItemInput,
): FlashcardReviewItem {
  const resolvedNow = input.now ?? new Date().toISOString();
  return {
    cardId: input.cardId,
    cert: input.cert,
    domain: input.domain,
    state: "new",
    ease: 2.5,
    intervalDays: 0,
    dueAt: resolvedNow,
    repetitions: 0,
    lapseCount: 0,
  };
}
