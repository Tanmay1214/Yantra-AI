import { chromium } from "@playwright/test";
import assert from "node:assert/strict";

const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || "chrome", headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  const response = await page.goto("http://127.0.0.1:4173/");
  assert.equal(response.status(), 200);
  assert.equal(await page.title(), "YANTRA");
  await page.getByTestId("clock-preview").waitFor();
  await page.waitForFunction(() => document.querySelector('[data-testid="clock-preview"]')?.getAttribute("data-ready") === "true" && document.querySelector('[data-testid="well-preview"]')?.getAttribute("data-ready") === "true");
  await page.waitForFunction(() => window.__chandScene?.().assetLoaded);
  await page.waitForTimeout(1800);
  await page.screenshot({ path: "artifacts/archive-production.png", fullPage: true });
  await page.getByRole("link", { name: "Enter Wadokei exhibit", exact: true }).click();
  await page.waitForFunction(() => window.__wadokei?.snapshot().ready);
  assert.equal(new URL(page.url()).pathname, "/wadokei");
  await page.getByRole("link", { name: "Back to YANTRA", exact: true }).click();
  await page.getByRole("link", { name: "Enter Chand Baori exhibit", exact: true }).click();
  await page.waitForFunction(() => window.__chandScene?.().assetLoaded);
  assert.equal(new URL(page.url()).pathname, "/chand-baori");
  await page.reload();
  await page.waitForFunction(() => window.__chandScene?.().assetLoaded);
  await page.getByRole("link", { name: "Back to YANTRA", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("link", { name: "Enter Chand Baori exhibit", exact: true }).scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector('[data-testid="well-preview"]')?.getAttribute("data-ready") === "true");
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: "artifacts/archive-production-mobile.png", fullPage: true });
  assert.deepEqual(errors, []);
  console.log("Production homepage, real previews, exhibit entry/return, direct route reload and mobile width passed.");
} finally {
  await browser.close();
}
