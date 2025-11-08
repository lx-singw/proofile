import { http, HttpResponse } from "msw";

type RegistrationBody = {
  email?: string | null;
};

export const handlers = [
  // Registration success
  http.post('*/api/v1/users', async ({ request }) => {
    const rawBody = (await request.json().catch(() => ({}))) as RegistrationBody;
    const email = typeof rawBody.email === "string" ? rawBody.email : undefined;
    if (!email) {
      return HttpResponse.json({ detail: "Email required" }, { status: 422 });
    }
    if (email === "duplicate@example.com") {
      return HttpResponse.json(
        {
          errors: { email: ["Email already exists"] },
          detail: "Validation error",
        },
        { status: 400 }
      );
    }
    return HttpResponse.json({ id: "u_123", email }, { status: 201 });
  }),
  // Login success / failure
  http.post('*/api/v1/auth/token', async ({ request }) => {
    const text = await request.text();
    const params = new URLSearchParams(text);
    const username = params.get("username");
    const password = params.get("password");
    if (username === "user@example.com" && password === "password123") {
      return HttpResponse.json({ access_token: "test-access-token", token_type: "bearer" }, { status: 200 });
    }
    return HttpResponse.json({ detail: "Invalid credentials" }, { status: 401 });
  }),
  // Current user endpoint after login
  http.get('*/api/v1/users/me', () => {
    return HttpResponse.json({ id: "u_123", email: "user@example.com" });
  }),
  http.get('*/api/v1/profiles/me', () => {
    return HttpResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }),
  http.get('*/api/v1/auth/me', () => {
    return HttpResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }),
  http.post('*/api/v1/auth/refresh', async () => {
    return HttpResponse.json({ access_token: "test-refresh-token" }, { status: 200 });
  }),
];
