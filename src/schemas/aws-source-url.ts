import { z } from "zod";

/**
 * Central list of allowed documentation hosts for authored content.
 * Keep this narrow for now and expand intentionally if the content policy changes.
 */
export const ALLOWED_AWS_SOURCE_HOSTS = ["docs.aws.amazon.com"] as const;

function isAllowedAwsSourceUrl(value: string) {
  try {
    const url = new URL(value);

    return (
      url.protocol === "https:" &&
      ALLOWED_AWS_SOURCE_HOSTS.includes(
        url.hostname as (typeof ALLOWED_AWS_SOURCE_HOSTS)[number],
      )
    );
  } catch {
    return false;
  }
}

export const awsSourceUrlSchema = z
  .url()
  .refine(isAllowedAwsSourceUrl, {
    message: `Source URLs must use HTTPS and an approved AWS documentation host (${ALLOWED_AWS_SOURCE_HOSTS.join(", ")})`,
  });

export const awsSourceUrlsSchema = z.array(awsSourceUrlSchema).min(1);
