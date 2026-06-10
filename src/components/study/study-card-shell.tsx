import { cn } from "@/lib/utils";

/**
 * Soft content frame for study flows. It keeps the card treatment consistent
 * without imposing layout on children.
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
        "rounded-md border border-border/80 bg-card/95 p-4 text-card-foreground shadow-sm sm:p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
