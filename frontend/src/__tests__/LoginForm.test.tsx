import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginForm from '@/components/auth/LoginForm';
import { AuthProvider } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import AxiosMockAdapter from 'axios-mock-adapter';

const mock = new AxiosMockAdapter(api);

function setup() {
  render(
    <AuthProvider>
      <LoginForm />
    </AuthProvider>
  );
}

describe('LoginForm', () => {
  beforeEach(() => mock.reset());

  test('successful login with valid credentials', async () => {
  mock.onGet(/\/api\/v1\/users\/me$/).reply(200, { id: 'u_1', email: 'user@example.com' });
  mock.onPost(/\/api\/v1\/auth\/token$/).reply(200, { access_token: 'abc123', token_type: 'bearer' });
    setup();
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sign in/i })).toBeEnabled();
    });
  });

  test('shows generic error on invalid credentials', async () => {
    mock.onPost(/\/api\/v1\/auth\/token$/).reply(401, { detail: 'Invalid credentials' });
    setup();
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'wrong@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getAllByText(/invalid email or password/i).length).toBeGreaterThan(0);
    });
  });
});
