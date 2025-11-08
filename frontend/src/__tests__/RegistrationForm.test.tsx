import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RegistrationForm from '@/components/auth/RegistrationForm';
import { AuthProvider } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import AxiosMockAdapter from 'axios-mock-adapter';

const mock = new AxiosMockAdapter(api);

function setup() {
  render(
    <AuthProvider>
      <RegistrationForm />
    </AuthProvider>
  );
}

describe('RegistrationForm', () => {
  beforeEach(() => {
    mock.reset();
  });

  test('validates email and password and submits successfully', async () => {
    mock.onGet(/\/api\/v1\/users\/me$/).reply(200, { id: 'u_me', email: 'me@example.com' });
    mock.onPost(/\/api\/v1\/users$/).reply(201, { id: 'u_123', email: 'newuser@example.com' });
    setup();
  fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'newuser@example.com' } });
  fireEvent.change(screen.getByPlaceholderText('Optional'), { target: { value: 'New User' } });
  fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'Password123!' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      // Button should revert after submit
      expect(screen.getByRole('button', { name: /create account/i })).toBeEnabled();
    });
  });

  test('shows duplicate email error', async () => {
    mock.onGet(/\/api\/v1\/users\/me$/).reply(200, { id: 'u_me', email: 'me@example.com' });
    mock.onPost(/\/api\/v1\/users$/).reply(400, { errors: { email: ['Email already exists'] } });
    setup();
  fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'duplicate@example.com' } });
  fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'Password123!' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
    });
  });
});
