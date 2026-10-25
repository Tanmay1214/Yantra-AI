# Hosted Gemma guide verification — 25 October 2026

Checked in `C:\Users\tanma\Documents\MLH` with Node 24, installed Chrome and the supplied Google API credential. No credential is included in this report, Git or the browser bundle.

## Application checks actually executed

| Check | Result |
| --- | --- |
| `npm run build` | Passed strict frontend/backend TypeScript and Vite compilation after the final guide changes. Existing Three.js chunk-size advisory remains. |
| `npm test` | **22/22 passed**, including deterministic mechanics/environment, native-call orchestration, bounded tools, transactional rejection and stale-response fingerprints. |
| `npm run test:e2e` | **9/9 passed** for both exhibits, the homepage, mocked guide transport, offline controls, missing assets, camera/selection and phone layout. |
| `npx playwright test e2e/guide.spec.ts` | **3/3 passed again after final guide refinements**: clock actions and typing safety, conversation retention, manual-control races and invalid tool atomicity. |
| `node scripts/home-production-smoke.mjs` | Passed against the built preview: actual previews, exhibit entry/return, direct route reload, phone width and no uncaught page errors. |
| Credential exclusion | Exact credential absent from tracked/untracked non-ignored source and `dist/`; `.env.local` confirmed ignored. |
| Source preservation | Clock mechanics, stepwell equations/scenes and original assets have no task diff. Original ZIP SHA-256 remains `F2333CD190197B62D3FD1CB78857D5619B07734A2178872401F3C3A65D2DE28F`. |

## Actual hosted inference

The API returned both `gemma-4-26b-a4b-it` and `gemma-4-31b-it` with `generateContent` support. These were actual model calls, not mocked browser responses or keyword-based simulations.

**Default model: `gemma-4-26b-a4b-it`.** The independent live clock browser run passed all four requests, including assertions on the actual rendered application's state:

1. Pause, open and show the escapement: native `set_clock_running`, `set_view_mode`, `inspect_component`; paused Interior view and selected real `escape` component.
2. Start and move foliot weights outward: native `set_clock_running`, `set_foliot_weights`; actual radius `0.95`, running movement and calculated beat `0.94 → 1.15 s`.
3. Start the power path: native `show_power_path` with stage `0`, selecting `weight`.
4. Follow up with the next step: native `show_power_path` with stage `1`, selecting `great`.

Successful clock request times in that run were approximately 4–8 seconds, excluding a provider-requested quota pause. Receipt: `artifacts/gemma-live-clock.json`, marked `complete: true`. Screenshots: `gemma-clock-live.png` and `gemma-power-path-live.png`.

The default-model stepwell browser run confirmed native water control to **−18 m**, actual Water view, and native depth sampling at **12 m → 28.7 °C**, with Temperature view. Those successful requests took approximately 5–6 seconds. Its later comparison request hit a transport failure after retrying, so `artifacts/gemma-live-well.json` is explicitly **incomplete**, not reported as a complete passed run.

A subsequent standalone service-level call on the default 26B model successfully invoked `compare_scenarios` with explicit baseline/hot-summer test scenarios built from the project's presets. It returned **0.0 m** water difference and **3.5 °C** estimated air difference, and qualitatively explained the hotter scenario. Receipt: `artifacts/gemma-comparison-confirmation.json`. This confirms default-model comparison/tool orchestration, but does not turn the earlier failed browser run into a complete passed run.

A separate actual `gemma-4-31b-it` browser run completed all three stepwell requests, including `compare_scenarios` on the two real saved IDs: B minus A was **0.0 m** water change and **3.5 °C** estimated selected-depth air difference. This record is retained in `artifacts/gemma-live-results.json`; it is marked incomplete because the later clock portion did not finish successfully. A successful subset is not described as a passed uninterrupted full-exhibit sequence.

The 31B variant also experienced much longer latency and HTTP 500/transport failures in clock checks. After these observations, the configured default returned to the 26B variant, which completed the actual clock sequence correctly. No automatic model substitution was added. Both variants remain available through the explicit server environment configuration.

## Limits and demo readiness

Google returned actual HTTP 429 quota responses, including retry delays, as well as intermittent 5xx/transport errors. The app shows a truthful error and preserves manual controls. Transient transport/5xx errors have one bounded retry; the visitor app does not retry quota errors or switch models automatically. The opt-in live test alone waits for quota recovery, with a bounded retry count.

These results establish actual hosted tool use and application integration, not guaranteed API availability, fixed response timing, semantic correctness of every possible generated sentence, historical authentication, measured site temperatures or physical validation. Follow the [recording timeline](DEMO_SHOWCASE.md) as an edited showcase; allow provider-requested pauses. The Node adapter is a local development/demo backend, not a secured public deployment.
