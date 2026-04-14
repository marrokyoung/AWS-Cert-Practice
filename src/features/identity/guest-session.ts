"use client";

/**
 * Guest session continuity boundary.
 *
 * Only the anonymous clientId is persisted in localStorage for
 * cross-visit continuity. The sessionId is minted fresh on every
 * app boot via the API and lives only in memory (Zustand store).
 * This avoids storing session tokens in clear-text browser storage.
 */

import { createGuestSession } from "@/features/api/client";

const STORAGE_KEY = "aws-cert-practice.clientId.v1";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidClientId(value: string): boolean {
  return UUID_RE.test(value);
}

/** Result returned to the caller after a successful bootstrap. */
export interface GuestSession {
  clientId: string;
  sessionId: string;
  expiresAt: string;
}

/** Read the stored clientId. Returns null if missing or invalid. */
export function readStoredClientId(): string | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (typeof value !== "string" || value === "") return null;
    if (!isValidClientId(value)) {
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* best-effort */ }
      return null;
    }
    return value;
  } catch {
    return null;
  }
}

/** Persist a clientId to localStorage. */
export function writeStoredClientId(clientId: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, clientId);
  } catch {
    // Persistence is best-effort; the in-memory session can still initialize.
  }
}

/**
 * Bootstrap a guest session.
 *
 * - Reads or creates a stable clientId for cross-visit continuity.
 * - Always calls the API to mint a fresh sessionId (never stored locally).
 * - Persists only the clientId in localStorage.
 *
 * Returns the active session data for the Zustand store.
 * Throws if the API call fails (caller should handle gracefully).
 */
export async function bootstrapGuestSession(): Promise<GuestSession> {
  const stored = readStoredClientId();

  if (stored) {
    const response = await createGuestSession({ clientId: stored });
    return {
      clientId: stored,
      sessionId: response.sessionId,
      expiresAt: response.expiresAt,
    };
  }

  const clientId = crypto.randomUUID();

  // Persist before the async API call so a concurrent bootstrap reads
  // the same clientId instead of minting a second one.
  writeStoredClientId(clientId);

  const response = await createGuestSession({ clientId });

  return {
    clientId,
    sessionId: response.sessionId,
    expiresAt: response.expiresAt,
  };
}
