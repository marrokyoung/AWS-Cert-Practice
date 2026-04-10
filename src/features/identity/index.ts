/**
 * Guest identity boundary.
 *
 * All guest-session logic is contained in this module.
 * UI components should read session state through the store.
 */

export {
  bootstrapGuestSession,
  readStoredClientId,
  resolveClientId,
} from "./guest-session";
export type { GuestSession } from "./guest-session";

export { useSessionStore } from "./store";
export type { SessionState, SessionStatus, SessionStore } from "./store";

export { SessionProvider } from "./session-provider";
