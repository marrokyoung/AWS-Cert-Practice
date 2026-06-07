import assert from "node:assert/strict";
import test from "node:test";

import {
  createLearnSession,
  markCardViewed,
  selectNextCard,
} from "../src/features/sessions/learn-session";

const NOW = "2026-06-06T00:00:00.000Z";

test("createLearnSession: initializes empty state at the given timestamp", () => {
  const state = createLearnSession({
    cert: "SAA-C03",
    domain: "secure-architectures",
    now: NOW,
  });
  assert.equal(state.cert, "SAA-C03");
  assert.equal(state.domain, "secure-architectures");
  assert.equal(state.startedAt, NOW);
  assert.deepEqual(state.viewedCardIds, []);
  assert.equal(state.currentCardId, null);
});

test("markCardViewed: appends the card and sets currentCardId", () => {
  const state = createLearnSession({
    cert: "SAA-C03",
    domain: "secure-architectures",
    now: NOW,
  });
  const next = markCardViewed(state, "card-1");
  assert.deepEqual(next.viewedCardIds, ["card-1"]);
  assert.equal(next.currentCardId, "card-1");
});

test("markCardViewed: is idempotent on viewedCardIds but updates currentCardId", () => {
  const start = createLearnSession({
    cert: "SAA-C03",
    domain: "secure-architectures",
    now: NOW,
  });
  const afterFirst = markCardViewed(start, "card-1");
  const afterSecond = markCardViewed(afterFirst, "card-2");
  const afterRevisit = markCardViewed(afterSecond, "card-1");
  assert.deepEqual(afterRevisit.viewedCardIds, ["card-1", "card-2"]);
  assert.equal(afterRevisit.currentCardId, "card-1");
});

test("markCardViewed: does not mutate the input state", () => {
  const start = createLearnSession({
    cert: "SAA-C03",
    domain: "secure-architectures",
    now: NOW,
  });
  markCardViewed(start, "card-1");
  assert.deepEqual(start.viewedCardIds, []);
  assert.equal(start.currentCardId, null);
});

test("selectNextCard: returns the first unseen card preserving order", () => {
  const start = createLearnSession({
    cert: "SAA-C03",
    domain: "secure-architectures",
    now: NOW,
  });
  const afterOne = markCardViewed(start, "card-1");
  assert.equal(selectNextCard(afterOne, ["card-1", "card-2", "card-3"]), "card-2");
});

test("selectNextCard: returns null when every card has been viewed", () => {
  const start = createLearnSession({
    cert: "SAA-C03",
    domain: "secure-architectures",
    now: NOW,
  });
  const afterOne = markCardViewed(start, "card-1");
  const afterTwo = markCardViewed(afterOne, "card-2");
  assert.equal(selectNextCard(afterTwo, ["card-1", "card-2"]), null);
});

test("selectNextCard: returns null when there are no available cards", () => {
  const start = createLearnSession({
    cert: "SAA-C03",
    domain: "secure-architectures",
    now: NOW,
  });
  assert.equal(selectNextCard(start, []), null);
});
