import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";

import { Mascot, type MascotPose } from "@/components/brand";
import { cn } from "@/lib/utils";

type EmptyStateAction = {
  href: string;
  label: string;
  icon?: LucideIcon;
};

type FriendlyEmptyStateProps = {
  eyebrow?: string;
  title: string;
  description: string;
  mascotPose?: MascotPose;
  mascotLabel?: string;
  primaryAction?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  className?: string;
};

const ACTION_CLASSES = {
  default:
    "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-transparent bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  outline:
    "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
} as const;

export function FriendlyEmptyState({
  eyebrow,
  title,
  description,
  mascotPose = "study",
  mascotLabel,
  primaryAction,
  secondaryAction,
  className,
}: FriendlyEmptyStateProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-md border border-border bg-card px-5 py-10 text-card-foreground shadow-sm sm:px-8 sm:py-12",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,color-mix(in_oklch,var(--primary)_12%,transparent),transparent_36%)]" />
      <div className="relative mx-auto flex max-w-2xl flex-col items-center text-center">
        <Mascot
          pose={mascotPose}
          label={mascotLabel}
          className="mb-3 h-36 w-52 sm:h-44 sm:w-64"
        />

        {eyebrow ? (
          <p className="mb-2 font-mono text-xs font-medium uppercase tracking-wide text-primary">
            {eyebrow}
          </p>
        ) : null}

        <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
          {description}
        </p>

        {primaryAction || secondaryAction ? (
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {primaryAction ? (
              <EmptyStateLink action={primaryAction} />
            ) : null}
            {secondaryAction ? (
              <EmptyStateLink action={secondaryAction} variant="outline" />
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function EmptyStateLink({
  action,
  variant = "default",
}: {
  action: EmptyStateAction;
  variant?: "default" | "outline";
}) {
  const Icon = action.icon ?? ArrowRight;

  return (
    <Link
      href={action.href}
      className={ACTION_CLASSES[variant]}
    >
      {action.label}
      <Icon aria-hidden="true" className="size-4" />
    </Link>
  );
}
