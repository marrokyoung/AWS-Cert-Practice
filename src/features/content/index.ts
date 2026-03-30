/**
 * Content access boundary — server only.
 *
 * This is the only app-level import point for content data.
 * Server Components and server-only helpers should use these functions
 * and pass only the needed slice to Client Components.
 */
import "server-only";

import {
  questions,
  conceptCards,
  contentCatalogMeta,
} from "../../generated/content-catalog";
import type { Certification, Domain } from "../../types/shared";

export { contentCatalogMeta };

export function getQuestions() {
  return questions;
}

export function getQuestionsForCert(cert: Certification) {
  return questions.filter((q) => q.cert === cert);
}

export function getQuestionsForDomain(cert: Certification, domain: Domain) {
  return questions.filter((q) => q.cert === cert && q.domain === domain);
}

export function getConceptCards() {
  return conceptCards;
}

export function getConceptCardsForCert(cert: Certification) {
  return conceptCards.filter((c) => c.cert === cert);
}

export function getConceptCardsForDomain(cert: Certification, domain: Domain) {
  return conceptCards.filter((c) => c.cert === cert && c.domain === domain);
}
