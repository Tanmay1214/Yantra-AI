# Hosted Gemma 4 guide

YANTRA uses **Gemma 4**, accessed through Google's hosted Gemini API. It does not run an AI model locally, and it does not silently substitute a Gemini model. The default `gemma-4-26b-a4b-it` and alternative `gemma-4-31b-it` come from the [official hosted Gemma documentation](https://ai.google.dev/gemma/docs/core/gemma_on_gemini_api). The configured model must be returned by the [models endpoint](https://ai.google.dev/api/models) with `generateContent` support.

## Setup and visitor controls

Use Node 22+ and the existing npm dependencies. Copy `.env.example` to `.env.local`, set `GEMINI_API_KEY`, and run `npm run dev`. The local file is ignored by Git and read only by the server. For built-site preview run the preview and `npm run agent` separately. `.env.local` is never copied into `dist/`. The backend contacts `generativelanguage.googleapis.com` with the key in an HTTP header, never a browser-visible URL.

Each exhibit has one **Guide** tab. Ask in natural language or select one of three starting prompts. Enter sends, Shift+Enter adds a line. The guide displays a concise answer, verified numerical summaries and an explicit notice when controls change. Sources, model ID and raw tool results are behind **Sources & tool details**. No API-key form, model selector, voice interface, account system or autonomous experiment feature was added.

The guide retains up to six completed exchanges while the exhibit page remains open, including across its tabs. It receives the active exhibit's current controls, selection and bounded context. Reloading/navigating between exhibit documents starts a new conversation. No server-side conversation store is used. Questions, limited conversation context, simulation inputs/results and curated heritage descriptions are sent to Google's API; model files, source code, screenshots and secrets are not included in those prompts.

## Responsibilities and execution

- `server/gemma.ts`: server-only credential loading, supported-model discovery, hosted REST requests and redacted provider errors. No SDK dependency is needed.
- `server/heritage-server.ts`: bounded multi-turn **native function calling**. The model receives current verified state and curated history, returns function calls, receives actual tool results, and then explains them. At most eight model-selected actions across four inference rounds are permitted. A request fails without application changes if any call or final answer is invalid or inference fails.
- `src/guide/tools.ts`: typed shared context, component IDs, function declarations, physical bounds, dispatch, bibliographies and human-readable result summaries. Environmental calculations reuse `environment.ts`/`agentTools.ts`; clock readings use the existing `beatPeriod`, tooth counts, inventory and tour. There are no independent AI simulation equations.
- `src/guide/GuidePanel.tsx`: one reusable conversation UI. It validates/replays all returned calls before updating live state. Changes to manual controls during inference invalidate the pending transaction; animation phase updates alone do not. The UI never accepts generated control values outside the shared validators.
- Exhibit adapters apply validated controls through their existing state and camera handlers. Clock phase/angles are not overwritten from an AI snapshot; reset uses the existing rewind behaviour. Water changes reveal the Water layer, using the same conditions as the chart and scene.

The backend first reads `get_simulation_state` for every question. Other calls are selected by Gemma. Numeric summaries are produced from deterministic results; the final model prompt asks for a short qualitative interpretation rather than duplicating digits. A literal-number check withholds generated prose containing unsupported numerical values; it is an extra consistency check, not a proof of every sentence's semantics or historical accuracy. Inspect verified results and their provenance for quantitative conclusions. Bibliography URLs come from curated records, not generated links. Component catalogues and follow-up contexts are kept compact, while detailed purposes/evidence remain available through tools.

## Supported requests

| Exhibit | Approved capabilities |
| --- | --- |
| Chand Baori | Read site information/state/sources; raise or lower water; adjust supported environmental inputs; sample depth temperature; get profile; compare saved scenarios; calculate a hypothetical change without applying it; switch existing views/cameras; explain unavailable storage volume. |
| Wadokei | Read state/site/sources/component purpose and evidence; select/focus/isolate existing components; change existing views/cameras; start/pause/reset; adjust bounded symmetrical foliot weights; show the existing six-stage power-path tour. |

No arbitrary code, shell, filesystem, URL-fetch, weather, historical sensor, new-mesh or model-install tools exist. Wind/humidity effects, groundwater dynamics and water-air thermal coupling are unavailable. Water elevation does not establish volume. Wadokei is a single-foliot kinematic reconstruction, with illustrative gearing/strike mechanism and no simulated contact forces. Historical facts must remain tied to the existing inventory and bibliography.

## Failure behaviour and verification

Missing/invalid credentials, unavailable model, quota errors, timeout, unsupported arguments and stale replies have visible errors. They do not disable manual controls or invoke a local/other-model fallback. Transport and HTTP 5xx failures get one retry; authentication/quota failures are not automatically retried by the app. Google-provided retry delays are shown when available. Model metadata is cached for ten minutes after successful discovery. The adapter retains its loopback Host/Origin checks and bounded JSON body. Public hosting requires a separately secured Node service, authentication, request limiting and same-origin proxying; the development adapter is not a public multi-user API gateway.

`npm test` includes native-call orchestration, transactional failure, unknown tools, physical bounds, the existing foliot period curve and stale-state fingerprints. `npm run test:e2e` includes mocked tool transport, real model geometry, offline operation, phone layout and manual-control race handling. Mock tests spend no inference quota. `node --import tsx scripts/guide-live-smoke.mjs` is an explicit real-API browser check and consumes API quota; it reports actual results and fails if inference is unavailable. Executed outcomes belong in the verification report, not inferred from setup or model discovery alone.

The live script supports `YANTRA_LIVE_SECTION=well` or `clock` for independent checks (default `all`). It records actual calls/summaries and screenshots under `artifacts/`, and its test-only quota handling waits for the returned delay with at most two retries per question. This deliberate test behaviour is separate from the visitor UI. See [executed guide verification](GEMMA_VERIFICATION.md).
