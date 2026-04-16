import { CERT_LABELS, type Certification } from "@/types/shared";

function isCertification(value: string): value is Certification {
  return value in CERT_LABELS;
}

type CertPageHeaderProps = {
  cert: string | Certification;
  title: string;
  description: string;
};

export function CertPageHeader({
  cert,
  title,
  description,
}: CertPageHeaderProps) {
  const certLabel = isCertification(cert) ? CERT_LABELS[cert] : cert;

  return (
    <div>
      <h1 className="font-heading text-2xl font-semibold tracking-tight">
        {title} &mdash; {certLabel}
      </h1>
      <p className="mt-2 text-muted-foreground">{description}</p>
    </div>
  );
}
