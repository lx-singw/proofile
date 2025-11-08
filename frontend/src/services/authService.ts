import { api, apiRequest, setAccessToken, clearAccessToken } from "../lib/api";

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

export async function login(payload: LoginPayload) {
  // The backend token endpoint commonly expects form-encoded data
  const body = new URLSearchParams();
  body.append("username", payload.username);
  body.append("password", payload.password);

  // We still use axios instance because it has withCredentials=true
  return api.request({
    method: "post",
    url: "/api/v1/auth/token",
    data: body.toString(),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  }).then((r) => {
    const data = r.data || {};
    // Capture access token if backend returns it in JSON
    const token = data.access_token || data.accessToken;
    if (token) setAccessToken(token);
    return data;
  });
}

export async function logout() {
  // If backend exposes a logout endpoint, call it; otherwise clear client state
  try {
    const resp = await apiRequest({ method: "post", url: "/api/v1/auth/logout" });
    clearAccessToken();
    return resp;
  } catch (err) {
    // swallow errors; logout should be best-effort
    clearAccessToken();
    return null;
  }
}

export async function refresh() {
  // Call refresh endpoint to rotate session / tokens. The API client already
  // includes credentials so cookies will be sent.
  try {
    const data = await apiRequest({ method: "post", url: "/api/v1/auth/refresh" });
    const token = (data as any)?.access_token || (data as any)?.accessToken;
    if (token) setAccessToken(token);
    return data;
  } catch (err) {
    throw err;
  }
}

export async function getCurrentUser() {
  // Try a few likely endpoints to fetch a current user/session.
  for (const p of USERS_ME_PATHS) {
    try {
      const data = await apiRequest({ method: "get", url: p });
      return data;
    } catch (e) {
      // try next
    }
  }
  return null;
}

export default { register, login, logout, getCurrentUser };
