import Link from "next/link";
import { ExternalLink, Heart, Settings } from "lucide-react";
import { BrandMark } from "@/components/brand";
import { AppHeaderClient } from "./app-header-client";

const PROJECT_LINKS = [
  {
    href: "https://github.com/marrokyoung/AWS-Cert-Practice",
    label: "GitHub",
  },
  {
    href: "https://github.com/marrokyoung/AWS-Cert-Practice/blob/main/DESIGN.md",
    label: "Docs",
  },
  {
    href: "https://github.com/marrokyoung/AWS-Cert-Practice/blob/main/CONTRIBUTING.md",
    label: "Contribute",
  },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-surface-bg flex min-h-dvh flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:shadow-md focus:outline-ring"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 shadow-sm backdrop-blur-sm supports-[backdrop-filter]:bg-background/85">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center gap-3 px-4 py-2">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2.5 text-foreground"
          >
            <BrandMark />
            <span className="flex flex-col leading-tight">
              <span className="font-heading text-base font-semibold tracking-tight sm:text-lg">
                AWS Cert Practice
              </span>
              <span className="hidden text-xs text-muted-foreground sm:inline">
                Open Source
              </span>
            </span>
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

      <main
        id="main-content"
        className="mx-auto w-full max-w-7xl flex-1 px-4 py-7 sm:py-8"
      >
        {children}
      </main>

      <footer className="border-t border-border/80 bg-background/85 text-xs text-muted-foreground backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <p className="flex items-center justify-center gap-1.5 md:justify-start">
            <Heart aria-hidden="true" className="size-3.5 text-primary" />
            Made with care for cloud learners everywhere.
          </p>
          <p className="text-center">
            AWS Cert Practice is an open-source project.
          </p>
          <nav
            aria-label="Project links"
            className="flex justify-center gap-4 md:justify-end"
          >
            {PROJECT_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-medium text-foreground/80 transition-colors hover:text-primary"
              >
                {link.label}
                <ExternalLink aria-hidden="true" className="size-3" />
              </a>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
