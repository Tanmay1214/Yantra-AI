import { test, expect, type Page } from "@playwright/test";
const snapshot = (p: Page) =>
  p.evaluate(() => (window as any).__wadokei.snapshot());
const scene = (p: Page) => p.evaluate(() => (window as any).__wadokeiScene());
test("complete exhibit: modes, selection, isolation, camera, regulator, tour, playback, evidence and responsive layout", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/wadokei");
  await expect(page.getByTestId("scene")).toHaveAttribute("data-ready", "true", { timeout: 20000 });
  await page.waitForTimeout(1800);
  expect(await page.locator("canvas").count()).toBe(1);
  let s = await scene(page);
  expect(s.parts.filter((p: any) => p.missing)).toEqual([]);
  expect(s.parts.length).toBe(21);
  expect(s.parts.every((p: any) => p.meshes > 0)).toBe(true);
  expect(s.gears.length).toBe(9);
  expect(new Set(s.gears.map((g: any) => g.name)).size).toBe(9);
  expect(
    s.gears.map((g: any) => g.teeth).sort((a: number, b: number) => a - b),
  ).toEqual([10, 10, 12, 15, 32, 32, 36, 40, 48]);
  await page.screenshot({ path: "artifacts/exterior.png" });
  await page.getByTestId("mode-interior").click();
  await expect
    .poll(
      async () =>
        (await scene(page)).parts.find((p: any) => p.name === "dial").visible,
      { timeout: 15000 },
    )
    .toBe(false);
  s = await scene(page);
  expect(s.parts.find((p: any) => p.name === "dial").visible).toBe(false);
  expect(s.parts.find((p: any) => p.name === "great").visible).toBe(true);
  await page.screenshot({ path: "artifacts/interior.png" });
  await page.getByTestId("mode-xray").click();
  await page.waitForTimeout(1400);
  s = await scene(page);
  expect(s.parts.find((p: any) => p.name === "dial").opacity).toBeGreaterThan(
    0.1,
  );
  expect(s.parts.find((p: any) => p.name === "dial").opacity).toBeLessThan(0.2);
  await page.getByTestId("mode-exploded").click();
  await page.waitForTimeout(1800);
  s = await scene(page);
  expect(
    s.parts.find((p: any) => p.name === "dial").position[2],
  ).toBeGreaterThan(3);
  expect(s.parts.every((p: any) => p.position.every(Number.isFinite))).toBe(
    true,
  );
  await page.screenshot({ path: "artifacts/exploded.png" });
  await page.getByTestId("mode-operating").click();
  await page.waitForTimeout(1200);
  await page.getByTestId("component-escape").click();
  await expect(page.getByTestId("inspector")).toContainText(
    "Crown escape wheel",
  );
  await page.getByTestId("focus-selected").click();
  await page.waitForTimeout(1400);
  const focused = await scene(page);
  expect(focused.camera[2]).toBeLessThan(7);
  await page.getByTestId("isolate-selected").click();
  await page.waitForTimeout(1400);
  s = await scene(page);
  expect(s.parts.filter((p: any) => p.visible).map((p: any) => p.name)).toEqual(
    ["escape"],
  );
  await page.getByTestId("isolate-selected").click();
  await page.waitForTimeout(1200);
  await page.getByTestId("component-foliot").click();
  await page.getByTestId("focus-selected").click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: "artifacts/foliot.png" });
  await page
    .getByRole("slider", { name: "Foliot weight distance" })
    .press("End");
  await page.waitForTimeout(150);
  const slow = await snapshot(page);
  expect(slow.radius).toBe(0.98);
  await page
    .getByRole("slider", { name: "Foliot weight distance" })
    .press("Home");
  await page.waitForTimeout(150);
  expect((await snapshot(page)).radius).toBe(0.32);
  await page.getByTestId("reset-clock").click();
  expect((await snapshot(page)).running).toBe(false);
  expect((await snapshot(page)).travel).toBe(0);
  const frozen = await snapshot(page);
  await page.waitForTimeout(250);
  expect((await snapshot(page)).beats).toBe(frozen.beats);
  await page.getByTestId("play-pause").click();
  await page
    .getByRole("combobox", { name: "Simulation speed" })
    .selectOption("24");
  await page.waitForTimeout(1200);
  const moving = await snapshot(page);
  expect(moving.beats).toBeGreaterThan(1);
  expect(moving.travel).toBeGreaterThan(0);
  expect(Math.abs(moving.second + moving.great * 4)).toBeLessThan(1e-9);
  expect(Math.abs(moving.travel - Math.abs(moving.great) * 0.22)).toBeLessThan(
    1e-9,
  );
  await page.getByTestId("play-pause").click();
  for (const preset of ["front", "side", "rear", "top"]) {
    await page.getByTestId(`camera-${preset}`).click();
    await page.waitForTimeout(1300);
    s = await scene(page);
    if (preset === "top") expect(s.camera[1]).toBeGreaterThan(17);
  }
  await page.getByTestId("camera-reset").click();
  await page.waitForTimeout(1300);
  const before = await scene(page);
  const canvas = page.locator("canvas");
  const box = await canvas.boundingBox();
  await page.mouse.move(box!.x + box!.width * 0.55, box!.y + box!.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(
    box!.x + box!.width * 0.65,
    box!.y + box!.height * 0.55,
    { steps: 10 },
  );
  await page.mouse.up();
  await page.waitForTimeout(500);
  expect((await scene(page)).camera).not.toEqual(before.camera);
  const priorZoom = await scene(page);
  await page.mouse.wheel(0, -400);
  await page.waitForTimeout(500);
  expect((await scene(page)).camera).not.toEqual(priorZoom.camera);
  await page
    .getByRole("button", { name: "Toggle component labels", exact: true })
    .click();
  expect(await page.locator(".component-label").count()).toBeGreaterThan(0);
  expect(await page.locator('.component-label').evaluateAll(nodes=>Math.max(...nodes.map(n=>n.getBoundingClientRect().height)))).toBeLessThan(32);
  await page.getByRole("button", { name: "How it works", exact: true }).click();
  for (let i = 0; i < 6; i++) {
    expect((await snapshot(page)).selected).toBe(
      ["weight", "great", "escape", "foliot", "dial", "bell"][i],
    );
    if (i < 5) await page.getByTestId("next-tour").click();
  }
  await page.getByRole("button", { name: "Evidence", exact: true }).click();
  await expect(page.locator(".evidence-panel")).toContainText(
    "no automatic day/night selector",
  );
  await expect(page.locator(".bibliography a")).toHaveCount(5);
  await page
    .getByRole("slider", { name: "Illustrative daylight length" })
    .press("End");
  await page
    .getByRole("button", { name: "Day weight setting", exact: true })
    .click();
  expect((await snapshot(page)).radius).toBeGreaterThan(0.9);
  await page.getByRole("button", { name: "Exhibit help", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("button", { name: "Audition the bell demonstration" })
    .click();
  await page.waitForTimeout(200);
  expect((await snapshot(page)).hammer).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Close help" }).click();
  await page.getByTestId("mode-exterior").click();
  await page
    .getByRole("button", { name: "Toggle component labels", exact: true })
    .click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(1400);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  await page.screenshot({ path: "artifacts/mobile.png", fullPage: true });
  expect(errors).toEqual([]);
  console.log("Render metrics", JSON.stringify((await snapshot(page)).stats));
});

test("all component records, viewport raycasting, pan, keyboard, isolation of hidden housing and expanded view", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/wadokei");
  await expect(page.getByTestId("scene")).toHaveAttribute("data-ready", "true", { timeout: 20000 });
  await page.getByTestId("reset-clock").click();
  const names = await page.evaluate(() =>
    Object.keys((window as any).__wadokeiScene().projected),
  );
  for (const id of names) {
    const item = page.getByTestId(`component-${id}`);
    const details = item.locator("xpath=ancestor::details[1]");
    if (
      !(await details.getAttribute("open")) &&
      (await details.getAttribute("open")) === null
    )
      await details.locator("summary").click();
    await item.click();
    await expect(page.getByTestId("inspector")).toBeVisible();
    expect((await snapshot(page)).selected).toBe(id);
  }
  await page.getByTestId("mode-exterior").click();
  await page.getByTestId("camera-front").click();
  await page.waitForTimeout(1400);
  const box = await page.locator("canvas").boundingBox();
  const pick = (await scene(page)).projected.pointer;
  await page.mouse.click(box!.x + pick[0], box!.y + pick[1]);
  await expect
    .poll(async () => (await snapshot(page)).selected)
    .toBe("pointer");
  await page.getByTestId("mode-interior").click();
  await page.waitForTimeout(900);
  await page.getByTestId("isolate-selected").click();
  await page.waitForTimeout(1000);
  let parts = (await scene(page)).parts;
  expect(parts.filter((p: any) => p.visible).map((p: any) => p.name)).toEqual([
    "pointer",
  ]);
  expect(parts.find((p: any) => p.name === "pointer").opacity).toBeGreaterThan(
    0.99,
  );
  await page.getByTestId("isolate-selected").click();
  await page.getByTestId("camera-reset").click();
  await page.waitForTimeout(1400);
  const before = await scene(page);
  await page.mouse.move(box!.x + box!.width * 0.6, box!.y + box!.height * 0.45);
  await page.mouse.down({ button: "right" });
  await page.mouse.move(
    box!.x + box!.width * 0.65,
    box!.y + box!.height * 0.5,
    { steps: 10 },
  );
  await page.mouse.up({ button: "right" });
  await page.waitForTimeout(300);
  expect((await scene(page)).camera).not.toEqual(before.camera);
  await page.locator("body").click({ position: { x: 10, y: 70 } });
  await page.keyboard.press("Space");
  expect((await snapshot(page)).running).toBe(true);
  await page.keyboard.press("Space");
  expect((await snapshot(page)).running).toBe(false);
  await page
    .getByRole("button", { name: "Expand viewport", exact: true })
    .click();
  await expect(page.locator(".sidebar")).toBeHidden();
  await page
    .getByRole("button", { name: "Expand viewport", exact: true })
    .click();
  await expect(page.locator(".sidebar")).toBeVisible();
  await page.getByTestId("mode-xray").click();
  await page.waitForTimeout(1400);
  expect(
    (await scene(page)).parts.find((p: any) => p.name === "panels-right")
      .opacity,
  ).toBeLessThan(0.2);
  await page.screenshot({ path: "artifacts/xray.png" });
  await page.getByTestId("mode-interior").click();
  await page.getByRole("button", { name: "How it works", exact: true }).click();
  await page.getByTestId("next-tour").click();
  await page.getByTestId("next-tour").click();
  await page.waitForTimeout(1600);
  await page.screenshot({ path: "artifacts/escapement.png" });
  const render = await scene(page);
  console.log(
    "Desktop renderer",
    JSON.stringify({
      drawCalls: render.drawCalls,
      triangles: render.triangles,
      gears: render.gears.length,
      groups: render.parts.length,
      fps: (await snapshot(page)).stats.fps,
    }),
  );
  expect(errors).toEqual([]);
});
