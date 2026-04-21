"use client";

import { useEffect, useRef } from "react";
import { bootstrapGuestSession, readStoredClientId } from "./guest-session";
import { useSessionStore } from "./store";

/**
 * Triggers guest-session initialization once on mount.
 *
 * On success the session store is hydrated. On failure the store
 * is marked as errored so static content routes remain usable.
 *
 * Resolves `visitState` synchronously from the stored clientId before
 * kicking off async bootstrap so UI can distinguish first-run vs
 * returning users without reading identity storage directly.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { status, setInitializing, setSession, setError, setVisitState } =
    useSessionStore();
  const initCalled = useRef(false);

  useEffect(() => {
    if (status !== "idle" || initCalled.current) return;
    initCalled.current = true;

    setVisitState(readStoredClientId() ? "returning" : "first-run");
    setInitializing();

    bootstrapGuestSession()
      .then((session) => {
        setSession(session.clientId, session.sessionId, session.expiresAt);
      })
      .catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : "Guest session init failed";
        console.warn("[SessionProvider] guest session init failed:", message);
        setError(message);
      });
  }, [status, setInitializing, setSession, setError, setVisitState]);

  return <>{children}</>;
}
