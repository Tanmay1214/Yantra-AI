// Explicit opt-in live inference check. This consumes Gemini API quota; ordinary tests mock inference.
import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { beatPeriod } from "../src/mechanism.ts";

const base = process.env.YANTRA_TEST_URL || "http://127.0.0.1:5173";
const section = process.env.YANTRA_LIVE_SECTION || "all";
assert.ok(["all", "well", "clock"].includes(section));
const report = `artifacts/gemma-live-${section}.json`;
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || "chrome", headless: true });
const evidence = [];
let selectedModel;
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = []; page.on("pageerror", e => errors.push(e.message));
  async function ask(question, expected, retries = 0) {
    await page.getByLabel("Ask the museum guide").fill(question);
    const returned = page.waitForResponse(r => r.url().endsWith("/api/heritage/guide") && r.request().method() === "POST", { timeout: 145000 });
    const start = Date.now(); await page.getByRole("button", { name: "Ask Gemma", exact: true }).click();
    const response = await returned, reply = await response.json();
    if (response.status() === 429) {
      assert.ok(retries < 2, "Provider quota remains unavailable after two live-test retries.");
      const wait = Math.max(15, reply.retryAfterSeconds || 60);
      console.log(`Provider quota: waiting ${wait}s before retrying this live test prompt.`);
      await page.locator(".yg-working").waitFor({ state: "hidden" });
      await new Promise(r => setTimeout(r, wait * 1000));
      return ask(question, expected, retries + 1);
    }
    assert.equal(response.status(), 200, reply.error || "Guide request failed");
    assert.equal(reply.model, selectedModel);
    console.log("Native response", JSON.stringify({ question, tools: reply.results.map(t => t.name), explanation: reply.explanation }));
    for (const name of expected) assert.ok(reply.results.some(t => t.name === name), `Missing actual tool ${name}`);
    await page.locator(".yg-working").waitFor({ state: "hidden" });
    assert.equal(await page.locator(".yg-messages article").last().locator(".yg-error").count(), 0);
    evidence.push({ question, seconds: (Date.now()-start)/1000, model: reply.model, tools: reply.results.map(({ name, args, summary }) => ({ name, args, summary })), explanation: reply.explanation });
    await writeFile(report, JSON.stringify({ provider: "Gemini API", realInference: true, section, complete: false, checkedAt: new Date().toISOString(), results: evidence }, null, 2));
    console.log(JSON.stringify(evidence.at(-1)));
  }
  const statusResponse = page.waitForResponse(r => r.url().endsWith("/api/heritage/status"));
  await page.goto(`${base}/chand-baori`);
  await page.waitForFunction(() => window.__chandScene?.().assetLoaded);
  await page.getByRole("tab", { name: "Guide", exact: true }).click();
  const connection = await (await statusResponse).json();
  console.log("Hosted guide status", JSON.stringify(connection));
  assert.equal(connection.ready, true, connection.instructions);
  assert.ok(["gemma-4-31b-it", "gemma-4-26b-a4b-it"].includes(connection.model));
  selectedModel = connection.model;
  await page.locator(".yg-connected").waitFor();
  if (section !== "clock") {
  await ask("Lower the water by two metres.", ["set_water_level"]);
  assert.equal(await page.evaluate(() => window.__chand().conditions.waterLevel), -18);
  assert.equal(await page.evaluate(() => window.__chand().mode), "Water");
  await page.screenshot({ path: "artifacts/gemma-water-live.png" });
  await ask("Show the estimated temperature at twelve metres depth.", ["sample_temperature"]);
  assert.equal(await page.evaluate(() => window.__chand().conditions.sampleDepth), 12);
  await page.screenshot({ path: "artifacts/gemma-temperature-live.png" });
  await ask("Compare my two saved scenarios.", ["compare_scenarios"]);
  await page.screenshot({ path: "artifacts/gemma-comparison-live.png" });
  }
  if (section !== "well") {
  await page.goto(`${base}/wadokei`);
  await page.waitForFunction(() => window.__wadokei?.snapshot().ready);
  await page.getByRole("button", { name: "Guide", exact: true }).click();
  await page.locator(".yg-connected").waitFor();
  await ask("Pause the clock, open it and show me the escapement.", ["set_clock_running", "inspect_component"]);
  let clock = await page.evaluate(() => window.__wadokei.snapshot());
  assert.equal(clock.running, false); assert.equal(clock.mode, "interior"); assert.equal(clock.selected, "escape");
  await page.waitForTimeout(1000); await page.screenshot({ path: "artifacts/gemma-clock-live.png" });
  await ask("Start the clock. Move the foliot weights outward to 0.95 and explain the change.", ["set_clock_running", "set_foliot_weights"]);
  clock = await page.evaluate(() => window.__wadokei.snapshot()); assert.equal(clock.radius, .95); assert.equal(clock.running, true);
  assert.ok(beatPeriod(clock.radius) > beatPeriod(.76));
  await ask("Walk me through the power path.", ["show_power_path"]);
  assert.equal(await page.evaluate(() => window.__wadokei.snapshot().selected), "weight");
  await ask("Show the next step.", ["show_power_path"]);
  assert.equal(await page.evaluate(() => window.__wadokei.snapshot().selected), "great");
  await page.waitForTimeout(1000); await page.screenshot({ path: "artifacts/gemma-power-path-live.png" });
  }
  assert.deepEqual(errors, []);
  await mkdir("artifacts", { recursive: true });
  await writeFile(report, JSON.stringify({ provider: "Gemini API", realInference: true, section, complete: true, checkedAt: new Date().toISOString(), results: evidence }, null, 2));
  console.log(`Actual hosted Gemma tool calls applied successfully: ${section}.`);
} finally { await browser.close(); }
