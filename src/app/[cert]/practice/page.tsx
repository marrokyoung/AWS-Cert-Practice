import {
  CertPageHeader,
  PracticeQuestionFlow,
  StudyCardShell,
} from "@/components/study";
import { getQuestionsForCert } from "@/features/content";
import { CERTIFICATIONS, type Certification } from "@/types/shared";

export const dynamicParams = false;

export function generateStaticParams() {
  return CERTIFICATIONS.map((cert) => ({ cert }));
}

function isCertification(value: string): value is Certification {
  return (CERTIFICATIONS as readonly string[]).includes(value);
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

  const readyQuestions = getQuestionsForCert(cert).filter(
    (q) => q.status === "ready",
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
            Seeded practice content for this certification is not available
            yet. Check back once questions are added under
            {" "}
            <code className="font-mono text-xs">content/{cert}/</code>.
          </p>
        </StudyCardShell>
      ) : (
        <PracticeQuestionFlow questions={readyQuestions} />
      )}
    </div>
  );
}
