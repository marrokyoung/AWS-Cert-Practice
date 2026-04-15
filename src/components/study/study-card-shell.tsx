import { cn } from "@/lib/utils";

/**
 * Neutral content frame for study flows (learn, practice, review).
 * Provides consistent card styling without imposing layout on children.
 */
export function StudyCardShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}
