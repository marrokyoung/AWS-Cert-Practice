import { FriendlyEmptyState } from "@/components/study";
import { CERTIFICATIONS, type Certification } from "@/types/shared";

export const dynamicParams = false;

export function generateStaticParams() {
  return CERTIFICATIONS.map((cert) => ({ cert }));
}

function isCertification(value: string): value is Certification {
  return (CERTIFICATIONS as readonly string[]).includes(value);
}

export default async function ExamPage({
  params,
}: {
  params: Promise<{ cert: string }>;
}) {
  const { cert } = await params;

  if (!isCertification(cert)) {
    return (
      <FriendlyEmptyState
        message="This page is unavailable."
        mascotPose="rest"
      />
    );
  }

  return (
    <FriendlyEmptyState
      message="This page is still under construction."
      mascotPose="hello"
      mascotLabel="A cloud study companion waving hello"
    />
  );
}
