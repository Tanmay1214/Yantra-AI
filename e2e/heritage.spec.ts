import { test, expect } from "@playwright/test";
import { DEFAULT, outputs } from "../src/heritage/environment";
test("actual Chand Baori geometry, water, thermal profile, modes, scenario comparison and mobile layout", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => {
    errors.push(e.message);
    console.log(e.stack);
  });
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      /Shader Error|VALIDATE_STATUS|shader.*compile|GL_INVALID_OPERATION/i.test(
        message.text(),
      )
    )
      errors.push(message.text());
  });
  await page.goto("/chand-baori");
  await expect(
    page.getByRole("heading", { name: "Chand Baori", level: 1 }),
  ).toBeVisible();
  await page.waitForFunction(() => !!(window as any).__chand?.().assetLoaded);
  await page.waitForFunction(
    () => !!(window as any).__chandScene?.().assetLoaded,
  );
  await expect(page.getByTestId("missing-asset")).toHaveCount(0);
  let s = await page.evaluate(() => (window as any).__chandScene());
  expect(s.sourceMeshes).toHaveLength(3);
  expect(s.sourceMeshes.every((m: any) => !m.transparent)).toBe(true);
  expect(s.finish).toBe("stone");
  expect(s.surfaceTextureSize).toBe(512);
  await page.waitForTimeout(1600);
  await page.screenshot({ path: "artifacts/chand-explore.png" });
  await expect(
    page.getByRole("button", { name: "Creator reference", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Textured stone finish", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Inspect or load model", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator('input[type="file"],iframe')).toHaveCount(0);
  const canvas = page.locator("canvas"),
    rect = (await canvas.boundingBox())!;
  const beforeOrbit = await page.evaluate(
    () => (window as any).__chandScene().camera,
  );
  await page.mouse.move(rect.x + rect.width * 0.6, rect.y + rect.height * 0.6);
  await page.mouse.down();
  await page.mouse.move(
    rect.x + rect.width * 0.7,
    rect.y + rect.height * 0.55,
    { steps: 8 },
  );
  await page.mouse.up();
  await page.waitForTimeout(250);
  expect(
    await page.evaluate(() => (window as any).__chandScene().camera),
  ).not.toEqual(beforeOrbit);
  const beforeZoom = await page.evaluate(
    () => (window as any).__chandScene().camera,
  );
  await page.mouse.wheel(0, -120);
  await page.waitForTimeout(200);
  expect(
    await page.evaluate(() => (window as any).__chandScene().camera),
  ).not.toEqual(beforeZoom);
  await page
    .getByRole("button", { name: "Camera Overview", exact: true })
    .click();
  await page.waitForTimeout(1700);
  await page.getByTestId("view-Water").click();
  await page.waitForTimeout(500);
  s = await page.evaluate(() => (window as any).__chandScene());
  expect(s.maskCells).toBeGreaterThan(0);
  const field = page.getByLabel("Water elevation value", { exact: true });
  await field.fill("-10");
  await field.press("Tab");
  await expect(page.getByTestId("water-reading")).toContainText("-10.0");
  await page.waitForTimeout(900);
  expect(
    (await page.evaluate(() => (window as any).__chandScene())).waterY,
  ).toBeCloseTo(-10, 1);
  await field.fill("2");
  await field.press("Tab");
  await expect(page.getByRole("alert")).toContainText("Enter");
  expect(
    (await page.evaluate(() => (window as any).__chand())).conditions
      .waterLevel,
  ).toBe(-10);
  await field.fill("-16");
  await field.press("Tab");
  const old = await page.getByTestId("temperature-reading").innerText();
  await page.getByLabel("Outdoor air value", { exact: true }).fill("43");
  await page.getByLabel("Outdoor air value", { exact: true }).press("Tab");
  expect(await page.getByTestId("temperature-reading").innerText()).not.toBe(
    old,
  );
  const state = await page.evaluate(() => (window as any).__chand());
  expect(state.conditions.sampleDepth).toBe(DEFAULT.sampleDepth);
  expect(state.outputs.sampled_C).toBeCloseTo(
    outputs(state.conditions).sampled_C,
    10,
  );
  for (const mode of [
    "Temperature",
    "Cross-section",
    "Environmental",
    "Architecture",
    "Explore",
  ]) {
    await page.getByTestId(`view-${mode}`).click();
    await expect(page.getByTestId(`view-${mode}`)).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  }
  expect(
    (
      await page.evaluate(() => (window as any).__chandScene())
    ).sourceMeshes.every((m: any) => !m.clipped),
  ).toBe(true);
  await page.getByTestId("view-Cross-section").click();
  expect(
    (
      await page.evaluate(() => (window as any).__chandScene())
    ).sourceMeshes.every((m: any) => m.clipped),
  ).toBe(true);
  await page.waitForTimeout(500);
  await page.screenshot({ path: "artifacts/chand-section.png" });
  await page.getByTestId("view-Environmental").click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: "artifacts/chand-environment.png" });
  await page.locator(".zone-marker").nth(1).click();
  await expect(page.locator(".selection-card")).toContainText(
    "source-surface zone",
  );
  await page.getByRole("button", { name: "Close inspection" }).click();
  await page.getByRole("button", { name: "Camera Top", exact: true }).click();
  await page.waitForTimeout(1700);
  expect(
    (await page.evaluate(() => (window as any).__chandScene())).camera[1],
  ).toBeGreaterThan(40);
  await page
    .getByRole("button", { name: "Camera Overview", exact: true })
    .click();
  await page.waitForTimeout(1700);
  await page.getByRole("tab", { name: "Compare", exact: true }).click();
  await expect(page.locator(".comparison-table")).toContainText(
    "Not established",
  );
  await page.getByLabel("Scenario name").fill("My warm case");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.locator(".snapshot-list")).toContainText("My warm case");
  await page
    .getByLabel("Scenario B", { exact: true })
    .selectOption({ label: "My warm case" });
  await page.getByRole("button", { name: "Apply B to scene" }).click();
  expect(
    (await page.evaluate(() => (window as any).__chand())).conditions.outdoor,
  ).toBe(43);
  await page.screenshot({ path: "artifacts/chand-compare.png" });
  await page.getByRole("tab", { name: "Evidence", exact: true }).click();
  await expect(page.locator(".source-links")).toContainText(
    "Rajasthan Tourism",
  );
  await expect(page.locator(".evidence-key")).toContainText("No weather");
  await page.getByRole("tab", { name: "Guide", exact: true }).click();
  await expect(page.locator(".connection")).toContainText("Gemma 4 offline");
  await expect(
    page.getByRole("button", { name: "Ask Gemma", exact: true }),
  ).toBeDisabled();
  await page.getByRole("tab", { name: "Conditions", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  await page.screenshot({ path: "artifacts/chand-mobile.png", fullPage: true });
  expect(errors).toEqual([]);
});
test("missing asset recovery and explicitly mocked agent transport preserve deterministic controls", async ({
  page,
}) => {
  await page.route("**/models/chand-baori/scene.gltf", (r) =>
    r.fulfill({ status: 404, body: "missing" }),
  );
  await page.route("**/api/heritage/status", (r) =>
    r.fulfill({
      json: {
        ready: true,
        models: ["gemma4:test-fixture"],
        instructions: "TEST FIXTURE — not actual inference",
      },
    }),
  );
  await page.route("**/api/heritage/guide", async (route) => {
    const body = route.request().postDataJSON();
    const conditions = { ...body.context.conditions, waterLevel: -18 };
    await route.fulfill({
      json: {
        model: "gemma4:test-fixture",
        conditions,
        explanation: "Mocked transport; deterministic result.",
        results: [
          {
            name: "set_water_level",
            args: { level_m: -18 },
            result: outputs(conditions),
            conditions,
          },
        ],
      },
    });
  });
  await page.goto("/chand-baori");
  await expect(page.getByTestId("missing-asset")).toBeVisible();
  await expect(page.getByTestId("missing-asset")).toContainText(
    "could not load",
  );
  await expect(
    page.getByRole("button", { name: "Reload exhibit", exact: true }),
  ).toBeVisible();
  await expect(page.locator('input[type="file"]')).toHaveCount(0);
  await page.getByRole("tab", { name: "Guide", exact: true }).click();
  await page
    .getByLabel("Ask the local guide")
    .fill("Lower the water by two metres.");
  await page.getByRole("button", { name: "Ask Gemma", exact: true }).click();
  await expect(page.locator(".guide-messages")).toContainText(
    "set_water_level",
  );
  expect(
    (await page.evaluate(() => (window as any).__chand())).conditions
      .waterLevel,
  ).toBe(-18);
  await page.getByRole("tab", { name: "Conditions", exact: true }).click();
  await expect(page.getByTestId("water-reading")).toContainText("-18.0");
});
