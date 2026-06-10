import { ArrowRight, CalendarDays, RotateCcw, StickyNote } from "lucide-react";

import { CertPageHeader, FriendlyEmptyState } from "@/components/study";
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

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ cert: string }>;
}) {
  const { cert } = await params;

  if (!isCertification(cert)) {
    return (
      <FriendlyEmptyState
        title="Review queue unavailable"
        description="This certification route is not available in the current catalog."
        mascotPose="rest"
      />
    );
  }

  return (
    <div className="space-y-6">
      <CertPageHeader
        eyebrow={cert}
        title="Review"
        description={`Flashcards and question retries for ${CERT_LABELS[cert]} will gather here as you study.`}
        stats={[
          {
            label: "Cards to review",
            value: "0",
            icon: StickyNote,
            tone: "blue",
          },
          {
            label: "Questions to retry",
            value: "0",
            icon: RotateCcw,
            tone: "rust",
          },
          {
            label: "Review streak",
            value: "0",
            icon: CalendarDays,
            tone: "amber",
          },
        ]}
      />

      <FriendlyEmptyState
        eyebrow="All caught up"
        title="Nothing to review yet"
        description="You are all caught up. After a few practice questions or concept cards, this page will help you revisit the items that need another look."
        mascotPose="review"
        mascotLabel="A cloud study companion holding a review card"
        primaryAction={{
          href: `/${cert}/practice`,
          label: "Go to Practice",
          icon: ArrowRight,
        }}
      />
    </div>
  );
}
