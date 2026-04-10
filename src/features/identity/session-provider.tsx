"use client";

import { useEffect, useRef } from "react";
import { ensureGuestSession } from "./guest-session";
import { useSessionStore } from "./store";

/**
 * Triggers guest-session initialization once on mount.
 *
 * On success the session store is hydrated. On failure the store
 * is marked as errored so static content routes remain usable.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { status, setInitializing, setSession, setError } = useSessionStore();
  const initCalled = useRef(false);

  useEffect(() => {
    if (status !== "idle" || initCalled.current) return;
    initCalled.current = true;

    setInitializing();

    ensureGuestSession()
      .then((identity) => {
        setSession(identity.clientId, identity.sessionId, identity.expiresAt);
      })
      .catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : "Guest session init failed";
        console.warn("[SessionProvider] guest session init failed:", message);
        setError(message);
      });
  }, [status, setInitializing, setSession, setError]);

  return <>{children}</>;
}
