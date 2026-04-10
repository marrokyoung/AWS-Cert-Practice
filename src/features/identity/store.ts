import { create } from "zustand";

export type SessionStatus = "idle" | "initializing" | "ready" | "error";

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

export type SessionStore = SessionState & SessionActions;

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
