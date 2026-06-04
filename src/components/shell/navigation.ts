import {
  CERTIFICATIONS,
  type Certification,
} from "@/types/shared";

export const CERT_ROUTE_SEGMENTS = ["learn", "practice", "exam"] as const;
export type CertRouteSegment = (typeof CERT_ROUTE_SEGMENTS)[number];

export const GLOBAL_ROUTE_SEGMENTS = ["review", "progress"] as const;
export type GlobalRouteSegment = (typeof GLOBAL_ROUTE_SEGMENTS)[number];

export type AppRouteSegment = CertRouteSegment | GlobalRouteSegment;

const DEFAULT_CERT_ROUTE_SEGMENT: CertRouteSegment = "learn";
const APP_ROUTE_SEGMENTS = [
  ...CERT_ROUTE_SEGMENTS,
  ...GLOBAL_ROUTE_SEGMENTS,
] as const;
const CERTIFICATION_SET = new Set<string>(CERTIFICATIONS);

function pathSegments(pathname: string): string[] {
  return pathname.split("/").filter(Boolean);
}

function isCertification(value: string | undefined): value is Certification {
  return value !== undefined && CERTIFICATION_SET.has(value);
}

function isAppRouteSegment(
  value: string | undefined,
): value is AppRouteSegment {
  return (
    value !== undefined &&
    (APP_ROUTE_SEGMENTS as readonly string[]).includes(value)
  );
}

function isGlobalRouteSegment(
  value: string | undefined,
): value is GlobalRouteSegment {
  return (
    value !== undefined &&
    (GLOBAL_ROUTE_SEGMENTS as readonly string[]).includes(value)
  );
}

/**
 * Returns the certification implied by the URL, or null when the path
 * is not cert-scoped (e.g. home, top-level /review, /progress).
 */
export function activeCert(pathname: string): Certification | null {
  const [maybeCert] = pathSegments(pathname);
  return isCertification(maybeCert) ? maybeCert : null;
}

/**
 * Returns the app route segment for the current path — the cert-scoped
 * segment under `/[cert]/…` or the global segment at the root. Returns
 * null for unknown or non-app routes.
 */
export function activeRouteSegment(pathname: string): AppRouteSegment | null {
  const [firstSegment, secondSegment] = pathSegments(pathname);

  if (isCertification(firstSegment) && isAppRouteSegment(secondSegment)) {
    return secondSegment;
  }

  if (isGlobalRouteSegment(firstSegment)) {
    return firstSegment;
  }

  return null;
}

/**
 * Builds the href for switching to another certification while keeping
 * the user on the same conceptual page. Falls back to the default cert
 * route segment when the current path has no recognizable app segment.
 */
export function hrefForCertSwitch(
  pathname: string,
  cert: Certification,
): string {
  const segment = activeRouteSegment(pathname) ?? DEFAULT_CERT_ROUTE_SEGMENT;
  return `/${cert}/${segment}`;
}

/**
 * Builds the href for a global nav item (Review, Progress). Routes
 * through the active cert when one is selected so the destination
 * stays cert-scoped; otherwise returns the top-level route.
 */
export function hrefForGlobalRoute(
  cert: Certification | null,
  segment: GlobalRouteSegment,
): string {
  return cert ? `/${cert}/${segment}` : `/${segment}`;
}
