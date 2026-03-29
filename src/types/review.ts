import type { Certification, Domain } from "./shared";

/** Flashcard spaced-repetition states. */
export type FlashcardState = "new" | "learning" | "review" | "lapsed";

/** Recall strength ratings for flashcard review. */
export type RecallRating = "forgot" | "hard" | "good" | "easy";

export interface FlashcardReviewItem {
  cardId: string;
  cert: Certification;
  domain: Domain;
  state: FlashcardState;
  ease: number;
  intervalDays: number;
  dueAt: string;
  repetitions: number;
  lapseCount: number;
  lastReviewedAt?: string;
  lastRating?: RecallRating;
}

/** Question retry queue states. */
export type RetryStatus = "queued" | "due" | "cleared";

/** Self-assessed confidence after answering. */
export type Confidence = "low" | "medium" | "high";

/** Result of a question attempt. */
export type AttemptResult = "correct" | "incorrect";

export interface QuestionRetryItem {
  questionId: string;
  cert: Certification;
  domain: Domain;
  status: RetryStatus;
  intervalDays: number;
  dueAt: string;
  retryCount: number;
  lastAttemptResult?: AttemptResult;
  lastConfidence?: Confidence;
  lastReviewedAt?: string;
}
