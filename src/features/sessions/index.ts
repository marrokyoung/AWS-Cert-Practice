/**
 * Sessions feature boundary.
 *
 * Pure in-memory state for the two study modes that have a notion of
 * "session" — Learn (concept-card walkthrough) and Practice (question
 * loop). These are state containers, not stores: callers wire them into
 * a reducer or store when needed.
 *
 * Safe to import from Server and Client Components.
 */

export {
  createLearnSession,
  markCardViewed,
  selectNextCard,
  type CreateLearnSessionInput,
  type LearnSessionState,
} from "./learn-session";

export {
  createPracticeSession,
  recordResult,
  selectNextQuestion,
  summarizeSession,
  type CreatePracticeSessionInput,
  type PracticeSessionState,
  type PracticeSessionSummary,
} from "./practice-session";
