"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";

import { Mascot } from "@/components/brand";
import { buttonVariants } from "@/components/ui/button";
import { StudyCardShell } from "@/components/study/study-card-shell";
import { useSessionStore } from "@/features/identity/store";
import { CERTIFICATIONS, CERT_LABELS } from "@/types/shared";
import { cn } from "@/lib/utils";

import {
  HOME_CERT_CHANGE_EVENT,
  HOME_CERT_FALLBACK,
  readStoredHomeCert,
  writeStoredHomeCert,
} from "./home-cert";

/** Subscribe to same-tab and cross-tab home-cert changes for external-store sync. */
function subscribeHomeCert(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(HOME_CERT_CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(HOME_CERT_CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

/**
 * Home page dashboard.
 *
 * Renders first-run (cert selection + Start Learning) or returning-user
 * (Resume Session + Review Due Items) placeholder states based on the
 * session store's visitState. Always renders regardless of session
 * bootstrap success so static CTAs remain usable.
 */
export function HomeClient() {
  const visitState = useSessionStore((s) => s.visitState);
  const status = useSessionStore((s) => s.status);
  const error = useSessionStore((s) => s.error);

  // Read selected cert directly from localStorage via useSyncExternalStore so
  // SSR and hydration stay stable, then sync to the persisted value once the
  // client is mounted.
  const selectedCert = useSyncExternalStore(
    subscribeHomeCert,
    readStoredHomeCert,
    () => HOME_CERT_FALLBACK,
  );

  const showReturning = visitState === "returning";
  const sessionFailed = status === "error";
  const certLabel = CERT_LABELS[selectedCert];
  const learnHref = `/${selectedCert}/learn`;
  const reviewHref = `/${selectedCert}/review`;

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
        <div className="flex flex-col gap-2">
          <p className="font-mono text-xs font-medium uppercase tracking-wide text-primary">
            Open-source AWS certification prep
          </p>
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            {showReturning ? "Welcome back" : "Start studying"}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            {showReturning
              ? `Pick up where you left off with ${certLabel}, or switch to a different cert below.`
              : "Choose the AWS certification you are studying for and jump in. You can change this later."}
          </p>
        </div>
        <div className="hidden justify-end lg:flex">
          <Mascot
            pose={showReturning ? "hello" : "study"}
            label="A friendly cloud study companion"
            className="h-44 w-64"
          />
        </div>
      </section>

      {sessionFailed && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm shadow-sm"
        >
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0 text-destructive"
            aria-hidden
          />
          <p className="text-muted-foreground">
            Guest session initialization failed
            {error ? `: ${error}` : "."} Static study browsing still works.
          </p>
        </div>
      )}

      <StudyCardShell>
        <div className="flex flex-col gap-4">
          <fieldset className="flex flex-col gap-3">
            <legend className="flex flex-col gap-1">
              <span className="font-heading text-base font-semibold">
                Certification
              </span>
              <span className="text-sm font-normal text-muted-foreground">
                Your shortcuts and progress will stay focused on this exam.
              </span>
            </legend>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {CERTIFICATIONS.map((cert) => {
                const active = cert === selectedCert;
                return (
                  <label
                    key={cert}
                    className={cn(
                      "flex cursor-pointer flex-col items-start gap-1 rounded-lg border px-4 py-3 text-left transition-colors",
                      "has-[:focus-visible]:border-ring has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
                      active
                        ? "border-primary bg-primary/5 text-foreground shadow-sm"
                        : "border-border bg-background text-foreground hover:bg-accent/40",
                    )}
                  >
                    <input
                      type="radio"
                      name="home-cert"
                      value={cert}
                      checked={active}
                      onChange={() => writeStoredHomeCert(cert)}
                      className="sr-only"
                    />
                    <span className="font-mono text-xs text-muted-foreground">
                      {cert}
                    </span>
                    <span className="text-sm font-medium">
                      {CERT_LABELS[cert]}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="flex flex-wrap gap-2">
            {showReturning ? (
              <>
                <Link
                  href={learnHref}
                  className={buttonVariants({ size: "lg" })}
                >
                  <BookOpen className="size-4" />
                  Resume Session
                </Link>
                <Link
                  href={reviewHref}
                  className={buttonVariants({
                    size: "lg",
                    variant: "outline",
                  })}
                >
                  <RotateCcw className="size-4" />
                  Review Due Items
                </Link>
              </>
            ) : (
              <Link
                href={learnHref}
                className={buttonVariants({ size: "lg" })}
              >
                <BookOpen className="size-4" />
                Start Learning
              </Link>
            )}
          </div>
        </div>
      </StudyCardShell>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard
          title="Due Review"
          icon={RotateCcw}
          tone="rust"
          body={`No review items are due yet for ${certLabel}. Finish a study session to build your review queue.`}
        />
        <SummaryCard
          title="Weak Areas"
          icon={ShieldCheck}
          tone="green"
          body="Weak areas will appear once you have missed or marked low-confidence questions. Nothing to show yet."
        />
        <SummaryCard
          title="Recent Progress"
          icon={BarChart3}
          tone="blue"
          body="Recent study activity will show here once real sessions exist. Start a session to begin tracking progress."
        />
      </section>
    </div>
  );
}

const SUMMARY_TONES = {
  rust: "bg-primary/10 text-primary",
  green: "bg-emerald-600/10 text-emerald-700 dark:text-emerald-300",
  blue: "bg-sky-600/10 text-sky-700 dark:text-sky-300",
} as const;

/** Render one placeholder summary card on the home dashboard. */
function SummaryCard({
  title,
  body,
  icon: Icon,
  tone,
}: {
  title: string;
  body: string;
  icon: LucideIcon;
  tone: keyof typeof SUMMARY_TONES;
}) {
  return (
    <StudyCardShell className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "inline-flex size-8 shrink-0 items-center justify-center rounded-md",
            SUMMARY_TONES[tone],
          )}
          aria-hidden="true"
        >
          <Icon className="size-4" />
        </span>
        <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h3>
      </div>
      <p className="text-sm text-foreground">{body}</p>
    </StudyCardShell>
  );
}
