import assert from "node:assert/strict";
import test from "node:test";

// ---------------------------------------------------------------------------
// Mock fetch globally before importing the client module.
// ---------------------------------------------------------------------------

let lastFetchUrl: string | undefined;
let lastFetchOptions: RequestInit | undefined;
let mockResponse: { ok: boolean; status: number; json: () => Promise<unknown> } | null = null;
let mockFetchError: Error | null = null;
let mockFetchNeverResolves = false;

// @ts-expect-error -- assigning a mock to the global fetch
globalThis.fetch = async (input: string | URL | Request, init?: RequestInit) => {
  lastFetchUrl = typeof input === "string" ? input : input.toString();
  lastFetchOptions = init;
  if (mockFetchNeverResolves) {
    return await new Promise<Response>((_, reject) => {
      init?.signal?.addEventListener("abort", () => {
        reject(new DOMException("The operation was aborted.", "AbortError"));
      });
    });
  }
  if (mockFetchError) throw mockFetchError;
  return mockResponse!;
};

// Set the env var before importing so getBaseUrl() succeeds.
process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.com/prod/";

// Dynamic import after globals are set.
const {
  getHealth,
  getVersion,
  getConfig,
  createGuestSession,
  ApiClientError,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
} = require("../src/features/api/client") as typeof import("../src/features/api/client");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resetMocks() {
  mockFetchError = null;
  mockFetchNeverResolves = false;
  mockResponse = null;
  delete process.env.NEXT_PUBLIC_API_TIMEOUT_MS;
}

/** Configure the fetch mock to return a successful JSON response. */
function okResponse(body: unknown) {
  resetMocks();
  mockResponse = { ok: true, status: 200, json: async () => body };
}

/** Configure the fetch mock to return an error response with a JSON body. */
function errorResponse(status: number, body: unknown) {
  mockResponse = { ok: false, status, json: async () => body };
}

/** Configure the fetch mock to return an error response without valid JSON. */
function errorResponseNoBody(status: number) {
  mockResponse = {
    ok: false,
    status,
    json: async () => {
      throw new Error("not json");
    },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test("getHealth returns health response", async () => {
  const body = { status: "ok", timestamp: "2026-01-01T00:00:00Z" };
  okResponse(body);

  const result = await getHealth();
  assert.deepEqual(result, body);
  assert.equal(lastFetchUrl, "https://api.example.com/prod/health");
  assert.equal(lastFetchOptions?.credentials, "omit");
});

test("getVersion returns version response", async () => {
  const body = { version: "0.1.0", contentVersion: "abc" };
  okResponse(body);

  const result = await getVersion();
  assert.deepEqual(result, body);
  assert.equal(lastFetchUrl, "https://api.example.com/prod/version");
});

test("getConfig returns config response", async () => {
  const body = {
    supportedCerts: ["CLF-C02"],
    defaultCert: "CLF-C02",
    guestSessionTtlSeconds: 86400,
  };
  okResponse(body);

  const result = await getConfig();
  assert.deepEqual(result, body);
  assert.equal(lastFetchUrl, "https://api.example.com/prod/config");
});

test("createGuestSession sends POST with JSON body", async () => {
  const body = {
    sessionId: "sess-123",
    expiresAt: "2026-01-02T00:00:00Z",
  };
  okResponse(body);

  const result = await createGuestSession({ clientId: "client-1" });
  assert.deepEqual(result, body);
  assert.equal(lastFetchUrl, "https://api.example.com/prod/guest-sessions");
  assert.equal(lastFetchOptions?.method, "POST");
  const headers = lastFetchOptions?.headers as Record<string, string>;
  assert.equal(headers["Content-Type"], "application/json");
  assert.equal(lastFetchOptions?.body, JSON.stringify({ clientId: "client-1" }));
});

test("trailing slash on base URL is normalized", async () => {
  okResponse({ status: "ok", timestamp: "" });
  await getHealth();
  // The env var has a trailing slash; it should be stripped.
  assert.ok(!lastFetchUrl?.includes("//health"));
});

test("non-2xx response with JSON body throws ApiClientError", async () => {
  const apiError = { code: "NOT_FOUND", message: "Route not found" };
  errorResponse(404, apiError);

  await assert.rejects(() => getHealth(), (err: unknown) => {
    assert.ok(err instanceof ApiClientError);
    assert.equal(err.status, 404);
    assert.deepEqual(err.apiError, apiError);
    assert.equal(err.message, "Route not found");
    return true;
  });
});

test("non-2xx response without JSON body throws ApiClientError", async () => {
  errorResponseNoBody(502);

  await assert.rejects(() => getHealth(), (err: unknown) => {
    assert.ok(err instanceof ApiClientError);
    assert.equal(err.status, 502);
    assert.equal(err.apiError, null);
    return true;
  });
});

test("network failure throws ApiClientError with status 0", async () => {
  resetMocks();
  mockFetchError = new TypeError("Failed to fetch");

  await assert.rejects(() => getHealth(), (err: unknown) => {
    assert.ok(err instanceof ApiClientError);
    assert.equal(err.status, 0);
    assert.equal(err.apiError?.code, "NETWORK_ERROR");
    assert.equal(err.apiError?.message, "Failed to fetch");
    return true;
  });

  mockFetchError = null;
});

test("request timeout throws ApiClientError with status 0", async () => {
  resetMocks();
  mockFetchNeverResolves = true;
  process.env.NEXT_PUBLIC_API_TIMEOUT_MS = "1";

  await assert.rejects(() => getHealth(), (err: unknown) => {
    assert.ok(err instanceof ApiClientError);
    assert.equal(err.status, 0);
    assert.equal(err.apiError?.code, "TIMEOUT");
    assert.match(err.apiError?.message ?? "", /timed out/);
    return true;
  });
});

test("successful response with invalid JSON throws ApiClientError", async () => {
  resetMocks();
  mockResponse = {
    ok: true,
    status: 200,
    json: async () => {
      throw new Error("not json");
    },
  };

  await assert.rejects(() => getHealth(), (err: unknown) => {
    assert.ok(err instanceof ApiClientError);
    assert.equal(err.status, 200);
    assert.equal(err.apiError?.code, "INVALID_JSON");
    assert.equal(err.apiError?.details?.cause, "not json");
    return true;
  });
});

test("GET requests do not include Content-Type header", async () => {
  okResponse({ status: "ok", timestamp: "" });
  await getHealth();
  assert.equal(lastFetchOptions?.headers, undefined);
});
