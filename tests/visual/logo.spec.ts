import { test, expect } from "@playwright/test";

/**
 * Visual regression: brand logo in header + footer on a dark background.
 *
 * Guards against:
 *  - Accidental logo swaps / cache-busting URL breakage
 *  - Header/footer layout shifts around the logo (height, spacing)
 *  - CSS regressions that would render the logo invisible on dark bg
 *
 * Snapshots live under tests/visual/__screenshots__/. Regenerate with:
 *   bunx playwright test --update-snapshots
 */
test.describe("brand logo visual regression", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    // Force the header into its scrolled ("glass-strong") state so the
    // snapshot is deterministic regardless of initial scroll position.
    await page.evaluate(() => window.scrollTo(0, 400));
    // Give the header transition (500ms) time to settle.
    await page.waitForTimeout(600);
  });

  test("header logo renders on dark bg", async ({ page }) => {
    const logo = page.locator('header img[alt="MVA Imobiliare"]').first();
    await expect(logo).toBeVisible();

    // Sanity: logo file resolves (not a 404 broken image).
    const naturalWidth = await logo.evaluate(
      (el) => (el as HTMLImageElement).naturalWidth,
    );
    expect(naturalWidth).toBeGreaterThan(0);

    await expect(logo).toHaveScreenshot("header-logo.png");
  });

  test("footer brand block renders on dark bg", async ({ page }) => {
    // Scroll footer into view and wait for lazy content (Google reviews, etc.).
    await page.evaluate(() =>
      document.querySelector("footer")?.scrollIntoView({ block: "end" }),
    );
    await page.waitForLoadState("networkidle");

    const brand = page.locator("footer .font-cinzel").first();
    await expect(brand).toBeVisible();
    await expect(brand).toHaveText(/MVA IMOBILIARE/i);

    await expect(brand).toHaveScreenshot("footer-brand.png");
  });
});
