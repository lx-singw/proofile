import MockAdapter from 'axios-mock-adapter';
import { api } from '../lib/api';
import profileService from '../services/profileService';

describe('profileService', () => {
  const mock = new MockAdapter(api);
  afterEach(() => mock.reset());

  test('getProfile returns data', async () => {
  mock.onGet('/api/v1/profiles/me').reply(200, { id: 1, headline: 'Designer', summary: 'UX generalist' });
    const p = await profileService.getProfile();
  expect(p?.id).toBe(1);
  expect(p?.headline).toBe('Designer');
  expect(p?.summary).toBe('UX generalist');
  });

  test('getProfile returns null on 404', async () => {
    mock.onGet('/api/v1/profiles/me').reply(404, { detail: 'Not Found' });
    const p = await profileService.getProfile();
    expect(p).toBeNull();
  });

  test('createProfile posts JSON when no avatar', async () => {
    mock.onPost('/api/v1/profiles').reply((config) => {
      try {
        const body = JSON.parse(config.data);
        if (body.headline === 'Designer') {
          return [200, { id: 2, headline: body.headline, summary: body.summary }];
        }
      } catch {/* ignore */}
      return [400, { detail: 'Bad Request' }];
    });
    const p = await profileService.createProfile({ headline: 'Designer', summary: 'UX generalist', avatar: null });
    expect(p.id).toBe(2);
  });
});
