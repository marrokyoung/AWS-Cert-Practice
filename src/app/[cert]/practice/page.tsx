import { CERTIFICATIONS } from "@/types/shared";

export const dynamicParams = false;

export function generateStaticParams() {
  return CERTIFICATIONS.map((cert) => ({ cert }));
}

export default async function PracticePage({
  params,
}: {
  params: Promise<{ cert: string }>;
}) {
  const { cert } = await params;

  return (
    <main>
      <h1>Practice - {cert}</h1>
      <p>Focused question drilling coming soon.</p>
    </main>
  );
}
