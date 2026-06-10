import { ArrowRight, BarChart3, CheckCircle2, RotateCcw } from "lucide-react";

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

export default async function ProgressPage({
  params,
}: {
  params: Promise<{ cert: string }>;
}) {
  const { cert } = await params;

  if (!isCertification(cert)) {
    return (
      <FriendlyEmptyState
        title="Progress unavailable"
        description="This certification route is not available in the current catalog."
        mascotPose="rest"
      />
    );
  }

  return (
    <div className="space-y-6">
      <CertPageHeader
        eyebrow={cert}
        title="Progress"
        description={`${CERT_LABELS[cert]} accuracy, weak areas, and review load will appear here as your sessions build history.`}
        stats={[
          {
            label: "Questions tried",
            value: "0",
            icon: BarChart3,
            tone: "blue",
          },
          {
            label: "Accuracy",
            value: "-",
            icon: CheckCircle2,
            tone: "green",
          },
          {
            label: "Review due",
            value: "0",
            icon: RotateCcw,
            tone: "rust",
          },
        ]}
      />

      <FriendlyEmptyState
        eyebrow="Fresh start"
        title="No progress data yet"
        description="Take a practice session or review a few cards, and this dashboard will start showing what is improving and what needs another pass."
        mascotPose="progress"
        mascotLabel="A cloud study companion pointing at progress bars"
        primaryAction={{
          href: `/${cert}/practice`,
          label: "Start Practicing",
          icon: ArrowRight,
        }}
      />
    </div>
  );
}
