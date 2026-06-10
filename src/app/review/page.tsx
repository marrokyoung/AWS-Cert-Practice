import { CertRoutePicker } from "@/components/study/cert-route-picker";

export default function ReviewPage() {
  return (
    <CertRoutePicker
      title="Choose a review queue"
      description="Review is tracked per certification so flashcards and question retries stay focused on the exam you are studying for."
      segment="review"
      actionLabel="Open Review"
      mascotPose="review"
    />
  );
}
