/** Standard API error envelope returned by the backend. */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/** GET /health */
export interface HealthResponse {
  status: "ok" | "degraded";
  timestamp: string;
}

/** GET /version */
export interface VersionResponse {
  version: string;
  contentVersion: string;
}

/** GET /config -- static bootstrap data the frontend needs on startup. */
export interface ConfigResponse {
  supportedCerts: string[];
  defaultCert: string;
  guestSessionTtlSeconds: number;
}

/** POST /guest-sessions -- request body. */
export interface GuestSessionBootstrapRequest {
  /** Client-generated fingerprint for continuity (optional). */
  clientId?: string;
}

/** POST /guest-sessions -- response body. */
export interface GuestSessionBootstrapResponse {
  sessionId: string;
  expiresAt: string;
}
