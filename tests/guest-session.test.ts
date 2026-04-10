import assert from "node:assert/strict";
import test from "node:test";

// ---------------------------------------------------------------------------
// Mock localStorage and fetch before importing the module.
// ---------------------------------------------------------------------------

const storage = new Map<string, string>();

// @ts-expect-error -- minimal localStorage mock
globalThis.localStorage = {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => {
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
  readStoredIdentity,
  writeStoredIdentity,
  isExpired,
  resolveClientId,
  ensureGuestSession,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
} = require("../src/features/identity/guest-session") as typeof import("../src/features/identity/guest-session");

const STORAGE_KEY = "aws-cert-practice.identity.v1";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resetStorage() {
  storage.clear();
  fetchCallCount = 0;
}

function futureDate(): string {
  return new Date(Date.now() + 86_400_000).toISOString();
}

function pastDate(): string {
  return new Date(Date.now() - 1000).toISOString();
}

// ---------------------------------------------------------------------------
// readStoredIdentity
// ---------------------------------------------------------------------------

test("readStoredIdentity returns null when storage is empty", () => {
  resetStorage();
  assert.equal(readStoredIdentity(), null);
});

test("readStoredIdentity returns null for invalid JSON", () => {
  resetStorage();
  storage.set(STORAGE_KEY, "not-json");
  assert.equal(readStoredIdentity(), null);
});

test("readStoredIdentity returns null for missing fields", () => {
  resetStorage();
  storage.set(STORAGE_KEY, JSON.stringify({ clientId: "c" }));
  assert.equal(readStoredIdentity(), null);
});

test("readStoredIdentity returns null for empty string fields", () => {
  resetStorage();
  storage.set(STORAGE_KEY, JSON.stringify({ clientId: "", sessionId: "s", expiresAt: "2026-01-01" }));
  assert.equal(readStoredIdentity(), null);
});

test("readStoredIdentity returns valid identity", () => {
  resetStorage();
  const identity = {
    clientId: "c-1",
    sessionId: "s-1",
    expiresAt: futureDate(),
  };
  storage.set(STORAGE_KEY, JSON.stringify(identity));
  assert.deepEqual(readStoredIdentity(), identity);
});

// ---------------------------------------------------------------------------
// writeStoredIdentity
// ---------------------------------------------------------------------------

test("writeStoredIdentity persists to localStorage", () => {
  resetStorage();
  const identity = {
    clientId: "c-1",
    sessionId: "s-1",
    expiresAt: futureDate(),
  };
  writeStoredIdentity(identity);
  assert.equal(storage.get(STORAGE_KEY), JSON.stringify(identity));
});

// ---------------------------------------------------------------------------
// isExpired
// ---------------------------------------------------------------------------

test("isExpired returns true for past date", () => {
  assert.equal(isExpired({ clientId: "", sessionId: "", expiresAt: pastDate() }), true);
});

test("isExpired returns false for future date", () => {
  assert.equal(isExpired({ clientId: "", sessionId: "", expiresAt: futureDate() }), false);
});

test("isExpired returns true for invalid/corrupt timestamp", () => {
  assert.equal(isExpired({ clientId: "c", sessionId: "s", expiresAt: "not-a-date" }), true);
  assert.equal(isExpired({ clientId: "c", sessionId: "s", expiresAt: "" }), true);
});

// ---------------------------------------------------------------------------
// resolveClientId
// ---------------------------------------------------------------------------

test("resolveClientId reuses existing clientId", () => {
  assert.equal(
    resolveClientId({ clientId: "existing", sessionId: "", expiresAt: "" }),
    "existing",
  );
});

test("resolveClientId generates UUID when no stored identity", () => {
  assert.equal(resolveClientId(null), "mock-uuid-1234");
});

// ---------------------------------------------------------------------------
// ensureGuestSession
// ---------------------------------------------------------------------------

test("ensureGuestSession reuses unexpired stored session", async () => {
  resetStorage();
  const identity = {
    clientId: "c-1",
    sessionId: "s-1",
    expiresAt: futureDate(),
  };
  storage.set(STORAGE_KEY, JSON.stringify(identity));

  const result = await ensureGuestSession();
  assert.deepEqual(result, identity);
  assert.equal(fetchCallCount, 0, "should not call API");
});

test("ensureGuestSession creates new session when expired", async () => {
  resetStorage();
  const expiredIdentity = {
    clientId: "c-1",
    sessionId: "s-old",
    expiresAt: pastDate(),
  };
  storage.set(STORAGE_KEY, JSON.stringify(expiredIdentity));

  const newExpiry = futureDate();
  mockFetchResponse = {
    ok: true,
    status: 200,
    json: async () => ({ sessionId: "s-new", expiresAt: newExpiry }),
  };

  const result = await ensureGuestSession();
  assert.equal(result.clientId, "c-1", "should reuse existing clientId");
  assert.equal(result.sessionId, "s-new");
  assert.equal(fetchCallCount, 1);
});

test("ensureGuestSession creates new session when storage is empty", async () => {
  resetStorage();

  const newExpiry = futureDate();
  mockFetchResponse = {
    ok: true,
    status: 200,
    json: async () => ({ sessionId: "s-fresh", expiresAt: newExpiry }),
  };

  const result = await ensureGuestSession();
  assert.equal(result.clientId, "mock-uuid-1234");
  assert.equal(result.sessionId, "s-fresh");
  assert.equal(fetchCallCount, 1);
  // Verify it was persisted.
  assert.ok(storage.has(STORAGE_KEY));
});

test("ensureGuestSession throws on API failure", async () => {
  resetStorage();

  mockFetchResponse = {
    ok: false,
    status: 500,
    json: async () => ({ code: "INTERNAL", message: "boom" }),
  };

  await assert.rejects(() => ensureGuestSession());
});
