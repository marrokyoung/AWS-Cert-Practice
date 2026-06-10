import { ArrowRight, BookOpen, Layers, Target } from "lucide-react";

import { CertPageHeader, FriendlyEmptyState } from "@/components/study";
import { getConceptCardsForCert, getQuestionsForCert } from "@/features/content";
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

export default async function LearnPage({
  params,
}: {
  params: Promise<{ cert: string }>;
}) {
  const { cert } = await params;

  if (!isCertification(cert)) {
    return (
      <FriendlyEmptyState
        title="Learning path unavailable"
        description="This certification route is not available in the current catalog."
        mascotPose="rest"
      />
    );
  }

  const conceptCards = getConceptCardsForCert(cert).filter(
    (card) => card.status === "ready",
  );
  const readyQuestions = getQuestionsForCert(cert).filter(
    (question) => question.status === "ready",
  );

  return (
    <div className="space-y-6">
      <CertPageHeader
        eyebrow={cert}
        title="Learn"
        description={`Guided ${CERT_LABELS[cert]} concept cards will live here with short explanations, recall prompts, and links into practice.`}
        stats={[
          {
            label: "Concept cards",
            value: String(conceptCards.length),
            icon: BookOpen,
            tone: "blue",
          },
          {
            label: "Practice links",
            value: String(readyQuestions.length),
            icon: Target,
            tone: "rust",
          },
          {
            label: "Domains",
            value: "4",
            icon: Layers,
            tone: "green",
          },
        ]}
      />

      <FriendlyEmptyState
        eyebrow="Coming next"
        title="The learning path is being mapped"
        description="Soon this page will break the exam guide into friendly concept cards. For now, practice questions are the best way to start building your queue."
        mascotPose="study"
        mascotLabel="A cloud study companion reading a book"
        primaryAction={{
          href: `/${cert}/practice`,
          label: "Try Practice",
          icon: ArrowRight,
        }}
      />
    </div>
  );
}
