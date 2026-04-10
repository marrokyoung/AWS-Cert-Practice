/**
 * Guest session continuity boundary.
 *
 * Manages anonymous guest session creation and resumption.
 * Uses a single localStorage key for cross-visit continuity.
 * Persistence is explicit — no Zustand middleware.
 */

import { createGuestSession } from "@/features/api/client";

const STORAGE_KEY = "aws-cert-practice.identity.v1";

/** Shape persisted in localStorage. */
export interface StoredIdentity {
  clientId: string;
  sessionId: string;
  expiresAt: string;
}

/** Read the stored identity record. Returns null if missing or invalid. */
export function readStoredIdentity(): StoredIdentity | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isValidStoredIdentity(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Persist an identity record to localStorage. */
export function writeStoredIdentity(identity: StoredIdentity): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
}

/** Check whether a stored session has expired or has an invalid timestamp. */
export function isExpired(identity: StoredIdentity): boolean {
  const ts = new Date(identity.expiresAt).getTime();
  // Treat unparseable timestamps as expired so we always renew.
  if (Number.isNaN(ts)) return true;
  return ts <= Date.now();
}

/** Get or create a stable anonymous clientId. */
export function resolveClientId(stored: StoredIdentity | null): string {
  return stored?.clientId ?? crypto.randomUUID();
}

/**
 * Ensure a valid guest session exists.
 *
 * - If a stored unexpired session exists, reuse it.
 * - Otherwise, create a new session via the API and persist it.
 *
 * Returns the active identity record.
 * Throws if the API call fails (caller should handle gracefully).
 */
export async function ensureGuestSession(): Promise<StoredIdentity> {
  const stored = readStoredIdentity();

  if (stored && !isExpired(stored)) {
    return stored;
  }

  const clientId = resolveClientId(stored);
  const response = await createGuestSession({ clientId });

  const identity: StoredIdentity = {
    clientId,
    sessionId: response.sessionId,
    expiresAt: response.expiresAt,
  };

  writeStoredIdentity(identity);
  return identity;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function isValidStoredIdentity(value: unknown): value is StoredIdentity {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.clientId === "string" &&
    obj.clientId !== "" &&
    typeof obj.sessionId === "string" &&
    obj.sessionId !== "" &&
    typeof obj.expiresAt === "string" &&
    obj.expiresAt !== ""
  );
}
