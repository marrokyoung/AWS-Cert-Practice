import { ArrowRight, CheckCircle2, ClipboardList, Timer } from "lucide-react";

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

export default async function ExamPage({
  params,
}: {
  params: Promise<{ cert: string }>;
}) {
  const { cert } = await params;

  if (!isCertification(cert)) {
    return (
      <FriendlyEmptyState
        title="Exam route unavailable"
        description="This certification route is not available in the current catalog."
        mascotPose="rest"
      />
    );
  }

  return (
    <div className="space-y-6">
      <CertPageHeader
        eyebrow={cert}
        title="Exam"
        description={`Timed ${CERT_LABELS[cert]} simulations will help you rehearse pacing once enough reviewed content is available.`}
        stats={[
          {
            label: "Quick exam",
            value: "20",
            icon: Timer,
            tone: "amber",
          },
          {
            label: "Practice exam",
            value: "40",
            icon: ClipboardList,
            tone: "blue",
          },
          {
            label: "Full exam",
            value: "65",
            icon: CheckCircle2,
            tone: "green",
          },
        ]}
      />

      <FriendlyEmptyState
        eyebrow="Timed mode soon"
        title="Exam simulations are warming up"
        description="The timed flow is not ready yet. Practice mode is available now and will give exam mode better source material as the catalog grows."
        mascotPose="hello"
        mascotLabel="A cloud study companion waving hello"
        primaryAction={{
          href: `/${cert}/practice`,
          label: "Practice First",
          icon: ArrowRight,
        }}
      />
    </div>
  );
}
