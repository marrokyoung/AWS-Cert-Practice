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
    if (typeof value === "string" && value !== "") return value;
    return null;
  } catch {
    return null;
  }
}

/** Persist a clientId to localStorage. */
export function writeStoredClientId(clientId: string): void {
  localStorage.setItem(STORAGE_KEY, clientId);
}

/** Get or create a stable anonymous clientId. */
export function resolveClientId(stored: string | null): string {
  return stored ?? crypto.randomUUID();
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
  const clientId = resolveClientId(stored);
  const response = await createGuestSession({ clientId });

  // Persist clientId on first visit (or if storage was cleared).
  if (!stored) {
    writeStoredClientId(clientId);
  }

  return {
    clientId,
    sessionId: response.sessionId,
    expiresAt: response.expiresAt,
  };
}
