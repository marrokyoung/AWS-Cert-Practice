import { CertRoutePicker } from "@/components/study/cert-route-picker";

export default function ProgressPage() {
  return (
    <CertRoutePicker
      title="Choose a progress dashboard"
      description="Progress summaries are scoped to each certification so your accuracy, weak areas, and review work stay easy to scan."
      segment="progress"
      actionLabel="Open Progress"
      mascotPose="progress"
    />
  );
}
