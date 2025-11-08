# Project TODOs

## 🚀 Phase 1: Complete the Core MVP Features

- [x] Connect the user journey by implementing the dashboard redirect logic.
- [x] Complete the core profile feature with `ProfileView.tsx` and `EditProfileForm.tsx`.
- [x] Solidify session persistence using the refresh-on-401 interceptor in `useAuth.tsx`.
- [x] Align `profileService.ts` with the backend API contract (plural `/api/v1/profiles` and separate avatar upload).

## 🧪 Phase 2: Build Your Three Test Categories

- [ ] Component & unit tests: Storybook checks, MSW-based form tests, and Zod schema unit tests.
- [ ] Integration tests: Cover `api.ts` refresh interceptor, `authService.ts`, `profileService.ts`, and related hooks.
- [ ] End-to-end tests: Playwright coverage for login flows, golden path (register → profile create), and profile editing.

## ⚙️ Phase 3: Harden for Production (Robustness & DX)

- [ ] CI/CD: Automate Playwright tests in GitHub Actions and publish artifacts.
- [ ] Type safety: Generate frontend types from the backend OpenAPI schema.
- [ ] Test stability & QA: Add a rate-limit dev toggle to stabilize E2E tests.
- [ ] Monitoring & accessibility: Integrate Sentry and Axe checks in CI.
- [ ] Future features: Plan presigned image uploads and client-side image optimization.
