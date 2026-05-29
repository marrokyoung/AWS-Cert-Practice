/**
 * Practice feature boundary.
 *
 * Owns the pure evaluation logic and the result-recording seam that
 * sits between the practice UI and any future Question Retry / progress
 * persistence. Safe to import from both Server and Client Components.
 */

export {
  evaluateQuestion,
  type QuestionEvaluation,
  type SelectedAnswerIds,
} from "./evaluate-question";

export {
  buildPracticeQuestionResult,
  isRetryCandidate,
  recordPracticeQuestionResult,
  type BuildPracticeQuestionResultInput,
  type PracticeQuestionResult,
  type RecordPracticeQuestionResultOutcome,
} from "./question-results";
