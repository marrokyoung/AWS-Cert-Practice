/**
 * Practice-mode session state seam.
 *
 * Wraps results recorded through the existing practice boundary so a
 * session-level summary is available and so the future Question Retry
 * handoff has a single entry point. This module is a pure state
 * container — it does NOT call `recordPracticeQuestionResult`; the UI
 * continues to do that directly.
 *
 * Safe to import from Server and Client Components: no DOM, no storage,
 * no fetch.
 */

import type { PracticeQuestionResult } from "@/features/practice";
import type { Certification, Domain } from "@/types/shared";

export interface PracticeSessionState {
  cert: Certification;
  domain: Domain | null;
  startedAt: string;
  results: readonly PracticeQuestionResult[];
  currentQuestionId: string | null;
}

export interface CreatePracticeSessionInput {
  cert: Certification;
  domain?: Domain;
  now?: string;
}

export interface PracticeSessionSummary {
  total: number;
  correct: number;
  incorrect: number;
  retryCandidates: number;
}

/**
 * Start a fresh Practice session. `domain` is optional — omitting it
 * represents an "any domain" practice run for the chosen cert.
 */
export function createPracticeSession(
  input: CreatePracticeSessionInput,
): PracticeSessionState {
  const resolvedNow = input.now ?? new Date().toISOString();
  return {
    cert: input.cert,
    domain: input.domain ?? null,
    startedAt: resolvedNow,
    results: [],
    currentQuestionId: null,
  };
}

/**
 * Record a result into the session. If a result for the same
 * `questionId` already exists, it is REPLACED rather than appended —
 * this matches the rule already enforced in the practice reducer and
 * keeps the summary counts honest if a learner re-answers a question.
 */
export function recordResult(
  state: PracticeSessionState,
  result: PracticeQuestionResult,
): PracticeSessionState {
  const idx = state.results.findIndex((r) => r.questionId === result.questionId);
  const nextResults =
    idx === -1
      ? [...state.results, result]
      : state.results.map((r, i) => (i === idx ? result : r));
  return {
    ...state,
    results: nextResults,
    currentQuestionId: result.questionId,
  };
}

/**
 * Pick the next unanswered question from a deterministic, caller-supplied
 * list. Returns `null` when every question has been answered.
 */
export function selectNextQuestion(
  state: PracticeSessionState,
  availableQuestionIds: readonly string[],
): string | null {
  const answered = new Set(state.results.map((r) => r.questionId));
  for (const questionId of availableQuestionIds) {
    if (!answered.has(questionId)) return questionId;
  }
  return null;
}

/**
 * Summarize the session for the practice UI (and future progress
 * tracker). Counts are derived purely from `state.results`.
 */
export function summarizeSession(
  state: PracticeSessionState,
): PracticeSessionSummary {
  let correct = 0;
  let incorrect = 0;
  let retryCandidates = 0;
  for (const r of state.results) {
    if (r.result === "correct") correct += 1;
    else incorrect += 1;
    if (r.retryCandidate) retryCandidates += 1;
  }
  return {
    total: state.results.length,
    correct,
    incorrect,
    retryCandidates,
  };
}
