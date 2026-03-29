import { z } from "zod";
import { CERT_DOMAINS } from "@/types/shared";

const VALID_DOMAINS: Record<string, readonly string[]> = CERT_DOMAINS;

const ALL_DOMAINS = [
  ...CERT_DOMAINS["CLF-C02"],
  ...CERT_DOMAINS["SAA-C03"],
] as const;

const questionOptionSchema = z.object({
  id: z.string(),
  text: z.string(),
});

/**
 * Zod schema for validating raw question JSON content files.
 * Used by the content build pipeline to catch errors before catalog generation.
 */
export const questionSchema = z
  .object({
    id: z.string(),
    cert: z.enum(["CLF-C02", "SAA-C03"]),
    domain: z.enum(ALL_DOMAINS),
    topic: z.string(),
    difficulty: z.enum(["foundational", "intermediate", "advanced"]),
    type: z.enum(["multiple-choice", "multiple-select"]),
    stem: z.string(),
    options: z.array(questionOptionSchema).min(2),
    correctAnswers: z.array(z.string()).min(1),
    explanation: z.string(),
    distractorExplanations: z.record(z.string(), z.string()),
    awsSourceUrls: z.array(z.url()).min(1),
    examVersion: z.string(),
    tags: z.array(z.string()),
    status: z.enum(["verified", "community", "draft"]),
    contributors: z.array(z.string()),
  })
  .refine(
    (q) => VALID_DOMAINS[q.cert]?.includes(q.domain),
    { message: "domain must be a valid domain for the specified cert" },
  )
  .refine(
    (q) => {
      const ids = q.options.map((o) => o.id);
      return new Set(ids).size === ids.length;
    },
    { message: "Option ids must be unique" },
  )
  .refine(
    (q) =>
      q.type !== "multiple-choice" || q.correctAnswers.length === 1,
    { message: "multiple-choice questions must have exactly one correct answer" },
  )
  .refine(
    (q) =>
      q.type !== "multiple-select" || q.correctAnswers.length >= 2,
    { message: "multiple-select questions must have at least two correct answers" },
  )
  .refine(
    (q) => {
      const ids = new Set(q.options.map((o) => o.id));
      return q.correctAnswers.every((a) => ids.has(a));
    },
    { message: "correctAnswers must reference valid option ids" },
  )
  .refine(
    (q) => {
      const correct = new Set(q.correctAnswers);
      const distractorKeys = new Set(Object.keys(q.distractorExplanations));
      const incorrectIds = q.options
        .map((o) => o.id)
        .filter((id) => !correct.has(id));
      return (
        incorrectIds.every((id) => distractorKeys.has(id)) &&
        distractorKeys.size === incorrectIds.length &&
        [...distractorKeys].every((k) => !correct.has(k))
      );
    },
    { message: "distractorExplanations must have exactly one entry per incorrect option and none for correct options" },
  );

export type QuestionInput = z.infer<typeof questionSchema>;
