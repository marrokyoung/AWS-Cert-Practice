import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { GlobalRouteSegment } from "@/components/shell/navigation";
import { StudyCardShell } from "@/components/study/study-card-shell";
import { CERTIFICATIONS, CERT_LABELS } from "@/types/shared";

type CertRoutePickerProps = {
  description: string;
  segment: GlobalRouteSegment;
  actionLabel: string;
};

/**
 * Picker used by the top-level /review and /progress pages when the
 * URL carries no cert. Lists each certification with a link into its
 * cert-scoped equivalent (`/[cert]/{segment}`), so the user makes the
 * cert choice explicit before landing on the real page.
 */
export function CertRoutePicker({
  description,
  segment,
  actionLabel,
}: CertRoutePickerProps) {
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">
        {description}
      </h1>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {CERTIFICATIONS.map((cert) => (
          <StudyCardShell key={cert} className="flex flex-col gap-3">
            <div className="space-y-1">
              <p className="font-mono text-xs text-muted-foreground">
                {cert}
              </p>
              <h2 className="font-heading text-base font-semibold">
                {CERT_LABELS[cert]}
              </h2>
            </div>
            <Link
              href={`/${cert}/${segment}`}
              className="inline-flex w-fit items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              {actionLabel}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </StudyCardShell>
        ))}
      </section>
    </div>
  );
}
