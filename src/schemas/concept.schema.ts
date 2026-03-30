import { z } from "zod";
import { CERT_DOMAINS } from "../types/shared";
import { awsSourceUrlsSchema } from "./aws-source-url";

const VALID_DOMAINS: Record<string, readonly string[]> = CERT_DOMAINS;

const ALL_DOMAINS = [
  ...CERT_DOMAINS["CLF-C02"],
  ...CERT_DOMAINS["SAA-C03"],
] as const;

/**
 * Zod schema for validating raw concept card JSON content files.
 * Used by the content build pipeline to catch errors before catalog generation.
 */
export const conceptCardSchema = z
  .object({
    id: z.string(),
    cert: z.enum(["CLF-C02", "SAA-C03"]),
    domain: z.enum(ALL_DOMAINS),
    topic: z.string(),
    type: z.enum(["concept", "comparison", "when-to-use", "gotcha"]),
    title: z.string(),
    front: z.string(),
    back: z.string(),
    relatedQuestionIds: z.array(z.string()),
    awsSourceUrls: awsSourceUrlsSchema,
    tags: z.array(z.string()),
    status: z.enum(["draft", "ready"]),
  })
  .refine(
    (c) => VALID_DOMAINS[c.cert]?.includes(c.domain),
    { message: "domain must be a valid domain for the specified cert" },
  );

export type ConceptCardInput = z.infer<typeof conceptCardSchema>;
