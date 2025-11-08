const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});


const customJestConfig = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  '^msw/node$': '<rootDir>/node_modules/msw/lib/node/index.js',
  '^msw$': '<rootDir>/node_modules/msw/lib/core/index.js',
  '^@mswjs/interceptors/ClientRequest$': '<rootDir>/node_modules/@mswjs/interceptors/lib/node/interceptors/ClientRequest/index.js',
  '^@mswjs/interceptors/Fetch$': '<rootDir>/node_modules/@mswjs/interceptors/lib/node/interceptors/fetch/index.js',
    '^until-async$': '<rootDir>/src/test/mocks/untilAsyncMock.js',
  },
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
  collectCoverageFrom: [
    'src/components/**/*.{ts,tsx}',
    '!src/**/*.stories.{ts,tsx}',
  ],
  transformIgnorePatterns: ['/node_modules/(?!(msw|@mswjs|until-async)/)'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/src/__tests__/profileService.test.ts$',
  ],
};

module.exports = createJestConfig(customJestConfig);
