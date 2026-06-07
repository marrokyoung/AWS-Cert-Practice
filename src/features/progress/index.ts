/**
 * Progress feature boundary.
 *
 * The only module allowed to depend on both review tracks (Flashcard
 * scheduler + Question Retry), since aggregation across them is exactly
 * its job. Pure functions over caller-supplied result/queue arrays.
 *
 * Safe to import from Server and Client Components.
 */

export {
  summarizeCertProgress,
  summarizeDomainProgress,
  type SummarizeCertProgressInput,
  type SummarizeDomainProgressInput,
} from "./progress-tracker";
