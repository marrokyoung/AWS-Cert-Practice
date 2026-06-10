import { StudyStatRow, type StudyStat } from "./study-stat";
import { cn } from "@/lib/utils";

type CertPageHeaderProps = {
  title: string;
  description: string;
  eyebrow?: string;
  stats?: readonly StudyStat[];
};

export function CertPageHeader({
  title,
  description,
  eyebrow,
  stats = [],
}: CertPageHeaderProps) {
  const hasStats = stats.length > 0;

  return (
    <section
      className={cn(
        "grid gap-4",
        hasStats &&
          "lg:grid-cols-[minmax(0,1fr)_minmax(20rem,34rem)] lg:items-end",
      )}
    >
      <div className="space-y-2">
        {eyebrow ? (
          <p className="font-mono text-xs font-medium uppercase tracking-wide text-primary">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          {title}
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          {description}
        </p>
      </div>
      {hasStats ? <StudyStatRow stats={stats} /> : null}
    </section>
  );
}
