import type { Certification, ContentStatus, Domain } from "./shared";

/** Concept card subtypes for Learn mode. */
export type ConceptCardType = "concept" | "comparison" | "when-to-use" | "gotcha";

export interface ConceptCard {
  id: string;
  cert: Certification;
  domain: Domain;
  topic: string;
  type: ConceptCardType;
  title: string;
  front: string;
  back: string;
  relatedQuestionIds: string[];
  awsSourceUrls: string[];
  tags: string[];
  status: ContentStatus;
}
