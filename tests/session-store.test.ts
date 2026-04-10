import assert from "node:assert/strict";
import { beforeEach } from "node:test";
import test from "node:test";

import { useSessionStore } from "../src/features/identity/store";

const initialState = useSessionStore.getState();

beforeEach(() => {
  useSessionStore.setState(initialState, true);
});

test("initial state is idle and not initialized", () => {
  const state = useSessionStore.getState();
  assert.equal(state.status, "idle");
  assert.equal(state.isInitialized, false);
  assert.equal(state.clientId, null);
  assert.equal(state.sessionId, null);
  assert.equal(state.expiresAt, null);
  assert.equal(state.error, null);
});

test("setInitializing transitions to initializing", () => {
  useSessionStore.getState().setInitializing();
  const state = useSessionStore.getState();
  assert.equal(state.status, "initializing");
  assert.equal(state.error, null);
});

test("setSession hydrates the store", () => {
  useSessionStore.getState().setSession("c-1", "s-1", "2026-01-01T00:00:00Z");
  const state = useSessionStore.getState();
  assert.equal(state.status, "ready");
  assert.equal(state.isInitialized, true);
  assert.equal(state.clientId, "c-1");
  assert.equal(state.sessionId, "s-1");
  assert.equal(state.expiresAt, "2026-01-01T00:00:00Z");
  assert.equal(state.error, null);
});

test("setError marks store as errored and initialized", () => {
  useSessionStore.getState().setError("boom");
  const state = useSessionStore.getState();
  assert.equal(state.status, "error");
  assert.equal(state.isInitialized, true);
  assert.equal(state.error, "boom");
});
