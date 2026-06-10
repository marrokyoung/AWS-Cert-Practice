"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  ChevronDown,
  ClipboardList,
  RotateCcw,
  Timer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CERTIFICATIONS, CERT_LABELS, type Certification } from "@/types/shared";
import {
  activeCert,
  hrefForCertSwitch,
  hrefForGlobalRoute,
} from "./navigation";

const CERT_ROUTES = [
  { segment: "learn", label: "Learn", icon: BookOpen },
  { segment: "practice", label: "Practice", icon: ClipboardList },
  { segment: "exam", label: "Exam", icon: Timer },
] as const;

const GLOBAL_ROUTES = [
  { segment: "review", label: "Review", icon: RotateCcw },
  { segment: "progress", label: "Progress", icon: BarChart3 },
] as const;

/**
 * App-shell header nav. Derives the active cert from the URL and shows
 * cert-scoped routes (Learn/Practice/Exam) only when a cert is in the
 * path. Global routes (Review/Progress) resolve through the active
 * cert when one exists so the user stays inside that cert.
 */
export function AppHeaderClient() {
  const pathname = usePathname();
  const cert = activeCert(pathname);

  return (
    <>
      <CertSelector activeCert={cert} pathname={pathname} />

      <nav className="flex min-w-0 flex-1 items-center justify-center gap-1 overflow-x-auto px-1">
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
                  "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            );
          })}

        {cert && <Separator />}

        {GLOBAL_ROUTES.map(({ segment, label, icon: Icon }) => {
          const href = hrefForGlobalRoute(cert, segment);
          const active = pathname === href;

          return (
            <Link
              key={segment}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

function Separator() {
  return <div className="mx-1 hidden h-5 w-px bg-border sm:block" aria-hidden />;
}

/**
 * Disclosure menu for switching the active cert. Built on the native
 * `<details>` element for keyboard/AT support; the effect wires up
 * click-outside and Escape-to-close since `<details>` does not handle
 * those itself. Each cert link uses `hrefForCertSwitch` so the user
 * stays on the same conceptual page after switching.
 */
function CertSelector({
  activeCert,
  pathname,
}: {
  activeCert: Certification | null;
  pathname: string;
}) {
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
      <summary
        aria-haspopup="menu"
        className="flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-md border border-border/70 bg-card/80 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors select-none list-none hover:bg-accent/60 hover:text-foreground [&::-webkit-details-marker]:hidden"
      >
        {label}
        <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" />
      </summary>
      <div
        role="menu"
        aria-label="Certification options"
        className="absolute left-0 top-full z-50 mt-1 min-w-[220px] rounded-md border border-border bg-popover p-1 shadow-md"
      >
        {CERTIFICATIONS.map((cert) => (
          <Link
            key={cert}
            href={hrefForCertSwitch(pathname, cert)}
            role="menuitem"
            className={cn(
              "block rounded-md px-3 py-2 text-sm transition-colors",
              cert === activeCert
                ? "bg-primary/10 font-medium text-primary"
                : "text-popover-foreground hover:bg-accent/60",
            )}
            onClick={(e) => {
              const details = e.currentTarget.closest("details");
              if (details) details.removeAttribute("open");
            }}
          >
            <span className="font-mono text-xs text-muted-foreground">
              {cert}
            </span>{" "}
            {" - "}
            {CERT_LABELS[cert]}
          </Link>
        ))}
      </div>
    </details>
  );
}
