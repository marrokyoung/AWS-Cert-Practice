import { CertRoutePicker } from "@/components/study/cert-route-picker";

export default function ProgressPage() {
  return (
    <CertRoutePicker
      title="Progress"
      description="Choose a certification to view its progress dashboard."
      segment="progress"
      actionLabel="Open progress"
    />
  );
}
