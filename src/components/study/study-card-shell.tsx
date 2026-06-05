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
        "rounded-md border border-border bg-card p-4 text-card-foreground shadow-sm sm:p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
