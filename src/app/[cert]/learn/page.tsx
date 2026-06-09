import { CertPageHeader } from "@/components/study";
import { CERTIFICATIONS } from "@/types/shared";

export const dynamicParams = false;

export function generateStaticParams() {
  return CERTIFICATIONS.map((cert) => ({ cert }));
}

export default async function LearnPage() {
  return (
    <CertPageHeader description="Guided concept cards and topic walkthroughs coming soon." />
  );
}
