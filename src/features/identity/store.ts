import { create } from "zustand";

/** Lifecycle states for guest-session bootstrap in the browser. */
export type SessionStatus = "idle" | "initializing" | "ready" | "error";

/** UI-facing guest-session state kept in memory for the current app boot. */
export interface SessionState {
  clientId: string | null;
  sessionId: string | null;
  expiresAt: string | null;
  status: SessionStatus;
  error: string | null;
  isInitialized: boolean;
}

interface SessionActions {
  setSession: (
    clientId: string,
    sessionId: string,
    expiresAt: string,
  ) => void;
  setInitializing: () => void;
  setError: (error: string) => void;
}

/** Combined Zustand state and actions for guest-session bootstrap. */
export type SessionStore = SessionState & SessionActions;

/** Zustand store for guest-session bootstrap state consumed by UI code. */
export const useSessionStore = create<SessionStore>((set) => ({
  clientId: null,
  sessionId: null,
  expiresAt: null,
  status: "idle",
  error: null,
  isInitialized: false,

  setSession: (clientId, sessionId, expiresAt) =>
    set({
      clientId,
      sessionId,
      expiresAt,
      status: "ready",
      error: null,
      isInitialized: true,
    }),

  setInitializing: () =>
    set({ status: "initializing", error: null }),

  setError: (error) =>
    set({ status: "error", error, isInitialized: true }),
}));
