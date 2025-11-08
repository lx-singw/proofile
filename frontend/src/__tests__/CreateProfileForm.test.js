import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateProfileForm from '../components/profile/CreateProfileForm';
import MockAdapter from 'axios-mock-adapter';
import { api } from '../lib/api';
import { AuthProvider } from '@/hooks/useAuth';
import { Toaster } from 'sonner';

const replaceMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

describe('CreateProfileForm', () => {
  const mock = new MockAdapter(api);
  beforeEach(() => {
    mock.reset();
    mock.onGet(/\/api\/v1\/users\/me$/).reply(200, { id: 'u_me', email: 'me@example.com' });
    replaceMock.mockReset();
  });
  afterEach(() => {
    mock.reset();
  });

  test('shows validation errors', async () => {
    render(
      <AuthProvider>
        <CreateProfileForm />
        <Toaster />
      </AuthProvider>
    );
    fireEvent.click(screen.getByTestId('submit-profile'));
    expect(await screen.findByText('Headline must be at least 2 chars')).toBeInTheDocument();
    expect(screen.getByText('Summary must be at least 2 chars')).toBeInTheDocument();
  });

  test('submits and shows success', async () => {
      mock.onPost('/api/v1/profiles').reply(200, { id: 1, headline: 'Jane Doe', summary: 'Bio' });
    render(
      <AuthProvider>
        <CreateProfileForm />
        <Toaster />
      </AuthProvider>
    );
      fireEvent.change(screen.getByTestId('headline'), { target: { value: 'Jane Doe' } });
      fireEvent.change(screen.getByTestId('summary'), { target: { value: 'Bio' } });
    fireEvent.click(screen.getByTestId('submit-profile'));
    await waitFor(() => {
      expect(screen.getByTestId('profile-success')).toHaveTextContent('Profile created for Jane Doe');
      expect(replaceMock).toHaveBeenCalledWith('/profile');
    });
  });

  test('shows API error on submission failure', async () => {
    mock.onPost('/api/v1/profiles').reply(500, { detail: 'Server is on fire' });
    render(
      <AuthProvider>
        <CreateProfileForm />
        <Toaster />
      </AuthProvider>
    );
    fireEvent.change(screen.getByTestId('headline'), { target: { value: 'Error User' } });
    fireEvent.change(screen.getByTestId('summary'), { target: { value: 'Oops' } });
    fireEvent.click(screen.getByTestId('submit-profile'));
    expect(await screen.findByText('Server is on fire')).toBeInTheDocument();
  });
});
