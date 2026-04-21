import assert from "node:assert/strict";
import { beforeEach } from "node:test";
import test from "node:test";

// ---------------------------------------------------------------------------
// Mock localStorage and a minimal window before importing the module.
// ---------------------------------------------------------------------------

const storage = new Map<string, string>();
let throwOnSetItem = false;
let throwOnGetItem = false;

// @ts-expect-error -- minimal localStorage mock
globalThis.localStorage = {
  getItem: (key: string) => {
    if (throwOnGetItem) throw new DOMException("Storage unavailable", "SecurityError");
    return storage.get(key) ?? null;
  },
  setItem: (key: string, value: string) => {
    if (throwOnSetItem) throw new DOMException("Storage unavailable", "QuotaExceededError");
    storage.set(key, value);
  },
  removeItem: (key: string) => {
    storage.delete(key);
  },
};

const dispatched: string[] = [];
// @ts-expect-error -- minimal window mock
globalThis.window = {
  dispatchEvent: (event: Event) => {
    dispatched.push(event.type);
    return true;
  },
};

const {
  HOME_CERT_CHANGE_EVENT,
  HOME_CERT_FALLBACK,
  readStoredHomeCert,
  writeStoredHomeCert,
  __resetHomeCertInMemoryCacheForTests,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
} = require("../src/components/home/home-cert") as typeof import("../src/components/home/home-cert");

const STORAGE_KEY = "aws-cert-practice.homeCert.v1";

beforeEach(() => {
  storage.clear();
  dispatched.length = 0;
  throwOnSetItem = false;
  throwOnGetItem = false;
  __resetHomeCertInMemoryCacheForTests();
});

test("readStoredHomeCert returns fallback when unset", () => {
  assert.equal(readStoredHomeCert(), HOME_CERT_FALLBACK);
});

test("writeStoredHomeCert persists and readStoredHomeCert round-trips", () => {
  writeStoredHomeCert("SAA-C03");
  assert.equal(storage.get(STORAGE_KEY), "SAA-C03");
  assert.equal(readStoredHomeCert(), "SAA-C03");
});

test("writeStoredHomeCert dispatches change event", () => {
  writeStoredHomeCert("CLF-C02");
  assert.deepEqual(dispatched, [HOME_CERT_CHANGE_EVENT]);
});

test("readStoredHomeCert falls back and clears an invalid persisted value", () => {
  storage.set(STORAGE_KEY, "bogus");
  assert.equal(readStoredHomeCert(), HOME_CERT_FALLBACK);
  assert.equal(storage.has(STORAGE_KEY), false);
});

test("writeStoredHomeCert applies in-memory when localStorage.setItem throws", () => {
  throwOnSetItem = true;
  writeStoredHomeCert("SAA-C03");
  assert.equal(storage.has(STORAGE_KEY), false);
  // In-memory fallback keeps the selection usable for the current session.
  assert.equal(readStoredHomeCert(), "SAA-C03");
  // Change event still fires so useSyncExternalStore subscribers re-read.
  assert.deepEqual(dispatched, [HOME_CERT_CHANGE_EVENT]);
});

test("readStoredHomeCert returns in-memory value when getItem throws", () => {
  writeStoredHomeCert("SAA-C03");
  throwOnGetItem = true;
  assert.equal(readStoredHomeCert(), "SAA-C03");
});

test("readStoredHomeCert returns fallback when getItem throws and in-memory is empty", () => {
  throwOnGetItem = true;
  assert.equal(readStoredHomeCert(), HOME_CERT_FALLBACK);
});

test("valid localStorage value takes precedence over in-memory cache", () => {
  writeStoredHomeCert("SAA-C03");
  storage.set(STORAGE_KEY, "CLF-C02");
  assert.equal(readStoredHomeCert(), "CLF-C02");
});
