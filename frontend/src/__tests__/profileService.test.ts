import MockAdapter from "axios-mock-adapter";
import { api } from "../lib/api";
import profileService from "../services/profileService";

describe("profileService", () => {
  const mock = new MockAdapter(api);
  afterEach(() => mock.reset());

  test("getProfile returns data", async () => {
    mock
      .onGet("/api/v1/profiles/me")
      .reply(200, { id: 1, headline: "Designer", summary: "UX generalist" });

    const profile = await profileService.getProfile();

    expect(profile?.id).toBe(1);
    expect(profile?.headline).toBe("Designer");
    expect(profile?.summary).toBe("UX generalist");
  });

  test("getProfile returns null on 404", async () => {
    mock.onGet("/api/v1/profiles/me").reply(404, { detail: "Not Found" });
    const profile = await profileService.getProfile();
    expect(profile).toBeNull();
  });

  test("createProfile posts JSON when no avatar", async () => {
  mock.onPost("/api/v1/profiles/").reply((config) => {
      const rawData = config.data;
      if (typeof rawData === "string") {
        try {
          const body = JSON.parse(rawData) as { headline?: string; summary?: string };
          if (body.headline === "Designer") {
            return [200, { id: 2, headline: body.headline, summary: body.summary }];
          }
        } catch {
          // ignore parse errors and fall through to failure response
        }
      }
      return [400, { detail: "Bad Request" }];
    });

    const profile = await profileService.createProfile({ headline: "Designer", summary: "UX generalist" });
    expect(profile.id).toBe(2);
  });
});
