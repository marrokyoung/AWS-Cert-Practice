import type {
  ApiError,
  ConfigResponse,
  GuestSessionBootstrapRequest,
  GuestSessionBootstrapResponse,
  HealthResponse,
  VersionResponse,
} from "@/contracts/api";

/** Client-side error surfaced when an API call fails. */
export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly apiError: ApiError | null,
  ) {
    super(apiError?.message ?? `API request failed with status ${status}`);
    this.name = "ApiClientError";
  }
}

function getBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!raw) {
    throw new ApiClientError(0, {
      code: "CONFIG_ERROR",
      message: "NEXT_PUBLIC_API_BASE_URL is not set. See .env.example for details.",
    });
  }
  // Strip trailing slash so callers don't need to worry about it.
  return raw.replace(/\/+$/, "");
}

async function jsonFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const url = `${getBaseUrl()}${path}`;

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      credentials: "omit",
    });
  } catch (err) {
    // Network-level failures (DNS, offline, CORS) surface as status 0.
    const message =
      err instanceof Error ? err.message : "Network request failed";
    throw new ApiClientError(0, { code: "NETWORK_ERROR", message });
  }

  if (!res.ok) {
    let apiError: ApiError | null = null;
    try {
      apiError = (await res.json()) as ApiError;
    } catch {
      // Response body isn't valid JSON — leave apiError null.
    }
    throw new ApiClientError(res.status, apiError);
  }

  return (await res.json()) as T;
}

/** GET /health */
export function getHealth(): Promise<HealthResponse> {
  return jsonFetch<HealthResponse>("/health");
}

/** GET /version */
export function getVersion(): Promise<VersionResponse> {
  return jsonFetch<VersionResponse>("/version");
}

/** GET /config */
export function getConfig(): Promise<ConfigResponse> {
  return jsonFetch<ConfigResponse>("/config");
}

/** POST /guest-sessions */
export function createGuestSession(
  request: GuestSessionBootstrapRequest,
): Promise<GuestSessionBootstrapResponse> {
  return jsonFetch<GuestSessionBootstrapResponse>("/guest-sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
}
