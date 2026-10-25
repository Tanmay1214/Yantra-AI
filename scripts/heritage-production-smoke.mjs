import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL || "chrome",
  headless: true,
});
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      /Shader Error|VALIDATE_STATUS|shader.*compile|GL_INVALID_OPERATION/i.test(
        message.text(),
      )
    )
      errors.push(message.text());
  });
  const response = await page.goto("http://127.0.0.1:4173/chand-baori");
  assert.equal(response.status(), 200);
  await page.waitForFunction(
    () => window.__chand?.().assetLoaded && window.__chandScene?.().assetLoaded,
  );
  await page.waitForTimeout(1800);
  let s = await page.evaluate(() => window.__chandScene());
  assert.equal(s.sourceMeshes.length, 3);
  assert.ok(s.sourceMeshes.every((m) => !m.transparent));
  assert.equal(s.finish, "stone");
  assert.equal(s.surfaceTextureSize, 512);
  await page.screenshot({ path: "artifacts/chand-production-explore.png" });
  assert.equal(
    await page.locator('.stage-actions,input[type="file"],iframe').count(),
    0,
  );
  for (const mode of [
    "Water",
    "Temperature",
    "Cross-section",
    "Environmental",
    "Architecture",
    "Explore",
  ]) {
    await page.getByTestId(`view-${mode}`).click();
    await page.waitForTimeout(300);
  }
  s = await page.evaluate(() => window.__chandScene());
  assert.ok(s.sourceMeshes.every((m) => !m.clipped));
  await page.getByTestId("view-Water").click();
  await page.waitForTimeout(500);
  assert.ok((await page.evaluate(() => window.__chandScene())).maskCells > 0);
  const h = page.getByLabel("Water elevation value", { exact: true });
  await h.fill("-10");
  await h.press("Tab");
  await page.waitForTimeout(900);
  assert.ok(
    Math.abs((await page.evaluate(() => window.__chandScene())).waterY + 10) <
      0.05,
  );
  await page.screenshot({ path: "artifacts/chand-production-water.png" });
  await page.getByTestId("view-Explore").click();
  await page
    .getByRole("button", { name: "Camera Lower levels", exact: true })
    .click();
  await page.waitForTimeout(1700);
  await page.screenshot({ path: "artifacts/chand-stone-detail.png" });
  await page
    .getByRole("button", { name: "Camera Overview", exact: true })
    .click();
  await page.waitForTimeout(1700);
  await page.getByTestId("view-Environmental").click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: "artifacts/chand-production-environment.png" });
  for (const preset of ["Top", "Interior", "Lower levels", "Front"]) {
    await page
      .getByRole("button", { name: `Camera ${preset}`, exact: true })
      .click();
    await page.waitForTimeout(1700);
    await page.screenshot({
      path: `artifacts/chand-production-${preset.toLowerCase().replaceAll(" ", "-")}.png`,
    });
  }
  assert.deepEqual(errors, []);
  console.log(
    "Production heritage smoke passed",
    JSON.stringify(await page.evaluate(() => window.__chandScene())),
  );
} finally {
  await browser.close();
}
