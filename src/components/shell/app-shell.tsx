"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useEffect } from "react";
import {
  BookOpen,
  ClipboardList,
  Timer,
  RotateCcw,
  BarChart3,
  Settings,
  ChevronDown,
} from "lucide-react";
import { CERTIFICATIONS, CERT_LABELS, type Certification } from "@/types/shared";
import { cn } from "@/lib/utils";

const CERT_ROUTES = [
  { segment: "learn", label: "Learn", icon: BookOpen },
  { segment: "practice", label: "Practice", icon: ClipboardList },
  { segment: "exam", label: "Exam", icon: Timer },
] as const;

const GLOBAL_ROUTES = [
  { href: "/review", label: "Review", icon: RotateCcw },
  { href: "/progress", label: "Progress", icon: BarChart3 },
] as const;

/** Extract the cert slug from the current pathname, if any. */
function activeCert(pathname: string): Certification | null {
  return (
    CERTIFICATIONS.find(
      (c) => pathname.startsWith(`/${c}/`) || pathname === `/${c}`,
    ) ?? null
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const cert = activeCert(pathname);

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

          {/* Cert selector - outside the scrollable nav to avoid overflow clipping */}
          <CertSelector activeCert={cert} />

          <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
            {/* Cert-scoped nav links */}
            {cert &&
              CERT_ROUTES.map(({ segment, label, icon: Icon }) => {
                const href = `/${cert}/${segment}`;
                const active = pathname === href;
                return (
                  <Link
                    key={segment}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4" />
                    {label}
                  </Link>
                );
              })}

            {cert && <Separator />}

            {/* Global nav links */}
            {GLOBAL_ROUTES.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Settings placeholder */}
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

/** Vertical separator for the nav bar. */
function Separator() {
  return <div className="mx-1 h-5 w-px bg-border" aria-hidden />;
}

/** Cert selector dropdown with outside-click and Escape key dismissal. */
function CertSelector({ activeCert }: { activeCert: Certification | null }) {
  const label = activeCert ? CERT_LABELS[activeCert] : "Select Cert";
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function onClickOutside(e: MouseEvent) {
      if (el!.open && !el!.contains(e.target as Node)) {
        el!.removeAttribute("open");
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && el!.open) {
        el!.removeAttribute("open");
        el!.querySelector("summary")?.focus();
      }
    }

    document.addEventListener("click", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("click", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <details ref={ref} className="group relative shrink-0">
      <summary className="flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors select-none list-none hover:bg-accent/50 hover:text-foreground [&::-webkit-details-marker]:hidden">
        {label}
        <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" />
      </summary>
      <div className="absolute left-0 top-full z-50 mt-1 min-w-[200px] rounded-lg border border-border bg-popover p-1 shadow-md">
        {CERTIFICATIONS.map((cert) => (
          <Link
            key={cert}
            href={`/${cert}/learn`}
            className={cn(
              "block rounded-md px-3 py-2 text-sm transition-colors",
              cert === activeCert
                ? "bg-accent font-medium text-accent-foreground"
                : "text-popover-foreground hover:bg-accent/50",
            )}
            onClick={(e) => {
              const details = e.currentTarget.closest("details");
              if (details) details.removeAttribute("open");
            }}
          >
            <span className="font-mono text-xs text-muted-foreground">
              {cert}
            </span>{" "}
            &mdash; {CERT_LABELS[cert]}
          </Link>
        ))}
      </div>
    </details>
  );
}
