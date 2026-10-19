// API client for GovPreneurs backend
// Uses VITE_API_BASE_URL from .env (copied from .env.example)

// DEMO: every backend call goes to this fixed prefix. src/demo/runtime/fetchInterceptor.ts
// answers it in the browser, so no request ever leaves the page.
const API_BASE_URL = '/__demo_api';

const GHL_TOKEN_KEY = 'ghl_token';
const MOCK_LOCATION_ID_KEY = 'mock_location_id';

export const setGhlToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem(GHL_TOKEN_KEY, token);
  }
};

export const getGhlToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return window.sessionStorage.getItem(GHL_TOKEN_KEY);
  }
  return null;
};

/**
 * Dev/staging-only override: which locationId the backend's mock auth should
 * resolve req.user as. Persisted in sessionStorage so it survives SPA route
 * changes after being set once via ?locationId= on any page.
 */
export const setMockLocationId = (locationId: string): void => {
  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem(MOCK_LOCATION_ID_KEY, locationId);
  }
};

export const getMockLocationId = (): string | null => {
  if (typeof window !== 'undefined') {
    return window.sessionStorage.getItem(MOCK_LOCATION_ID_KEY);
  }
  return null;
};

const withMockLocationId = (url: string): string => {
  const mockLocationId = getMockLocationId();
  if (!mockLocationId) return url;
  const parsed = new URL(url, window.location.origin);
  parsed.searchParams.set('locationId', mockLocationId);
  return parsed.toString();
};

/**
 * fetch wrapper that automatically attaches X-GHL-Token from sessionStorage.
 * Falls through to plain fetch if no token is stored yet.
 */
export const apiFetch = (
  url: string,
  options: RequestInit = {},
): Promise<Response> => {
  const finalUrl = withMockLocationId(url);
  const token = getGhlToken();
  if (!token) return fetch(finalUrl, options);
  const headers = new Headers(options.headers);
  headers.set('X-GHL-Token', token);
  return fetch(finalUrl, { ...options, headers });
};

/**
 * Error thrown by `buildApiError`, carrying the response's HTTP status so
 * callers can branch on it (e.g. showing bespoke 403 copy) without
 * re-parsing the response themselves.
 */
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export const buildApiError = async (
  response: Response,
  defaultMessage: string,
): Promise<never> => {
  let message = defaultMessage;
  try {
    const body = await response.json();
    if (body?.message) message = body.message;
    if (body?.error?.message) message = body.error.message;
  } catch {
    /* ignore parse error */
  }
  throw new ApiError(message, response.status);
};

export { API_BASE_URL };
