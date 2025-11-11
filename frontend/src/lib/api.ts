import axios, { AxiosHeaders, type AxiosRequestConfig } from "axios";

// Prefer relative '/api' which is proxied to the backend via next.config rewrites in dev/E2E.
// This ensures cookies/CSRF tokens stay on the frontend origin and work through the proxy.
// Only use NEXT_PUBLIC_API_URL in production when it's a different domain.
const rawEnvUrl = process.env.NEXT_PUBLIC_API_URL;

// Compute the API URL dynamically to ensure it uses the correct value on the client
function getApiUrl(): string {
  // Only check window on client side
  if (typeof window === "undefined") {
    return "";  // Default to relative '/api' proxy for SSR
  }

  if (rawEnvUrl) {
    try {
      // Check if the provided URL points to a different hostname than current
      const envHost = new URL(rawEnvUrl).hostname;
      const currentHost = window.location.hostname;
      // Only use absolute URL if it's a different domain
      if (envHost !== currentHost && envHost !== "localhost" && envHost !== "127.0.0.1") {
        console.log("[api] Using absolute URL:", rawEnvUrl);
        return rawEnvUrl;
      }
    } catch (e) {
      // ignore URL parse errors; keep relative path default
      console.log("[api] Could not parse NEXT_PUBLIC_API_URL, using proxy /api");
    }
  }

  console.log("[api] Using relative proxy /api");
  return "";
}

const ACCESS_TOKEN_STORAGE_KEY = "auth:accessToken";

const readStoredToken = () => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
};

const persistToken = (token: string | null) => {
  if (typeof window === "undefined") return;
  try {
    if (token) {
      window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
    } else {
      window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    }
  } catch {
    // ignore storage quota / browser privacy errors
  }
};

// Create axios instances - baseURL will be set dynamically on first client request
// Don't set baseURL here to avoid SSR issues
export const api = axios.create({
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
});

// A lightweight axios instance used to call refresh endpoints without triggering
// the interceptors attached to `api` (avoids circular refresh attempts).
const refreshClient = axios.create({
  withCredentials: true,
  // We will manually handle XSRF headers for this client
  // xsrfCookieName: "XSRF-TOKEN",
  // xsrfHeaderName: "X-XSRF-TOKEN",
});

// --------------------
// In-memory access token handling
// --------------------
let accessToken: string | null = null;

if (typeof window !== "undefined") {
  const restoredToken = readStoredToken();
  if (restoredToken) {
    accessToken = restoredToken;
  }
}

export function hydrateAccessTokenFromStorage() {
  const stored = readStoredToken();
  if (stored) {
    accessToken = stored;
  }
  return stored;
}

export function setAccessToken(token: string | null) {
  accessToken = token || null;
  persistToken(accessToken);
}

export function getAccessToken() {
  return accessToken;
}

export function clearAccessToken() {
  accessToken = null;
  persistToken(null);
}

// --------------------
// Request interceptor to set baseURL dynamically and attach Authorization header
// --------------------
api.interceptors.request.use((config) => {
  try {
    // Set baseURL dynamically on each request to ensure it's correct on client side
    if (typeof window !== "undefined" && !config.baseURL) {
      config.baseURL = getApiUrl();
    }

    const url = (config.url ?? "").toString();
    const isAuthPath =
      url.includes("/api/v1/auth/refresh") || url.includes("/api/v1/auth/token");

    // Only attach Authorization for non-auth paths and when we have a token
    if (!isAuthPath && accessToken) {
      const headers =
        config.headers instanceof AxiosHeaders
          ? config.headers
          : new AxiosHeaders(config.headers ?? {});
      if (typeof headers.get("Authorization") !== "string") {
        headers.set("Authorization", `Bearer ${accessToken}`);
      }
      config.headers = headers;
    }
  } catch {
    // noop
  }
  return config;
});

// Basic wrapper to return response data and normalize errors
export async function apiRequest<T = unknown>(config: AxiosRequestConfig): Promise<T> {
  try {
    if (process.env.NODE_ENV !== "production") {
      console.log("[apiRequest]", config.method?.toUpperCase(), config.url, { baseURL: api.defaults.baseURL });
    }
    const resp = await api.request<T>(config);
    return resp.data;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[apiRequest] error:", config.url, error);
    }
    // Normalize Axios errors to throw helpful objects
    if (axios.isAxiosError(error) && error.response?.data !== undefined) {
      throw error.response.data;
    }
    throw error;
  }
}

// --------------------
// Refresh-on-401 logic
// --------------------
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (err: unknown) => void;
  config: AxiosRequestConfig;
}> = [];

function processQueue(error: unknown | null) {
  failedQueue.forEach(({ resolve, reject, config }) => {
    if (error) reject(error);
    else resolve(api.request(config));
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config as AxiosRequestConfig & { _retry?: boolean };

    // If there's no response or it's not a 401, reject immediately
    if (!error?.response || error.response.status !== 401) {
      return Promise.reject(error);
    }

    // If we do not currently hold an access token, there's nothing to refresh.
    // This covers bootstrapping flows (unauthenticated users hitting protected
    // endpoints) and avoids spamming the refresh endpoint without the required
    // CSRF cookie/header handshake. In those situations, simply bubble up the
    // 401 so callers can handle it explicitly.
    if (!getAccessToken()) {
      return Promise.reject(error);
    }

    // Avoid retrying the refresh call itself
    if (originalRequest?._retry) {
      return Promise.reject(error);
    }

    // Queue requests while we perform a single refresh
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject, config: originalRequest });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Manually read XSRF token from cookies and set header for the refresh call.
      // This is necessary because we are using a separate axios instance that
      // might not automatically handle the XSRF token lifecycle correctly on its own.
      const getCookie = (name: string): string | null => {
        if (typeof document === "undefined") return null;
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
        return null;
      };
      const xsrfToken = getCookie("XSRF-TOKEN");

      // Call refresh endpoint directly with a client that doesn't have this
      // interceptor attached to avoid recursion.
      type RefreshResponse = {
        access_token?: string;
        accessToken?: string;
        [key: string]: unknown;
      };

      const resp = await refreshClient.post<RefreshResponse>(
        "/api/v1/auth/refresh",
        {}, // No data in body
        {
          headers: {
            ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
          },
        }
      );
      // Update in-memory token if backend returns a fresh access token in JSON
      const newToken = resp.data?.access_token ?? resp.data?.accessToken;
      if (typeof newToken === "string" && newToken) setAccessToken(newToken);
      isRefreshing = false;
      processQueue(null);
      // Retry the original request
      return api.request(originalRequest);
    } catch (refreshError) {
      isRefreshing = false;
      processQueue(refreshError);
      // If refresh fails, try to redirect to login in browser environments
      try {
        // Only force navigation if we previously had an access token (i.e. user was authenticated)
        const hadToken = !!getAccessToken();
        clearAccessToken();
        if (hadToken && typeof window !== "undefined") {
          window.location.href = "/login";
        }
      } catch {
        // ignore
      }
      return Promise.reject(refreshError);
    }
  }
);

export default api;
