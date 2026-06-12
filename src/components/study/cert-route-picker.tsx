import Link from "next/link";

import type { GlobalRouteSegment } from "@/components/shell/navigation";
import { StudyCardShell } from "@/components/study/study-card-shell";
import { CERTIFICATIONS, CERT_LABELS } from "@/types/shared";

type CertRoutePickerProps = {
  segment: GlobalRouteSegment;
};

/**
 * Picker used by the top-level /review and /progress pages when the
 * URL carries no cert. Lists each certification with a link into its
 * cert-scoped equivalent (`/[cert]/{segment}`), so the user makes the
 * cert choice explicit before landing on the real page.
 */
export function CertRoutePicker({ segment }: CertRoutePickerProps) {
  return (
    <section className="mx-auto max-w-3xl space-y-4">
      <p className="text-sm text-muted-foreground">Choose a certification.</p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {CERTIFICATIONS.map((cert) => (
          <Link key={cert} href={`/${cert}/${segment}`} className="block">
            <StudyCardShell className="space-y-1 transition-colors hover:border-primary/40 hover:bg-accent/30">
              <p className="font-mono text-xs text-muted-foreground">{cert}</p>
              <h2 className="font-heading text-base font-semibold">
                {CERT_LABELS[cert]}
              </h2>
            </StudyCardShell>
          </Link>
        ))}
      </div>
    </section>
  );
}
