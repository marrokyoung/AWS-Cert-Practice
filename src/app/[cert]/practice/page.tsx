import { FriendlyEmptyState, PracticeQuestionFlow } from "@/components/study";
import { getQuestionsForCert } from "@/features/content";
import { CERTIFICATIONS, type Certification } from "@/types/shared";

export const dynamicParams = false;

export function generateStaticParams() {
  return CERTIFICATIONS.map((cert) => ({ cert }));
}

function isCertification(value: string): value is Certification {
  return (CERTIFICATIONS as readonly string[]).includes(value);
}

function getReadyQuestions(cert: Certification) {
  return getQuestionsForCert(cert).filter((q) => q.status === "ready");
}

export default async function PracticePage({
  params,
}: {
  params: Promise<{ cert: string }>;
}) {
  const { cert } = await params;

  if (!isCertification(cert)) {
    // dynamicParams = false + generateStaticParams returns only valid
    // certs, so this is unreachable in practice. Render a stable fallback
    // instead of throwing to keep the static build healthy if it ever is.
    return (
      <FriendlyEmptyState
        message="This page is unavailable."
        mascotPose="rest"
      />
    );
  }

  const readyQuestions = getReadyQuestions(cert);

  if (readyQuestions.length === 0) {
    return (
      <FriendlyEmptyState
        message="Practice questions are still under construction."
        mascotPose="study"
        mascotLabel="A cloud study companion reading"
      />
    );
  }

  return <PracticeQuestionFlow questions={readyQuestions} />;
}
