
import axios, { AxiosError, AxiosRequestConfig } from "axios";

// In development we proxy relative /api requests through Next.js rewrites.
// In production a full URL could be provided via environment variables.
const API_BASE_URL = "";

const ACCESS_TOKEN_STORAGE_KEY = "auth:accessToken";

const readStoredToken = () => {
	if (typeof window === "undefined") return null;
	try {
		return localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
	} catch {
		return null;
	}
};

const persistToken = (token: string | null) => {
	if (typeof window === "undefined") return;
	try {
		if (token === null) localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
		else localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
	} catch {
		// noop
	}
};

export const api = axios.create({
	baseURL: API_BASE_URL,
	withCredentials: true,
	headers: {
		"Content-Type": "application/json",
	},
	xsrfCookieName: "XSRF-TOKEN",
	xsrfHeaderName: "X-XSRF-TOKEN",
});

// Lightweight client used for refresh calls to avoid interceptor loops
const refreshClient = axios.create({ withCredentials: true });

// --------------------
// In-memory access token handling
// --------------------
let accessToken: string | null = null;

export function hydrateAccessTokenFromStorage(): string | null {
	const stored = readStoredToken();
	if (stored) accessToken = stored;
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
// Request interceptor: attach Authorization header when appropriate
// --------------------
api.interceptors.request.use((config) => {
	try {
		const url = (config.url ?? "").toString();
		const isAuthPath = url.includes("/api/v1/auth/refresh") || url.includes("/api/v1/auth/token");
		if (!isAuthPath && accessToken) {
			const headers = (config.headers as any) ?? {};
			if (typeof headers.Authorization !== "string" && typeof headers.Authorization !== "string") {
				headers.Authorization = `Bearer ${accessToken}`;
			}
			config.headers = headers;
		}
	} catch {
		// noop
	}
	return config;
});

export async function apiRequest<T = any>(config: AxiosRequestConfig) {
	try {
		// helpful dev logging
		if (process.env.NODE_ENV !== "production") {
			// eslint-disable-next-line no-console
			console.log("[apiRequest]", (config.method ?? "GET").toString().toUpperCase(), config.url, {
				baseURL: config.baseURL || api.defaults.baseURL,
			});
		}
		const resp = await api.request(config);
		return resp.data as T;
	} catch (error: unknown) {
		if (process.env.NODE_ENV !== "production") {
			// eslint-disable-next-line no-console
			if (axios.isAxiosError(error) && error.response?.status !== 401 && error.response?.status !== 404) {
				console.error("[apiRequest] error:", config.url, error);
			} else if (!axios.isAxiosError(error)) {
				console.error("[apiRequest] non-axios error:", config.url, error);
			}
		}
		if (axios.isAxiosError(error) && (error as AxiosError).response?.data !== undefined) {
			throw (error as AxiosError).response!.data;
		}
		throw error;
	}
}

// --------------------
// Refresh-on-401 logic
// --------------------
let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: any) => void; reject: (e: any) => void; config: AxiosRequestConfig }> = [];

function processQueue(error: any | null) {
	failedQueue.forEach(({ resolve, reject, config }) => {
		if (error) reject(error);
		else resolve(api.request(config));
	});
	failedQueue = [];
}

api.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = (error as AxiosError)?.config as AxiosRequestConfig | undefined;
		if (!error || !(error as any).response || (error as any).response.status !== 401) {
			return Promise.reject(error);
		}
		if (!getAccessToken()) {
			return Promise.reject(error);
		}
		if (originalRequest && (originalRequest as any)._retry) {
			return Promise.reject(error);
		}
		if (isRefreshing) {
			return new Promise((resolve, reject) => {
				failedQueue.push({ resolve, reject, config: originalRequest! });
			});
		}
		if (originalRequest) (originalRequest as any)._retry = true;
		isRefreshing = true;
		try {
			const getCookie = (name: string) => {
				if (typeof document === "undefined") return null;
				const value = `; ${document.cookie}`;
				const parts = value.split(`; ${name}=`);
				if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
				return null;
			};
			const xsrfToken = getCookie("XSRF-TOKEN");
			const resp = await refreshClient.post(
				"/api/v1/auth/refresh",
				{},
				{
					baseURL: API_BASE_URL,
					withCredentials: true,
					headers: {
						...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
					},
				}
			);
			const newToken = resp.data?.access_token ?? resp.data?.accessToken;
			if (typeof newToken === "string" && newToken) setAccessToken(newToken);
			isRefreshing = false;
			processQueue(null);
			return api.request(originalRequest!);
		} catch (refreshError) {
			isRefreshing = false;
			processQueue(refreshError);
			try {
				const hadToken = !!getAccessToken();
				clearAccessToken();
				if (hadToken && typeof window !== "undefined") {
					// optionally navigate to login in browser environments
					// window.location.href = '/login';
				}
			} catch {
				// ignore
			}
			return Promise.reject(refreshError);
		}
	}
);

export default api;
