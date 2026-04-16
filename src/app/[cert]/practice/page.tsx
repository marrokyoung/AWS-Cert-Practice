import { CertPageHeader } from "@/components/study";
import { CERTIFICATIONS } from "@/types/shared";

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
    <CertPageHeader
      cert={cert}
      title="Practice"
      description="Focused question drilling coming soon."
    />
  );
}
