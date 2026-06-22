// Ranker tests run in plain node via ts-jest (no RN/Expo needed).
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/shared/**/*.test.ts'],
  moduleNameMapper: {
    '^@shared/(.*)$': '<rootDir>/shared/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
