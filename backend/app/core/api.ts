import axios, { AxiosHeaders, type AxiosRequestConfig } from "axios";

// Turbopack currently struggles with proxying API requests in development.
// Default to the direct backend URL exposed via NEXT_PUBLIC_API_URL and only
// fall back to relative paths if that variable is absent.
const envApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

function resolveBaseUrl(): string {
  if (envApiUrl) {
    return envApiUrl;
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
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
  baseURL: resolveBaseUrl(),
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
    // Ensure baseURL is set; fall back to direct backend URL when missing.
    if (!config.baseURL) {
      const resolved = api.defaults.baseURL || resolveBaseUrl();
      if (resolved) {
        config.baseURL = resolved;
      }
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
    // In dev, log the error unless it's a 401 or 404, which are expected
    if (process.env.NODE_ENV !== "production") {
      if (axios.isAxiosError(error) && error.response?.status !== 401 && error.response?.status !== 404) {
        console.error("[apiRequest] error:", config.url, error);
      } else if (!axios.isAxiosError(error)) {
        console.error("[apiRequest] non-axios error:", config.url, error);
      }
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
          baseURL: api.defaults.baseURL || resolveBaseUrl(),
          withCredentials: true,
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
