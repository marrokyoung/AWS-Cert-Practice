import { CertRoutePicker } from "@/components/study/cert-route-picker";

export default function ReviewPage() {
  return (
    <CertRoutePicker
      description="Choose a certification to view its review queue."
      segment="review"
      actionLabel="Open review"
    />
  );
}
