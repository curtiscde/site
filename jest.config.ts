import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const config: Config = {
  collectCoverageFrom: [
    "**/*.{js,jsx,ts,tsx}",
    "!**/node_modules/**",
    "!**/.claude/**",
    "!**/.next/**",
    "!**/coverage/**",
    "!**/public/**",
    "!**/types/**",
    "!**/out/**",
    "!**.config.{js,ts}",
    "!next-env.d.ts"
  ],
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  // Sibling git worktrees under .claude/ contain their own copies of these test files.
  // Without this, a local `npm test` runs every branch's tests at once.
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/.claude/'],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config)
