import assert from "node:assert/strict";
import test from "node:test";

import {
  createInitialFlashcardItem,
  getDueFlashcards,
  scheduleNextReview,
} from "../src/features/review/flashcard-scheduler";
import type {
  FlashcardReviewItem,
  FlashcardState,
  RecallRating,
} from "../src/types/review";

const NOW = "2026-06-06T00:00:00.000Z";
const LATER = "2026-06-07T00:00:00.000Z";

function makeItem(overrides: Partial<FlashcardReviewItem> = {}): FlashcardReviewItem {
  return {
    cardId: "saa-c03-secure-architectures-iam-policies",
    cert: "SAA-C03",
    domain: "secure-architectures",
    state: "new",
    ease: 2.5,
    intervalDays: 0,
    dueAt: NOW,
    repetitions: 0,
    lapseCount: 0,
    ...overrides,
  };
}

test("createInitialFlashcardItem: produces a fresh item due immediately", () => {
  const item = createInitialFlashcardItem({
    cardId: "card-1",
    cert: "CLF-C02",
    domain: "cloud-concepts",
    now: NOW,
  });
  assert.equal(item.cardId, "card-1");
  assert.equal(item.cert, "CLF-C02");
  assert.equal(item.domain, "cloud-concepts");
  assert.equal(item.state, "new");
  assert.equal(item.ease, 2.5);
  assert.equal(item.intervalDays, 0);
  assert.equal(item.dueAt, NOW);
  assert.equal(item.repetitions, 0);
  assert.equal(item.lapseCount, 0);
  assert.equal(item.lastReviewedAt, undefined);
  assert.equal(item.lastRating, undefined);
});

test("scheduleNextReview: new + good promotes to learning with interval 1", () => {
  const next = scheduleNextReview({
    item: makeItem({ state: "new", intervalDays: 0 }),
    rating: "good",
    now: NOW,
  });
  assert.equal(next.state, "learning");
  assert.equal(next.intervalDays, 1);
  assert.equal(next.repetitions, 1);
  assert.equal(next.lapseCount, 0);
  assert.equal(next.lastRating, "good");
  assert.equal(next.lastReviewedAt, NOW);
  assert.equal(next.dueAt, LATER);
});

test("scheduleNextReview: new + forgot lapses without incrementing repetitions", () => {
  const next = scheduleNextReview({
    item: makeItem({ state: "new", intervalDays: 0 }),
    rating: "forgot",
    now: NOW,
  });
  assert.equal(next.state, "lapsed");
  assert.equal(next.intervalDays, 1);
  assert.equal(next.repetitions, 0);
  assert.equal(next.lapseCount, 1);
});

test("scheduleNextReview: learning + good promotes to review at repetitions=2", () => {
  const next = scheduleNextReview({
    item: makeItem({ state: "learning", intervalDays: 1, repetitions: 1 }),
    rating: "good",
    now: NOW,
  });
  assert.equal(next.state, "review");
  assert.equal(next.repetitions, 2);
  assert.equal(next.intervalDays, 2);
});

test("scheduleNextReview: learning + hard keeps interval at max(1, current)", () => {
  const next = scheduleNextReview({
    item: makeItem({ state: "learning", intervalDays: 3, repetitions: 1 }),
    rating: "hard",
    now: NOW,
  });
  assert.equal(next.intervalDays, 3);
  assert.equal(next.repetitions, 2);
});

test("scheduleNextReview: review + forgot drops to lapsed and bumps lapseCount", () => {
  const next = scheduleNextReview({
    item: makeItem({
      state: "review",
      intervalDays: 7,
      repetitions: 4,
      lapseCount: 0,
    }),
    rating: "forgot",
    now: NOW,
  });
  assert.equal(next.state, "lapsed");
  assert.equal(next.intervalDays, 1);
  assert.equal(next.repetitions, 4);
  assert.equal(next.lapseCount, 1);
});

