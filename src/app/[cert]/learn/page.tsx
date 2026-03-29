import { CERTIFICATIONS } from "@/types/shared";

export const dynamicParams = false;

export function generateStaticParams() {
  return CERTIFICATIONS.map((cert) => ({ cert }));
}

export default async function LearnPage({
  params,
}: {
  params: Promise<{ cert: string }>;
}) {
  const { cert } = await params;

  return (
    <main>
      <h1>Learn - {cert}</h1>
      <p>Guided concept cards and topic walkthroughs coming soon.</p>
    </main>
  );
}
