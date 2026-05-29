import Link from "next/link";
import { ArrowRight } from "lucide-react";

import {
  CertPageHeader,
  PracticeQuestionFlow,
  StudyCardShell,
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
      <CertPageHeader
        cert={cert}
        title="Practice"
        description="Unknown certification."
      />
    );
  }

  const readyQuestions = getReadyQuestions(cert);
  const alternatePracticeCert = CERTIFICATIONS.find(
    (candidate) => candidate !== cert && getReadyQuestions(candidate).length > 0,
  );

  return (
    <div className="space-y-6">
      <CertPageHeader
        cert={cert}
        title="Practice"
        description="Answer one question at a time, see explanations, and flag low-confidence answers for later retry."
      />

      {readyQuestions.length === 0 ? (
        <StudyCardShell className="space-y-2 text-sm text-muted-foreground">
          <h2 className="font-heading text-base font-semibold text-foreground">
            No questions yet
          </h2>
          <p>
            Practice questions for {CERT_LABELS[cert]} are not available yet.
            {alternatePracticeCert
              ? ` ${CERT_LABELS[alternatePracticeCert]} has practice questions ready now.`
              : " More practice questions are being prepared."}
          </p>
          {alternatePracticeCert ? (
            <Link
              href={`/${alternatePracticeCert}/practice`}
              className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Try {alternatePracticeCert} practice
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          ) : null}
        </StudyCardShell>
      ) : (
        <PracticeQuestionFlow questions={readyQuestions} />
      )}
    </div>
  );
}
