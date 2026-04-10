"use client";

import { SessionProvider } from "@/features/identity/session-provider";

/** Top-level client provider entry for browser-only app bootstrap logic. */
export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
