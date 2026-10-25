# YANTRA handover

Updated 25 October 2026. Active project: `C:\Users\tanma\Documents\MLH`. The old OneDrive working directory is not the application checkout. Git remote: `https://github.com/Tanmay1214/Yantra-AI.git`, branch `main`.

## Product and completed work

- Museum homepage at `/`, titled **YANTRA**, with real interactive previews and shared identity in `src/museum.ts`.
- Wadokei at `/wadokei`: existing single-foliot mechanical reconstruction, selectable components, cameras, views, connected movement and six-stage power tour.
- Chand Baori at `/chand-baori`: original licensed model, fixed sandstone finish, water/temperature/section modes, deterministic environmental inputs and saved scenario comparisons. The creator-reference viewer, colour toggle and model import/inspection dialog were previously removed as requested; retain licence attribution.
- A compact **Guide** tab in both exhibits, powered exclusively by hosted **Gemma 4 through the Gemini API**. The default is `gemma-4-26b-a4b-it`; `gemma-4-31b-it` is an explicit supported alternative. No Ollama/local inference, Gemini-model fallback, voice, autonomous experiment mode, account system or new unrelated features.
- Natural-language controls cover existing cameras/views, water/environment inputs, temperature sampling/profile, saved comparisons, clock selection/focus/isolation, playback/reset, foliot adjustment and guided power-path steps. Explain historical context using the existing curated sources. Numeric summaries come from the deterministic tools.
- Full screen-recording sequence, exact prompts, narration and timing: `docs/DEMO_SHOWCASE.md`.

## Run and credentials

Use Node 22+ and npm. `npm ci`, then `npm run dev`; visit `http://127.0.0.1:5173/`. This starts Vite and the Node adapter on loopback port 8787. The API credential is configured in **ignored, server-only `.env.local`** on this machine. Never print it, commit it, copy it into browser code or prefix it with `VITE_`. Fresh clones must copy `.env.example` to `.env.local` and provide their own credential.

Production preview: `npm run build`; `npm run preview -- --port 4173 --strictPort`; run `npm run agent` separately. Vite proxies `/api/heritage`. Public deployment still needs a properly secured Node backend and same-origin routing; a static frontend alone cannot hold the API secret or run the guide.

## Architecture to preserve

- `server/gemma.ts`: environment loading, explicit hosted Gemma model discovery, REST calls, metadata cache, bounded transient retry and redacted provider errors. Requests go only to Google's fixed API hostname.
- `server/heritage-server.ts`: native function-call loop. Gives Gemma verified state, executes validated calls, returns actual results, then obtains a concise explanation. At most eight selected actions/four rounds. No application mutation if the transaction fails.
- `src/guide/tools.ts`: shared typed context, declarations, validators, bibliographies, dispatch and deterministic human summaries. UI replays every returned action before applying any. No arbitrary execution/filesystem/network tools.
- `src/guide/GuidePanel.tsx` and `guide.css`: one small shared interface; three initial suggestions, question input, short answers, numerical result summaries and collapsed source/tool details. Conversation survives exhibit-tab changes but not document navigation/reload. Pending replies are discarded if manual controls change.
- `src/wadokei-entry.tsx` and `src/heritage/HeritageApp.tsx`: adapters apply shared tool results through existing state and handlers. Clock animation phase is never overwritten by a stale AI snapshot. Foliot changes focus the weights and clear prior isolation so the adjustment is visible. Text entry must not trigger the clock's Space shortcut.
- `src/mechanism.ts`, `src/inventory.ts`, `src/heritage/environment.ts`, original model files and simulation equations remain the numerical/historical authorities. Do not let generated prose replace them.

## Verification already performed

- Production build/type checks passed.
- Unit tests: **22/22 passed**.
- Full browser suite: **9/9 passed**; final guide-specific rerun: **3/3 passed**.
- Built-site homepage/navigation smoke passed.
- Real hosted Gemma calls were executed. The default-model clock browser run passed all four inspection/regulation/tour requests. Default-model water and temperature browser requests passed, and a separate default-model service-level call confirmed scenario comparison. A 31B browser run also completed comparison. See `docs/GEMMA_VERIFICATION.md` for exact outcomes and incomplete runs; do not relabel mocks or partial runs as complete live success.
- Exact credential exclusion from source/build was checked; `.env.local` is ignored. Original asset archive hash is preserved.

Commands: `npm test`, `npm run build`, `npm run test:e2e`. Live inference is opt-in and spends quota: `node --import tsx scripts/guide-live-smoke.mjs`. Set `YANTRA_LIVE_SECTION=clock` or `well` for independent runs; `YANTRA_TEST_URL` can target production preview. The live script's bounded quota retries are test-only.

## Known limits and continuation

1. **API quota and service availability are real demo constraints.** Testing encountered 429 retry delays and intermittent 5xx/transport failures. Default 26B clock replies succeeded in several seconds; 31B was considerably slower/less reliable during this session. Follow the displayed retry delay. Keep errors honest; do not fake results or substitute another model. Check Google AI Studio quota before recording.
2. Inspect `artifacts/gemma-live-*.json` flags: only `complete: true` means that particular run finished. Partial receipts preserve successful calls but do not prove a complete continuous demo. Live verification details and screenshots are in `docs/GEMMA_VERIFICATION.md`.
3. The stepwell is an artistic voxel model with illustrative metre calibration. Temperature is a configured empirical estimate, not a measurement/CFD. No live sensors, groundwater model, storage-volume integration, wind/humidity model or water-air coupling exists. The clock is a kinematic explanatory reconstruction, not force/contact physics or an authenticated individual artifact.
4. A literal-number check is an additional safeguard, not a proof that every generated sentence is scientifically/historically correct. Verified summaries, tool outputs and curated citations remain the quantitative evidence.
5. Keep the UI restrained. Do not add model pickers, dashboards, voice, exports or other new user features without agreement. Read root `AGENTS.md` and the guide documentation before changes.

At handover, the local development server is intended to remain available for the user. Temporary production previews used for QA should be stopped after checking. Future updates must preserve the ignored credential and original asset bytes. This file travels with the implementation commit pushed to the supplied GitHub repository.
