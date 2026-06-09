type CertPageHeaderProps = {
  description: string;
};

export function CertPageHeader({ description }: CertPageHeaderProps) {
  return (
    <h1 className="font-heading text-2xl font-semibold tracking-tight">
      {description}
    </h1>
  );
}