test("scheduleNextReview: review + easy triples interval (min 2)", () => {
  const next = scheduleNextReview({
    item: makeItem({ state: "review", intervalDays: 4, repetitions: 5 }),
    rating: "easy",
    now: NOW,
  });
  assert.equal(next.state, "review");
  assert.equal(next.intervalDays, 12);
  assert.equal(next.repetitions, 6);
});

test("scheduleNextReview: lapsed + good returns to learning", () => {
  const next = scheduleNextReview({
    item: makeItem({
      state: "lapsed",
      intervalDays: 1,
      repetitions: 0,
      lapseCount: 1,
    }),
    rating: "good",
    now: NOW,
  });
  assert.equal(next.state, "learning");
  assert.equal(next.intervalDays, 2);
  assert.equal(next.repetitions, 1);
  assert.equal(next.lapseCount, 1);
});

test("scheduleNextReview: easy on a zero-interval item bumps to 2 (min floor)", () => {
  const next = scheduleNextReview({
    item: makeItem({ state: "new", intervalDays: 0 }),
    rating: "easy",
    now: NOW,
  });
  assert.equal(next.intervalDays, 2);
});

test("scheduleNextReview: hard on a zero-interval item bumps to 1 (min floor)", () => {
  const next = scheduleNextReview({
    item: makeItem({ state: "new", intervalDays: 0 }),
    rating: "hard",
    now: NOW,
  });
  assert.equal(next.intervalDays, 1);
});

test("scheduleNextReview: preserves cardId, cert, domain, ease unchanged", () => {
  const item = makeItem({
    cardId: "preserve-me",
    cert: "CLF-C02",
    domain: "billing-pricing-support",
    ease: 1.9,
  });
  const ratings: RecallRating[] = ["forgot", "hard", "good", "easy"];
  for (const rating of ratings) {
    const next = scheduleNextReview({ item, rating, now: NOW });
    assert.equal(next.cardId, "preserve-me");
    assert.equal(next.cert, "CLF-C02");
    assert.equal(next.domain, "billing-pricing-support");
    assert.equal(next.ease, 1.9);
  }
});

test("getDueFlashcards: filters out items with dueAt in the future", () => {
  const items: FlashcardReviewItem[] = [
    makeItem({ cardId: "due-now", dueAt: NOW }),
    makeItem({ cardId: "future", dueAt: "2030-01-01T00:00:00.000Z" }),
  ];
  const due = getDueFlashcards(items, NOW);
  assert.equal(due.length, 1);
  assert.equal(due[0].cardId, "due-now");
});

test("getDueFlashcards: sorts ascending by dueAt", () => {
  const items: FlashcardReviewItem[] = [
    makeItem({ cardId: "c", dueAt: "2026-06-03T00:00:00.000Z" }),
    makeItem({ cardId: "a", dueAt: "2026-06-01T00:00:00.000Z" }),
    makeItem({ cardId: "b", dueAt: "2026-06-02T00:00:00.000Z" }),
  ];
  const due = getDueFlashcards(items, NOW);
  assert.deepEqual(
    due.map((d) => d.cardId),
    ["a", "b", "c"],
  );
});

test("getDueFlashcards: items due exactly at now are included", () => {
  const items: FlashcardReviewItem[] = [makeItem({ dueAt: NOW })];
  assert.equal(getDueFlashcards(items, NOW).length, 1);
});

test("getDueFlashcards: equal instants with different ISO formats compare equal", () => {
  const items: FlashcardReviewItem[] = [
    makeItem({ cardId: "no-ms", dueAt: "2026-06-06T00:00:00Z" }),
    makeItem({ cardId: "with-ms", dueAt: "2026-06-06T00:00:00.000Z" }),
  ];
  assert.equal(getDueFlashcards(items, NOW).length, 2);
});

test("scheduleNextReview: review + good keeps state at review (no demotion)", () => {
  const states: FlashcardState[] = ["new", "learning", "review", "lapsed"];
  for (const state of states) {
    const next = scheduleNextReview({
      item: makeItem({ state, intervalDays: 1, repetitions: 5 }),
      rating: "good",
      now: NOW,
    });
    assert.ok(next.state !== "lapsed", `state=${state} should not lapse on good`);
  }
});
