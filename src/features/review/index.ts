/**
 * Review feature boundary.
 *
 * Owns the two independent review tracks: Flashcard Review (spaced
 * repetition over concept cards) and Question Retry (re-queueing missed
 * or low-confidence practice questions). The two tracks deliberately do
 * not share scheduler state; the progress tracker aggregates across them.
 *
 * Safe to import from Server and Client Components.
 */

export {
  createInitialFlashcardItem,
  getDueFlashcards,
  scheduleNextReview,
  type CreateInitialFlashcardItemInput,
  type ScheduleFlashcardInput,
} from "./flashcard-scheduler";
