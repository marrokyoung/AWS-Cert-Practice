import type {
  ApiError,
  ConfigResponse,
  GuestSessionBootstrapRequest,
  GuestSessionBootstrapResponse,
  HealthResponse,
  VersionResponse,
} from "@/contracts/api";

const DEFAULT_REQUEST_TIMEOUT_MS = 10_000;

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

/** Read and normalize the configured API base URL for browser requests. */
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

/** Resolve the request timeout, allowing tests/deployments to override it. */
function getRequestTimeoutMs(): number {
  const raw = process.env.NEXT_PUBLIC_API_TIMEOUT_MS;
  if (!raw) return DEFAULT_REQUEST_TIMEOUT_MS;

  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_REQUEST_TIMEOUT_MS;
}

/** Convert unknown thrown values to a stable error message. */
function getErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

/** Detect fetch abort failures across browser and test runtimes. */
function isAbortError(err: unknown): boolean {
  return err instanceof Error && err.name === "AbortError";
}

/** Perform a JSON API request and normalize failures into ApiClientError. */
async function jsonFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  // Ensure path starts with "/" so the URL is well-formed.
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${getBaseUrl()}${normalizedPath}`;

  let res: Response;
  const timeoutMs = getRequestTimeoutMs();
  const controller = new AbortController();
  let didTimeout = false;
  const timeoutId = setTimeout(() => {
    didTimeout = true;
    controller.abort();
  }, timeoutMs);

  const signal = options?.signal
    ? AbortSignal.any([controller.signal, options.signal])
    : controller.signal;

  try {
    res = await fetch(url, {
      ...options,
      credentials: "omit",
      signal,
    });
  } catch (err) {
    const message = getErrorMessage(err, "Network request failed");

    if (didTimeout || isAbortError(err)) {
      throw new ApiClientError(0, {
        code: didTimeout ? "TIMEOUT" : "REQUEST_ABORTED",
        message: didTimeout
          ? `API request timed out after ${timeoutMs}ms`
          : message,
        details: { cause: message },
      });
    }

    // Network-level failures (DNS, offline, CORS) surface as status 0.
    throw new ApiClientError(0, { code: "NETWORK_ERROR", message });
  } finally {
    clearTimeout(timeoutId);
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

  try {
    return (await res.json()) as T;
  } catch (err) {
    const message = getErrorMessage(err, "Response body is not valid JSON");
    throw new ApiClientError(res.status, {
      code: "INVALID_JSON",
      message: "API response body was not valid JSON",
      details: { cause: message },
    });
  }
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
