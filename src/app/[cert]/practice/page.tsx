import { CERTIFICATIONS, CERT_LABELS } from "@/types/shared";
import type { Certification } from "@/types/shared";

export const dynamicParams = false;

export function generateStaticParams() {
  return CERTIFICATIONS.map((cert) => ({ cert }));
}

export default async function PracticePage({
  params,
}: {
  params: Promise<{ cert: string }>;
}) {
  const { cert } = await params;

  return (
    <div>
      <h1 className="font-heading text-2xl font-semibold tracking-tight">
        Practice &mdash; {CERT_LABELS[cert as Certification] ?? cert}
      </h1>
      <p className="mt-2 text-muted-foreground">
        Focused question drilling coming soon.
      </p>
    </div>
  );
}
