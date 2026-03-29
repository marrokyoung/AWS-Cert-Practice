import type { Certification, Domain } from "./shared";

/** Per-domain progress summary. */
export interface DomainProgress {
  domain: Domain;
  questionsAttempted: number;
  questionsCorrect: number;
  conceptsViewed: number;
  flashcardsDue: number;
  retriesDue: number;
}

/** Overall cert-level progress summary. */
export interface CertProgress {
  cert: Certification;
  domains: DomainProgress[];
  totalQuestionsAttempted: number;
  totalQuestionsCorrect: number;
  lastStudiedAt?: string;
}
