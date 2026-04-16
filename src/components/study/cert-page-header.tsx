import { CERT_LABELS, type Certification } from "@/types/shared";

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
  return (
    <div>
      <h1 className="font-heading text-2xl font-semibold tracking-tight">
        {title} &mdash; {CERT_LABELS[cert as Certification] ?? cert}
      </h1>
      <p className="mt-2 text-muted-foreground">{description}</p>
    </div>
  );
}
