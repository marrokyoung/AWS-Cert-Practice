import assert from "node:assert/strict";
import test from "node:test";

// ---------------------------------------------------------------------------
// Mock localStorage and fetch before importing the module.
// ---------------------------------------------------------------------------

const storage = new Map<string, string>();
let throwOnSetItem = false;

// @ts-expect-error -- minimal localStorage mock
globalThis.localStorage = {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => {
    if (throwOnSetItem) throw new DOMException("Storage unavailable", "QuotaExceededError");
    storage.set(key, value);
  },
  removeItem: (key: string) => {
    storage.delete(key);
  },
};

// Override randomUUID on the existing crypto object.
Object.defineProperty(globalThis.crypto, "randomUUID", {
  value: () => "mock-uuid-1234",
  writable: true,
  configurable: true,
});

let fetchCallCount = 0;
let mockFetchResponse: { ok: boolean; status: number; json: () => Promise<unknown> };

// @ts-expect-error -- mock fetch
globalThis.fetch = async () => {
  fetchCallCount++;
  return mockFetchResponse;
};

process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.com";

const {
  readStoredClientId,
  writeStoredClientId,
  bootstrapGuestSession,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
} = require("../src/features/identity/guest-session") as typeof import("../src/features/identity/guest-session");

const STORAGE_KEY = "aws-cert-practice.clientId.v1";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resetStorage() {
  storage.clear();
  fetchCallCount = 0;
  throwOnSetItem = false;
}

/** Produce an ISO timestamp safely in the future for bootstrap tests. */
function futureDate(): string {
  return new Date(Date.now() + 86_400_000).toISOString();
}

// ---------------------------------------------------------------------------
// readStoredClientId
// ---------------------------------------------------------------------------

test("readStoredClientId returns null when storage is empty", () => {
  resetStorage();
  assert.equal(readStoredClientId(), null);
});

test("readStoredClientId returns null for empty string", () => {
  resetStorage();
  storage.set(STORAGE_KEY, "");
  assert.equal(readStoredClientId(), null);
});

test("readStoredClientId returns valid clientId", () => {
  resetStorage();
  storage.set(STORAGE_KEY, "client-abc");
  assert.equal(readStoredClientId(), "client-abc");
});

// ---------------------------------------------------------------------------
// writeStoredClientId
// ---------------------------------------------------------------------------

test("writeStoredClientId persists to localStorage", () => {
  resetStorage();
  writeStoredClientId("client-xyz");
  assert.equal(storage.get(STORAGE_KEY), "client-xyz");
});

test("writeStoredClientId does not throw when localStorage write fails", () => {
  resetStorage();
  throwOnSetItem = true;

  assert.doesNotThrow(() => writeStoredClientId("client-xyz"));
  assert.equal(storage.has(STORAGE_KEY), false);
});

// ---------------------------------------------------------------------------
// bootstrapGuestSession
// ---------------------------------------------------------------------------

test("bootstrapGuestSession always calls API even with stored clientId", async () => {
  resetStorage();
  storage.set(STORAGE_KEY, "c-1");

  const newExpiry = futureDate();
  mockFetchResponse = {
    ok: true,
    status: 200,
    json: async () => ({ sessionId: "s-new", expiresAt: newExpiry }),
  };

  const result = await bootstrapGuestSession();
  assert.equal(result.clientId, "c-1");
  assert.equal(result.sessionId, "s-new");
  assert.equal(result.expiresAt, newExpiry);
  assert.equal(fetchCallCount, 1, "should always call API");
});

test("bootstrapGuestSession generates and persists clientId on first visit", async () => {
  resetStorage();

  const newExpiry = futureDate();
  mockFetchResponse = {
    ok: true,
    status: 200,
    json: async () => ({ sessionId: "s-fresh", expiresAt: newExpiry }),
  };

  const result = await bootstrapGuestSession();
  assert.equal(result.clientId, "mock-uuid-1234");
  assert.equal(result.sessionId, "s-fresh");
  assert.equal(fetchCallCount, 1);
  // clientId should be persisted for future visits.
  assert.equal(storage.get(STORAGE_KEY), "mock-uuid-1234");
});

test("bootstrapGuestSession succeeds when clientId persistence fails", async () => {
  resetStorage();
  throwOnSetItem = true;

  const newExpiry = futureDate();
  mockFetchResponse = {
    ok: true,
    status: 200,
    json: async () => ({ sessionId: "s-fresh", expiresAt: newExpiry }),
  };

  const result = await bootstrapGuestSession();
  assert.equal(result.clientId, "mock-uuid-1234");
  assert.equal(result.sessionId, "s-fresh");
  assert.equal(result.expiresAt, newExpiry);
  assert.equal(fetchCallCount, 1);
  assert.equal(storage.has(STORAGE_KEY), false);
});

test("bootstrapGuestSession does not overwrite existing clientId", async () => {
  resetStorage();
  storage.set(STORAGE_KEY, "existing-client");

  mockFetchResponse = {
    ok: true,
    status: 200,
    json: async () => ({ sessionId: "s-1", expiresAt: futureDate() }),
  };

  await bootstrapGuestSession();
  assert.equal(storage.get(STORAGE_KEY), "existing-client");
});

test("bootstrapGuestSession throws on API failure", async () => {
  resetStorage();

  mockFetchResponse = {
    ok: false,
    status: 500,
    json: async () => ({ code: "INTERNAL", message: "boom" }),
  };

  await assert.rejects(() => bootstrapGuestSession());
});

test("sessionId is not stored in localStorage", async () => {
  resetStorage();

  mockFetchResponse = {
    ok: true,
    status: 200,
    json: async () => ({ sessionId: "s-secret", expiresAt: futureDate() }),
  };

  await bootstrapGuestSession();
  // Only clientId should be in storage, not the full session.
  const stored = storage.get(STORAGE_KEY);
  assert.ok(stored);
  assert.ok(!stored.includes("s-secret"), "sessionId must not be in localStorage");
});
