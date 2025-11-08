import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateProfileForm from '../components/profile/CreateProfileForm';
import { AuthProvider } from '@/hooks/useAuth';
import { api } from '../lib/api';
import MockAdapter from 'axios-mock-adapter';
import { Toaster } from 'sonner';

const replaceMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

const mock = new MockAdapter(api);

function setup(onSuccess = () => {}) {
  // Mock URL.createObjectURL
  global.URL.createObjectURL = jest.fn(() => 'blob:http://localhost/mock-url');
  render(
    <AuthProvider>
      <CreateProfileForm onSuccess={onSuccess} />
      <Toaster />
    </AuthProvider>
  );
}

describe('CreateProfileForm', () => {
  beforeEach(() => {
    mock.reset();
    replaceMock.mockReset();
    // Mock a successful 'me' query for AuthProvider
    mock.onGet(/\/api\/v1\/users\/me$/).reply(200, { id: 'u_me', email: 'me@example.com' });
  });

  test('shows validation errors', async () => {
    setup();
    fireEvent.click(screen.getByTestId('submit-profile'));
    expect(await screen.findByText('Headline must be at least 2 chars')).toBeInTheDocument();
    expect(screen.getByText('Summary must be at least 2 chars')).toBeInTheDocument();
  });

  test('submits and shows success with redirect', async () => {
  mock.onPost('/api/v1/profiles').reply(200, { id: 1, headline: 'Jane Doe', summary: 'A short bio.' });
    const handleSuccess = jest.fn();
    setup(handleSuccess);

  fireEvent.change(screen.getByTestId('headline'), { target: { value: 'Jane Doe' } });
  fireEvent.change(screen.getByTestId('summary'), { target: { value: 'A short bio.' } });

    const file = new File(['(⌐□_□)'], 'avatar.png', { type: 'image/png' });
    const avatarInput = screen.getByLabelText('Avatar');
    fireEvent.change(avatarInput, { target: { files: [file] } });

    fireEvent.click(screen.getByTestId('submit-profile'));

    await waitFor(() => {
    expect(screen.getByTestId('profile-success')).toHaveTextContent('Profile created for Jane Doe');
    expect(handleSuccess).toHaveBeenCalledWith(expect.objectContaining({ id: 1, headline: 'Jane Doe' }));
      expect(replaceMock).toHaveBeenCalledWith('/profile');
    });
  });

  test('shows API error on submission failure', async () => {
    mock.onPost('/api/v1/profiles').reply(500, { detail: 'Server is on fire' });
    setup();
    fireEvent.change(screen.getByTestId('headline'), { target: { value: 'Error User' } });
    fireEvent.change(screen.getByTestId('summary'), { target: { value: 'Oops' } });
    fireEvent.click(screen.getByTestId('submit-profile'));
    expect(await screen.findByText('Server is on fire')).toBeInTheDocument();
  });
});
