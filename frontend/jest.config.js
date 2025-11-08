const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});


const customJestConfig = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
  collectCoverageFrom: [
    'src/components/**/*.{ts,tsx}',
    '!src/**/*.stories.{ts,tsx}',
  ],
  transformIgnorePatterns: ['/node_modules/'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/src/__tests__/profileService.test.ts$',
  ],
};

module.exports = createJestConfig(customJestConfig);
