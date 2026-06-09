/**
 * Learn-mode session state seam.
 *
 * Holds the in-memory state for a concept-card walkthrough. Sprint 1
 * defines the shape and pure transitions; Sprint 2 wires it to a
 * useReducer in the Learn UI. Keeping the transitions outside React
 * means they can be unit-tested without rendering anything.
 *
 * Safe to import from Server and Client Components: no DOM, no storage,
 * no fetch.
 */

import type { Certification, Domain } from "@/types/shared";

export interface LearnSessionState {
  cert: Certification;
  domain: Domain;
  startedAt: string;
  viewedCardIds: readonly string[];
  currentCardId: string | null;
}

export interface CreateLearnSessionInput {
  cert: Certification;
  domain: Domain;
  now?: string;
}

/**
 * Start a fresh Learn session for a single (cert, domain) pair. The
 * initial state has no current card so the UI can prompt the learner
 * to pick one (or call `selectNextCard`).
 */
export function createLearnSession(
  input: CreateLearnSessionInput,
): LearnSessionState {
  const resolvedNow = input.now ?? new Date().toISOString();
  return {
    cert: input.cert,
    domain: input.domain,
    startedAt: resolvedNow,
    viewedCardIds: [],
    currentCardId: null,
  };
}

/**
 * Record that the learner has viewed a card. Idempotent on the viewed
 * list — re-viewing a card does not duplicate it — but always promotes
 * the card to `currentCardId` so the UI reflects the latest navigation.
 */
export function markCardViewed(
  state: LearnSessionState,
  cardId: string,
): LearnSessionState {
  const alreadyViewed = state.viewedCardIds.includes(cardId);
  return {
    ...state,
    viewedCardIds: alreadyViewed
      ? state.viewedCardIds
      : [...state.viewedCardIds, cardId],
    currentCardId: cardId,
  };
}

/**
 * Pick the next unseen card from a deterministic, caller-supplied list.
 * Sprint 1 has no shuffling — the order of `availableCardIds` is the
 * order surfaced to the learner. Returns `null` when every card has
 * been viewed.
 */
export function selectNextCard(
  state: LearnSessionState,
  availableCardIds: readonly string[],
): string | null {
  const viewed = new Set(state.viewedCardIds);
  for (const cardId of availableCardIds) {
    if (!viewed.has(cardId)) return cardId;
  }
  return null;
}
