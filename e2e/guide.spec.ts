import { test, expect, type Page } from "@playwright/test";
import { bibliography, executeGuideTool, type Context, type Exhibit, type GuideReply } from "../src/guide/tools";

async function status(page: Page) {
  await page.route("**/api/heritage/status", r => r.fulfill({ json: { ready: true, model: "gemma-4-test-fixture", instructions: "Mocked transport" } }));
}
function response(exhibit: Exhibit, context: Context, actions: { name: string; args: Record<string, unknown> }[]): GuideReply {
  let current = context;
  const results = [{ name: "get_simulation_state", args: {} }, ...actions].map(a => { const r = executeGuideTool(exhibit, current, a.name, a.args); current = r.context; return r.tool; });
  return { exhibit, model: "gemma-4-test-fixture", explanation: "Mocked inference. The controls reflect the validated tools below.", results, sources: bibliography(exhibit) };
}
test("clock guide applies selected tools, keeps typing safe and retains conversation across tabs", async ({ page }) => {
  await status(page); let request = 0;
  await page.route("**/api/heritage/guide", async r => {
    const body = r.request().postDataJSON(); request++;
    const actions = request === 1 ? [{ name: "set_clock_running", args: { running: false } }, { name: "set_view_mode", args: { mode: "interior" } }, { name: "inspect_component", args: { component_id: "escape" } }]
      : [{ name: "set_foliot_weights", args: { distance: .95 } }];
    await r.fulfill({ json: response("wadokei", body.context, actions) });
  });
  await page.goto("/wadokei");
  await expect(page.getByTestId("scene")).toHaveAttribute("data-ready", "true", { timeout: 20000 });
  await page.getByRole("button", { name: "Guide", exact: true }).click();
  const input = page.getByLabel("Ask the museum guide");
  const running = await page.evaluate(() => (window as any).__wadokei.snapshot().running);
  await input.fill("Open"); await input.press("Space");
  expect(await page.evaluate(() => (window as any).__wadokei.snapshot().running)).toBe(running);
  await input.fill("Pause and show the escapement."); await input.press("Enter");
  await expect(page.locator(".yg-applied")).toBeVisible();
  const clock = await page.evaluate(() => (window as any).__wadokei.snapshot());
  expect(clock.running).toBe(false); expect(clock.mode).toBe("interior"); expect(clock.selected).toBe("escape");
  await page.getByRole("button", { name: "Explore", exact: true }).click();
  await page.getByRole("button", { name: "Guide", exact: true }).click();
  await expect(page.locator(".yg-question")).toContainText("Pause and show");
  await input.fill("Move the weights outward to 0.95."); await input.press("Enter");
  await expect.poll(() => page.evaluate(() => (window as any).__wadokei.snapshot().radius)).toBe(.95);
  await expect(page.locator(".yg-verified").last()).toContainText("Weights 0.95 model units");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test("late guide replies never overwrite manual water controls", async ({ page }) => {
  await status(page); let release: () => void = () => {}, started: () => void = () => {};
  const ready = new Promise<void>(r => started = r), gate = new Promise<void>(r => release = r);
  await page.route("**/api/heritage/guide", async r => {
    const body = r.request().postDataJSON(); started(); await gate;
    await r.fulfill({ json: response("chand-baori", body.context, [{ name: "set_water_level", args: { level_m: -18 } }]) });
  });
  await page.goto("/chand-baori");
  await page.waitForFunction(() => !!(window as any).__chandScene?.().assetLoaded);
  await page.getByRole("tab", { name: "Guide", exact: true }).click();
  await page.getByLabel("Ask the museum guide").fill("Lower water.");
  await page.getByRole("button", { name: "Ask Gemma", exact: true }).click(); await ready;
  await page.getByRole("tab", { name: "Conditions", exact: true }).click();
  await page.getByRole("button", { name: "Raise water by one metre" }).click();
  release(); await page.getByRole("tab", { name: "Guide", exact: true }).click();
  await expect(page.locator(".yg-error")).toContainText("changed the controls");
  expect(await page.evaluate(() => (window as any).__chand().conditions.waterLevel)).toBe(-15);
});
test("invalid guide actions cannot partially change an exhibit", async ({ page }) => {
  await status(page);
  await page.route("**/api/heritage/guide", r => r.fulfill({ json: { exhibit: "chand-baori", model: "test", explanation: "Invalid test", results: [
    { name: "set_water_level", args: { level_m: -18 } }, { name: "execute_code", args: {} },
  ] } }));
  await page.goto("/chand-baori");
  await page.waitForFunction(() => !!(window as any).__chandScene?.().assetLoaded);
  await page.getByRole("tab", { name: "Guide", exact: true }).click();
  await page.getByLabel("Ask the museum guide").fill("Change water."); await page.getByRole("button", { name: "Ask Gemma", exact: true }).click();
  await expect(page.locator(".yg-error")).toContainText("Unsupported tool");
  expect(await page.evaluate(() => (window as any).__chand().conditions.waterLevel)).toBe(-16);
});
