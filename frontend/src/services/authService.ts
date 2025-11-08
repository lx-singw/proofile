import { api, apiRequest, setAccessToken, clearAccessToken } from "../lib/api";

export type CurrentUser = {
  id: number;
  email: string;
  full_name?: string | null;
  username?: string | null;
  role?: string | null;
  [key: string]: unknown;
};

export type RegisterPayload = {
  email: string;
  password: string;
  full_name?: string;
};

export type LoginPayload = {
  username: string;
  password: string;
};

const USERS_ME_PATHS = [
  "/api/v1/users/me",
  "/api/v1/profiles/me",
  "/api/v1/auth/me",
];

export async function register(data: RegisterPayload) {
  // Backend expects JSON for user creation
  return apiRequest({ method: "post", url: "/api/v1/users", data });
}

type TokenResponse = {
  access_token?: string;
  accessToken?: string;
  [key: string]: unknown;
};

export async function login(payload: LoginPayload): Promise<TokenResponse> {
  // The backend token endpoint commonly expects form-encoded data
  const body = new URLSearchParams();
  body.append("username", payload.username);
  body.append("password", payload.password);

  // We still use axios instance because it has withCredentials=true
  const response = await api.request<TokenResponse>({
    method: "post",
    url: "/api/v1/auth/token",
    data: body.toString(),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  const data = response.data ?? {};
  const token = data.access_token ?? data.accessToken;
  if (typeof token === "string" && token) setAccessToken(token);
  return data;
}

export async function logout() {
  // If backend exposes a logout endpoint, call it; otherwise clear client state
  try {
    const resp = await apiRequest({ method: "post", url: "/api/v1/auth/logout" });
    clearAccessToken();
    return resp;
  } catch {
    // swallow errors; logout should be best-effort
    clearAccessToken();
    return null;
  }
}

export async function refresh() {
  // Call refresh endpoint to rotate session / tokens. The API client already
  // includes credentials so cookies will be sent.
  const data = await apiRequest<TokenResponse>({ method: "post", url: "/api/v1/auth/refresh" });
  const token = data.access_token ?? data.accessToken;
  if (typeof token === "string" && token) setAccessToken(token);
  return data;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  // Try a few likely endpoints to fetch a current user/session.
  for (const path of USERS_ME_PATHS) {
    try {
      const data = await apiRequest<CurrentUser>({ method: "get", url: path });
      return data;
    } catch {
      // try next
    }
  }
  return null;
}

const authService = { register, login, logout, getCurrentUser, refresh };

export default authService;
