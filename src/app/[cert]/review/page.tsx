import { CertPageHeader } from "@/components/study";
import { CERTIFICATIONS } from "@/types/shared";

export const dynamicParams = false;

export function generateStaticParams() {
  return CERTIFICATIONS.map((cert) => ({ cert }));
}

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ cert: string }>;
}) {
  const { cert } = await params;

  return (
    <CertPageHeader
      cert={cert}
      title="Review"
      description="Flashcard review and question retry sessions coming soon."
    />
  );
}
