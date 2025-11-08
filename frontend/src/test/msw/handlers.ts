import { http, HttpResponse } from 'msw';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export const handlers = [
  // Registration success
  http.post(`${API_URL}/api/v1/users`, async ({ request }) => {
    const body = await request.json().catch(() => ({}));
    if (!body.email) {
      return HttpResponse.json({ detail: 'Email required' }, { status: 422 });
    }
    if (body.email === 'duplicate@example.com') {
      return HttpResponse.json({
        errors: { email: ['Email already exists'] },
        detail: 'Validation error'
      }, { status: 400 });
    }
    return HttpResponse.json({ id: 'u_123', email: body.email }, { status: 201 });
  }),
  // Login success / failure
  http.post(`${API_URL}/api/v1/auth/token`, async ({ request }) => {
    const text = await request.text();
    const params = new URLSearchParams(text);
    const username = params.get('username');
    const password = params.get('password');
    if (username === 'user@example.com' && password === 'password123') {
      return HttpResponse.json({ access_token: 'test-access-token', token_type: 'bearer' }, { status: 200 });
    }
    return HttpResponse.json({ detail: 'Invalid credentials' }, { status: 401 });
  }),
  // Current user endpoint after login
  http.get(`${API_URL}/api/v1/users/me`, () => {
    return HttpResponse.json({ id: 'u_123', email: 'user@example.com' });
  }),
];
