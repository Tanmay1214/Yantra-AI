import { test, expect } from "@playwright/test";

test("archive renders both real exhibits, navigates in and back, and fits a phone", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => {
    if (message.type() === "error" && /Shader Error|VALIDATE_STATUS|GL_INVALID_OPERATION/i.test(message.text())) errors.push(message.text());
  });
  await page.goto("/");
  await expect(page).toHaveTitle("YANTRA");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("The past is");
  await page.getByTestId("clock-preview").scrollIntoViewIfNeeded();
  await expect(page.getByTestId("clock-preview")).toHaveAttribute("data-ready", "true");
  await expect(page.getByTestId("well-preview")).toHaveAttribute("data-ready", "true");
  await expect(page.locator("canvas")).toHaveCount(2);
  await page.waitForFunction(() => !!(window as any).__chandScene?.().assetLoaded);
  expect(await page.evaluate(() => (window as any).__chandScene().sourceMeshes.length)).toBe(3);
  await page.waitForTimeout(1800);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: "artifacts/archive-desktop.png", fullPage: true });
  await page.getByRole("link", { name: "Enter Wadokei exhibit", exact: true }).click();
  await expect(page).toHaveURL(/\/wadokei$/);
  await expect(page.getByTestId("scene")).toHaveAttribute("data-ready", "true", { timeout: 20000 });
  await page.getByTestId("mode-interior").click();
  await expect.poll(() => page.evaluate(() => (window as any).__wadokei.snapshot().mode)).toBe("interior");
  await page.getByRole("link", { name: "Back to YANTRA", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.getByRole("link", { name: "Enter Chand Baori exhibit", exact: true }).click();
  await expect(page).toHaveURL(/\/chand-baori$/);
  await page.waitForFunction(() => !!(window as any).__chandScene?.().assetLoaded);
  await page.getByRole("button", { name: "Water", exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as any).__chand().mode)).toBe("Water");
  await page.getByRole("link", { name: "Back to YANTRA", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("link", { name: /The collection 02/ }).click();
  await expect(page).toHaveURL(/#collection$/);
  await expect(page.getByRole("heading", { name: "The collection", exact: true })).toBeInViewport();
  await page.getByRole("link", { name: "Enter Chand Baori exhibit", exact: true }).scrollIntoViewIfNeeded();
  await expect(page.getByTestId("well-preview")).toHaveAttribute("data-ready", "true");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: "artifacts/archive-mobile.png", fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.getByRole("link", { name: "Skip to content", exact: true })).toHaveAttribute("href", "#main-content");
  expect(errors).toEqual([]);
});

test("unknown paths offer recovery instead of loading an unrelated exhibit", async ({ page }) => {
  await page.goto("/missing-exhibit");
  await expect(page).toHaveTitle("Page not found — YANTRA");
  await expect(page.getByRole("heading", { name: "Nothing on display here." })).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  await page.getByRole("link", { name: "Return to the archive" }).click();
  await expect(page).toHaveTitle("YANTRA");
});
