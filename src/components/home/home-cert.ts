"use client";

/**
 * Home-page-only cert persistence.
 *
 * Stores the selected certification under a dedicated localStorage key
 * so reloading `/` restores the last-picked cert. This persistence is
 * scoped to the home page only and must not influence the global
 * header cert selector or any other study flows.
 */

import {
  CERTIFICATIONS,
  type Certification,
} from "@/types/shared";

const HOME_CERT_STORAGE_KEY = "aws-cert-practice.homeCert.v1";

/**
 * Event dispatched on the window after a successful home-cert write.
 * Lets same-tab subscribers (e.g. useSyncExternalStore) re-read the value,
 * since the native `storage` event only fires for other tabs.
 */
export const HOME_CERT_CHANGE_EVENT = "home-cert:change";

/** Default cert used when no valid persisted selection exists. */
export const HOME_CERT_FALLBACK: Certification = "CLF-C02";

/**
 * In-memory fallback used when localStorage is unavailable or throws.
 * Ensures a clicked selection still applies for the current browser
 * session even in storage-restricted environments (private mode, quota
 * exceeded, or blocked storage). localStorage remains the source of
 * truth when it works.
 */
let inMemoryCert: Certification | null = null;

function isCertification(value: unknown): value is Certification {
  return (
    typeof value === "string" &&
    (CERTIFICATIONS as readonly string[]).includes(value)
  );
}

/**
 * Read the stored home cert.
 *
 * Prefers a working localStorage value. Falls back to the in-memory
 * selection when storage is missing, threw, or holds an invalid value.
 * Returns the fallback cert only when none of the above yields one.
 */
export function readStoredHomeCert(): Certification {
  try {
    const value = localStorage.getItem(HOME_CERT_STORAGE_KEY);
    if (isCertification(value)) return value;
    if (value !== null) {
      try { localStorage.removeItem(HOME_CERT_STORAGE_KEY); } catch { /* best-effort */ }
    }
  } catch {
    // storage unavailable; fall through to in-memory fallback
  }
  return inMemoryCert ?? HOME_CERT_FALLBACK;
}

/**
 * Persist the selected home cert.
 *
 * Always records the choice in memory so the current-session selection
 * applies even if localStorage is not writable. A change event is
 * dispatched so `useSyncExternalStore` subscribers re-read the value.
 */
export function writeStoredHomeCert(cert: Certification): void {
  inMemoryCert = cert;
  try {
    localStorage.setItem(HOME_CERT_STORAGE_KEY, cert);
  } catch {
    // Persistence is best-effort; in-memory fallback still applies.
  }
  try {
    window.dispatchEvent(new Event(HOME_CERT_CHANGE_EVENT));
  } catch {
    // Event dispatch is best-effort; subscribers resync on the next storage event.
  }
}

/**
 * Reset the in-memory cert cache. Exposed for tests only so they can
 * restore a fresh module state between cases. Do not call from app code.
 * @internal
 */
export function __resetHomeCertInMemoryCacheForTests(): void {
  inMemoryCert = null;
}
