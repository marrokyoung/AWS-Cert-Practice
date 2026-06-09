import { CertPageHeader } from "@/components/study";
import { CERTIFICATIONS } from "@/types/shared";

export const dynamicParams = false;

export function generateStaticParams() {
  return CERTIFICATIONS.map((cert) => ({ cert }));
}

export default async function ProgressPage() {
  return <CertPageHeader description="Study progress dashboard coming soon." />;
}
