import { ArrowRight, ClipboardList, Layers, Target } from "lucide-react";

import {
  CertPageHeader,
  FriendlyEmptyState,
  PracticeQuestionFlow,
} from "@/components/study";
import { getQuestionsForCert } from "@/features/content";
import {
  CERTIFICATIONS,
  CERT_LABELS,
  type Certification,
} from "@/types/shared";

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
    // certs, so this is unreachable in practice. Render a neutral header
    // instead of throwing to keep the static build healthy if it ever is.
    return (
      <FriendlyEmptyState
        title="Practice route unavailable"
        description="This certification route is not available in the current catalog."
        mascotPose="rest"
      />
    );
  }

  const readyQuestions = getReadyQuestions(cert);
  const readyDomains = new Set(readyQuestions.map((q) => q.domain)).size;
  const alternatePracticeCert = CERTIFICATIONS.find(
    (candidate) => candidate !== cert && getReadyQuestions(candidate).length > 0,
  );

  if (readyQuestions.length === 0) {
    return (
      <div className="space-y-6">
        <CertPageHeader
          eyebrow={cert}
          title="Practice"
          description={`Focused question drilling for ${CERT_LABELS[cert]} will appear here as soon as ready questions are available.`}
          stats={[
            {
              label: "Ready questions",
              value: "0",
              icon: ClipboardList,
              tone: "blue",
            },
            {
              label: "Covered domains",
              value: "0",
              icon: Layers,
              tone: "green",
            },
            {
              label: "Retry candidates",
              value: "0",
              icon: Target,
              tone: "rust",
            },
          ]}
        />
        <FriendlyEmptyState
          eyebrow="Practice queue"
          title="No questions yet"
          description={
            alternatePracticeCert
              ? `${CERT_LABELS[alternatePracticeCert]} has practice questions ready now.`
              : "More practice questions are being prepared."
          }
          mascotPose="study"
          mascotLabel="A cloud study companion reading"
          primaryAction={
            alternatePracticeCert
              ? {
                  href: `/${alternatePracticeCert}/practice`,
                  label: `Try ${alternatePracticeCert} Practice`,
                  icon: ArrowRight,
                }
              : undefined
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CertPageHeader
        eyebrow={cert}
        title="Practice"
        description={`Focused question drilling for ${CERT_LABELS[cert]} with instant feedback and confidence tracking.`}
        stats={[
          {
            label: "Ready questions",
            value: String(readyQuestions.length),
            icon: ClipboardList,
            tone: "blue",
          },
          {
            label: "Covered domains",
            value: String(readyDomains),
            icon: Layers,
            tone: "green",
          },
          {
            label: "Retry candidates",
            value: "0",
            icon: Target,
            tone: "rust",
          },
        ]}
      />
      <PracticeQuestionFlow questions={readyQuestions} />
    </div>
  );
}
