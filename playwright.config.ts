import { defineConfig, devices } from "@playwright/test";

/**
 * Lightweight Playwright config for visual regression of brand assets
 * (header + footer logo). Run against a locally running dev server:
 *   bun run dev
 *   bunx playwright test
 *
 * First run (baseline):
 *   bunx playwright test --update-snapshots
 */
export default defineConfig({
  testDir: "./tests/visual",
  fullyParallel: false,
  reporter: [["list"]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:8080",
    viewport: { width: 1280, height: 900 },
    colorScheme: "dark",
    // Deterministic rendering for pixel-diff stability.
    launchOptions: { args: ["--font-render-hinting=none"] },
  },
  expect: {
    // Tolerate tiny sub-pixel/antialias differences across environments.
    toHaveScreenshot: { maxDiffPixelRatio: 0.02, animations: "disabled" },
  },
  projects: [
    { name: "chromium-desktop", use: { ...devices["Desktop Chrome"] } },
  ],
});
