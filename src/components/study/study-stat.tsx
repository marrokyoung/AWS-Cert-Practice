import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type StudyStat = {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "rust" | "green" | "blue" | "amber";
};

const TONE_CLASSES: Record<NonNullable<StudyStat["tone"]>, string> = {
  rust: "bg-primary/10 text-primary",
  green: "bg-emerald-600/10 text-emerald-700 dark:text-emerald-300",
  blue: "bg-sky-600/10 text-sky-700 dark:text-sky-300",
  amber: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
};

export function StudyStatRow({
  stats,
  className,
}: {
  stats: readonly StudyStat[];
  className?: string;
}) {
  if (stats.length === 0) return null;

  return (
    <dl className={cn("grid grid-cols-1 gap-3 sm:grid-cols-3", className)}>
      {stats.map(({ label, value, icon: Icon, tone = "rust" }) => (
        <div
          key={label}
          className="flex min-w-0 items-center gap-3 rounded-md border border-border/80 bg-card/90 px-4 py-3 text-card-foreground shadow-sm"
        >
          <span
            className={cn(
              "inline-flex size-9 shrink-0 items-center justify-center rounded-md",
              TONE_CLASSES[tone],
            )}
            aria-hidden="true"
          >
            <Icon className="size-4" />
          </span>
          <div className="min-w-0">
            <dt className="truncate text-xs text-muted-foreground">{label}</dt>
            <dd className="font-heading text-lg font-semibold leading-tight">
              {value}
            </dd>
          </div>
        </div>
      ))}
    </dl>
  );
}
