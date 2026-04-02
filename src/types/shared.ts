/** Supported AWS certifications. */
export type Certification = "CLF-C02" | "SAA-C03";

export const CERTIFICATIONS: readonly Certification[] = [
  "CLF-C02",
  "SAA-C03",
] as const;

/** Human-readable labels for each certification. */
export const CERT_LABELS: Record<Certification, string> = {
  "CLF-C02": "Cloud Practitioner",
  "SAA-C03": "Solutions Architect Associate",
};

/** Domain names per certification, matching the official exam guides. */
export const CERT_DOMAINS = {
  "CLF-C02": [
    "cloud-concepts",
    "security-and-compliance",
    "cloud-technology-and-services",
    "billing-pricing-support",
  ],
  "SAA-C03": [
    "secure-architectures",
    "resilient-architectures",
    "high-performing-architectures",
    "cost-optimized-architectures",
  ],
} as const;

export type Domain = (typeof CERT_DOMAINS)[Certification][number];

/** Question format types. */
export type QuestionType = "multiple-choice" | "multiple-select";

/** Difficulty tiers aligned to cert complexity. */
export type Difficulty = "foundational" | "intermediate" | "advanced";

/** Content editorial readiness status. */
export type ContentStatus = "draft" | "ready";
