import Link from "next/link";
import { ArrowRight, BookOpenCheck } from "lucide-react";

import type { GlobalRouteSegment } from "@/components/shell/navigation";
import { Mascot, type MascotPose } from "@/components/brand";
import { CertPageHeader } from "@/components/study/cert-page-header";
import { StudyCardShell } from "@/components/study/study-card-shell";
import { CERTIFICATIONS, CERT_LABELS } from "@/types/shared";

type CertRoutePickerProps = {
  title: string;
  description: string;
  segment: GlobalRouteSegment;
  actionLabel: string;
  mascotPose?: MascotPose;
};

/**
 * Picker used by the top-level /review and /progress pages when the
 * URL carries no cert. Lists each certification with a link into its
 * cert-scoped equivalent (`/[cert]/{segment}`), so the user makes the
 * cert choice explicit before landing on the real page.
 */
export function CertRoutePicker({
  title,
  description,
  segment,
  actionLabel,
  mascotPose = "hello",
}: CertRoutePickerProps) {
  return (
    <div className="space-y-6">
      <CertPageHeader title={title} description={description} />

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {CERTIFICATIONS.map((cert) => (
            <StudyCardShell key={cert} className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <span
                  className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
                  aria-hidden="true"
                >
                  <BookOpenCheck className="size-5" />
                </span>
                <div className="min-w-0 space-y-1">
                  <p className="font-mono text-xs text-muted-foreground">
                    {cert}
                  </p>
                  <h2 className="font-heading text-base font-semibold">
                    {CERT_LABELS[cert]}
                  </h2>
                </div>
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
        </div>
        <div className="hidden items-end justify-center rounded-md border border-border/80 bg-card/80 p-4 shadow-sm lg:flex">
          <Mascot
            pose={mascotPose}
            label="A friendly cloud study companion"
            className="h-44 w-64"
          />
        </div>
      </section>
    </div>
  );
}
