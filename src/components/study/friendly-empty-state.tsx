import { Mascot, type MascotPose } from "@/components/brand";
import { cn } from "@/lib/utils";

type FriendlyEmptyStateProps = {
  message: string;
  mascotPose?: MascotPose;
  mascotLabel?: string;
  className?: string;
};

export function FriendlyEmptyState({
  message,
  mascotPose = "study",
  mascotLabel,
  className,
}: FriendlyEmptyStateProps) {
  return (
    <section
      className={cn(
        "rounded-md border border-border bg-card px-5 py-10 text-card-foreground shadow-sm sm:px-8 sm:py-12",
        className,
      )}
    >
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <Mascot
          pose={mascotPose}
          label={mascotLabel}
          className="mb-3 h-36 w-52 sm:h-44 sm:w-64"
        />
        <p className="max-w-xl font-heading text-lg font-semibold sm:text-xl">
          {message}
        </p>
      </div>
    </section>
  );
}
