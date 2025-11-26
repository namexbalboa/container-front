import { defineConfig } from "@playwright/test";

/**
 * Restrict Playwright to the E2E specs so Jest unit tests that live in `src/**.test.*`
 * are not picked up when we run `playwright test`.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: [
    "**/*.spec.ts",
    "**/*.spec.tsx",
    "**/*.spec.js",
    "**/*.spec.mjs",
    "**/*.spec.cjs",
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
});

