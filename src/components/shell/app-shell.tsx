import Link from "next/link";
import { Settings } from "lucide-react";
import { AppHeaderClient } from "./app-header-client";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:shadow-md focus:outline-ring"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
          <Link
            href="/"
            className="shrink-0 whitespace-nowrap font-heading text-lg font-semibold tracking-tight text-foreground"
          >
            AWS Cert Practice
          </Link>

          <AppHeaderClient />

          <button
            disabled
            className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground opacity-50"
            aria-label="Settings (coming soon)"
          >
            <Settings className="size-4" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </header>

      <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {children}
      </main>

      <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        AWS Cert Practice &mdash; Open Source
      </footer>
    </div>
  );
}
