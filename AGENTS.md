# Yantra AI — Wadokei exhibit agent instructions

## Current project extension: Chand Baori

The main route `/` serves the **YANTRA** museum homepage. Chand Baori is at `/chand-baori` and the clock at `/wadokei`; the clock-specific instructions below apply to that exhibit. Do not apply Japanese clock history or mechanics to the stepwell.

- `src/main.tsx` dispatches to the homepage, `src/heritage/HeritageApp.tsx` or `src/wadokei-entry.tsx`. `src/museum.ts` owns the shared identity/routes. `src/home/` owns the editorial homepage and lazy previews of the existing scenes; keep rendering and numerical logic in their existing modules. The exhibit wordmarks link home. Unknown paths render a recovery page. Existing clock scene, simulation and styles stay separate.
- `src/heritage/environment.ts` owns bounded deterministic environmental calculations and versioned scenarios; `assetGeometry.ts` owns asset inventory and top-envelope basin masks; `HeritageScene.tsx` owns reversible overlays and cameras. `useMonumentAsset.ts` loads the original glTF without editing it. Keep numerical results shared between controls, charts and approved AI tools.
- The authorised CC BY 4.0 asset is `public/models/chand-baori/scene.gltf` with its buffer, palette and licence. Preserve `reference/chand-baori-original.zip` unchanged. Credit “Chand Baori” by siddharthbandhu. It is a MagicaVoxel interpretation, not a survey. Do not invent separate component names for its three material-split meshes.
- Metre scale is explicitly illustrative: source highest point is datum 0 m, and its lowest exposed central raster surface maps to the configurable study depth using uniform scaling. The soil block underside is excluded from the air-study domain. No historical/current water level, measured cooling, groundwater model, storage volume or live observation is claimed. A top-envelope raster/flood fill supports approximate surface area only where an enclosed mask exists. This is not volume integration or fluid dynamics.
- The user explicitly selected hosted Gemma 4 through the Gemini API. `server/gemma.ts` discovers the configured hosted model and keeps `GEMINI_API_KEY` in server-only `.env.local`; never expose it through Vite or Git. No Ollama/local inference or Gemini-model substitution is allowed. `server/heritage-server.ts` bounds native function-calling rounds and validates tool arguments. `src/guide/tools.ts` owns shared validation/dispatch for both exhibits; `GuidePanel.tsx` owns the compact shared UI. Replay a complete validated transaction and discard stale replies before changing live controls. Never introduce arbitrary execution, filesystem tools, unrestricted proxies, invented measurements or unsupported model capabilities. Keep manual controls usable offline; mock success is not proof of real inference. See `docs/GEMMA_GUIDE.md`.
- `npm run dev` starts Vite and the local agent service. `npm run agent` starts only the service. `npm test` includes environmental/geometry/agent unit checks; `npm run test:e2e` includes the homepage and both exhibits. Keep smoke scripts targeting the correct routes: `scripts/production-smoke.mjs` for `/wadokei`, `scripts/heritage-production-smoke.mjs` for `/chand-baori` and `scripts/home-production-smoke.mjs` for the homepage. Verify entry/return navigation and 390-pixel layouts after shell changes.
- Read `docs/CHAND_BAORI.md` for equations, provenance, setup and limitations. Update it when the environmental model changes. Relevant task instructions take precedence over the older clock-only scope below.

## Scope and repository layout

This directory is the application root. Run application commands here. The museum identity is **YANTRA**, while the clock retains its **TOKI · Wadokei object study** title. The npm package remains `wadokei-exhibit`. The shared hosted Gemma service is documented above; preserve the separate exhibit simulations and do not rename package/clock identifiers without a task requiring it.

Read this file and any applicable nested `AGENTS.md` before editing. No nested agent instructions were present when this file was created. Inspect `git status --short` first: the application and unrelated directories may be untracked user work. Untracked does not mean disposable. Never reset, clean, stage everything, or overwrite unrelated changes.

## Product and historical boundary

Build an explorable digital museum object inspired by Mechanica Museum: detailed exterior, separate internal components, coherent operation, camera controls, reversible interior/X-ray/exploded views, component inspection, guided power flow, and visible evidence labels. Preserve the working exhibit; a static model viewer, decorative animation, or unrelated spinning gears is not an adequate replacement.

The implemented variant is an **early single-foliot, weight-driven lantern clock**, following the JCWA example. It uses a rotating chapter ring and fixed pointer, a crown-wheel/verge escapement, and manually adjustable foliot weights. It is a procedural explanatory reconstruction, not a scan, an authenticated replica, or a validated force simulation.

- Start historical investigation with [JCWA](https://www.jcwa.or.jp/en/etc/wadokei.html) and [Seiko Museum](https://museum.seiko.co.jp/en/collections/traditional_Japanese_clock/collect001/). Seiko's cited object is a **double-foliot comparison**, not evidence for adding its selector to this single-foliot model.
- Use primary or authoritative sources for new claims. Existing escapement sources are in `src/inventory.ts` and `docs/WADOKEI.md`. Consult Kyoto University Museum resources when relevant, but no applicable Kyoto mechanism source is currently established; do not imply otherwise.
- Preserve the distinction between a documented operating principle, inferred geometry, and newly designed exhibit features. Record source and reconstruction/dimension status in each component's inventory evidence and update the README when claims change.
- Never present invented measurements, tooth counts, ratios, inscriptions, material choices, or linkages as historical facts. Investigate, leave unspecified, or explicitly label an approximation. A source supporting a general principle does not authenticate the modeled geometry.
- Do not assume every Wadokei has two foliots. Do not add automatic day/night switching, a pendulum, a balance spring, or an alarm without evidence for an explicitly selected variant and a documented scope change. Explain any deliberate combination of designs.
- Temporal time divides daylight and night into six hours each. Existing day/night buttons are manual teaching presets for the **same** foliot, not an automatic selector or sunrise calculation. The repeated dial sequence is 九 八 七 六 五 四; do not invent maker inscriptions.
- A bell is documented, but this exhibit's twelve-lobe cam, rod, hammer linkage, single strike per model hour, and synthesized sound are educational designs. Do not describe them as an authenticated striking/count-wheel train or historical acoustic recreation.

## Confirmed stack and ownership

The manifest and npm lockfile establish React 19, TypeScript 5.7 with strict checking, Three.js 0.179, React Three Fiber 9, Drei 10, Vite 6, and Lucide icons. UI styling is plain CSS with no component-library framework. The shared Node backend handles the user-authorised hosted Gemma integration. Use the existing npm lockfile as the dependency authority rather than assuming version ranges are exact installed versions.

Application paths throughout this document are relative to this project root.

| File | Responsibility |
| --- | --- |
| `index.html`, `src/main.tsx` | React entry, museum interface, shared simulation reference, inspector, playback, selection/view options, seasonal explanation, audio and error boundary |
| `src/WadokeiScene.tsx` | Component builders, `Part` selection/material handling, `Moving` transforms, `Assembly` frame update, camera `Director`, orbit controls, lighting and view transitions |
| `src/geometry.ts` | Reusable gear/crown/bell geometry, procedural textures, shared PBR palette and arbor centers |
| `src/mechanism.ts` | `Simulation`, `TRAIN`, `poseAt`, `beatPeriod`, `advance`, view and camera types |
| `src/inventory.ts` | Component records, stable IDs, sources, evidence, inspection/explosion positions and guided tour |
| `src/styles.css` | Responsive museum layout, labels, typography and controls |
| `tests/simulation.test.ts` | Node test runner via `tsx`: mechanical invariants and inventory evidence |
| `e2e/exhibit.spec.ts` | Playwright interaction tests, WebGL state assertions and screenshots |
| `scripts/production-smoke.mjs` | Built-site smoke check and multi-angle screenshots |
| `README.md`, `docs/WADOKEI.md`, `VERIFICATION.md` | Project overview, detailed clock provenance/limits, and dated results actually obtained |

Preserve these boundaries. Keep physics/kinematics independent of React and UI text in the inventory where shared. Avoid new duplicate stores, parallel model loaders, unexplained constants, unnecessary abstractions, or framework migrations. Existing scene/UI files are large: extract cohesive components when a task warrants it rather than expanding unrelated responsibilities or performing a wholesale rewrite.

Use typed props and existing `Simulation`, `ExhibitOptions`, `ComponentRecord`, `ViewMode`, and `Preset` contracts. Inventory IDs are currently string-based; validate lookup inputs rather than assuming TypeScript proves an arbitrary ID exists. When adding a component, add its inventory record, named scene group, mechanical mapping if moving, inspection position, explosion offset, and relevant test coverage together.

## Assets, geometry and coordinates

No GLB, glTF, FBX, OBJ, STL or Blender source asset is present in the application. Runtime geometry, materials and environment are procedural. `reference/jcwa-single-foliot.jpg` and `reference/sketchfab-preview.jpg` are research images, not runtime assets; `artifacts/` contains QA screenshots. There is currently no `public/` asset tree or imported-model loading pipeline.

The supplied [Petaru Sketchfab model](https://sketchfab.com/3d-models/japanese-clock-wadokei-f14aacb496bc41619c3c522e1fc26bdf) was recorded as non-downloadable in the project research. No geometry was extracted or reused. Its hidden meshes, transforms, materials and internals were not inspected. Do not claim otherwise or bypass access restrictions. Recheck availability and licence before any future reuse. Research previews do not carry asserted redistribution rights; do not ship them as production assets without permission/licensing evidence.

- Preserve and reuse suitable existing geometry. For a future imported asset, retain the untouched original, record author/source/licence, inspect mesh names, transforms, scale, orientation, normals, materials and bounding box, and map source meshes to inventory IDs before editing. Distinguish original exterior from newly reconstructed internals. STL alone does not establish assembly hierarchy, materials or positions.
- Coordinates are **right-handed, Y-up, front +Z**; going-train arbors run along Z. Units are illustrative model units, not meters or authenticated measurements. The movement occupies roughly X ±1.3, Y 3.65–6.85, Z ±1.1; the finial reaches about Y 7.45. Preserve this convention and update camera/inspection/explosion data if scale changes.
- Keep major assemblies independently selectable and moving elements separate. The present baseline has 19 inventory records, 21 named groups (three shutters share `panels`), and nine named toothed meshes. These are test expectations, not a prohibition on deliberate additions.
- Follow stable lowercase semantic names, such as `going-great-wheel-48`; retain `userData.componentId`, gear role and tooth-count metadata used by inspection/QA. Avoid anonymous major meshes.
- Model teeth, axles, hubs, bearings, pallets, cord openings and other mechanically important features as geometry. Decorative textures must not substitute for functional structure. Inspect supports, clearances, depth planes and cord routing from front, side, rear, top and close-up views; avoid floating shafts and intersecting gears.
- Derive gear-center distances from pitch radii/module, and keep compound-wheel depth planes consistent. Current beveled straight-flank teeth are illustrative, not manufacturing-grade conjugate profiles.
- Share geometries; instance repeated details and batch static hardware only within its selectable component. Never merge moving arbors or sliders into fixed hardware. Dispose owned resources on cleanup without disposing shared resources still in use.
- Keep per-component material ownership so selection/transparency cannot leak into other parts. Preserve `material.needsUpdate` when changing the transparent flag: opacity alone previously left the rendered housing opaque.
- Preserve the current 1.5 DPR cap, 1024-square shadow maps and locally generated environment unless measurements justify a change. Compare draw calls, triangles, frame rate and resource growth before/after substantial visual additions. Recorded ~252 draw calls/~101k triangles are observations, not universal performance budgets or guaranteed laptop FPS.

If imports become necessary, establish and document a portable asset location and loading strategy first. Use Vite-compatible paths, cache loads, show loading/failure states and test missing files. Do not introduce workstation-absolute asset paths or silently fall back to an unrelated clock. Preserve the existing scene-ready UI and WebGL error boundary.

## Connected simulation invariants

`App` owns one stable mutable simulation reference. `Assembly` calls `advance` once per frame; render components read it and UI readings are sampled. Do not advance independent clocks from individual meshes, React state updates, or additional animation timers. Per-component frame callbacks for rendering transforms are fine; independent phase accumulation is not.

Preserve the causal explanation: weight/drum supply power → train transmits it → escapement meters release ↔ foliot controls timing → dial displays simulated time → demonstration strike follows dial events. The implementation solves a kinematic pose, not forces.

- Current illustrative transmission is 48:12, 40:10, 36:10, with signed escape/great ratio −57.6. Dial motion-work is 32:32, so `dial = -great`. Update geometry, `TRAIN`, animation, inventory, explanations and tests together when changing counts or ratios.
- The 15-tooth crown advances half a tooth per half oscillation, one tooth per full oscillation, with a locked interval and controlled release. Keep verge and foliot coordinated; do not turn the escape wheel continuously like a motor.
- Weight travel is `abs(great) * TRAIN.drumRadius` (currently 0.22 model units), with safe runout at `MAX_DROP` (1.05). Weight, cord, drum and train must pause/run out together.
- Adjustable weights move symmetrically; farther from the pivot increases inertia and slows the illustrative beat. `beatPeriod` is a teaching curve, not a validated natural-period equation for a real foliot.
- Use seconds of delta time. Retain the 50 ms advance cap and first-frame discard after visibility changes; avoid hidden-tab catch-up jumps. This intentionally does not recover wall-clock time lost during stalls. Reject non-finite input and keep transforms finite.
- Reset rewinds phase/travel and clears strikes, pauses movement, and retains the chosen speed/radius. Preserve the separate explicit bell-audition behavior, which may move the hammer while paused.
- Derive display and strike events from simulation phase, not unrelated timers. Avoid unbounded per-frame history/allocation or accumulating transforms. Do not add random motion to make the model look active.

## Interaction and visual contract

- Preserve orbit, wheel zoom, right-drag pan, home/front/side/rear/top presets and focused inspection. Camera requests use the existing preset/version state; keep selection and isolation coordinated with view changes.
- Maintain the five working modes: exterior, interior, X-ray, exploded and operating. Interior hides housing/dial rather than cutting geometry; X-ray is the present cutaway alternative. Do not claim a true clipping-plane cutaway already exists.
- Compute explosions from assembled transforms plus offsets; never repeatedly add offsets to live positions. Transitions must smoothly reverse without orientation drift or losing components.
- Selection must work through viewport raycasting and the hierarchy, show the correct name/purpose/input/output/evidence/motion, and highlight the chosen part. Isolation must reveal even a selected housing part hidden by interior mode.
- Preserve the six-step power tour, labels, path highlighting, foliot slider, playback/reset and optional sound. Every visible control needs working behavior. Keep sound opt-in and keyboard shortcuts from interfering with form input.
- Keep the warm charcoal, restrained brass/wood museum presentation and readable contrast. Labels must remain readable without growing huge on zoom. Validate both desktop and 390-pixel portrait layouts, keyboard access, meaningful control names, and unobstructed viewport controls.

## Validation commands and acceptance

Use Node 22+ and npm as documented. From this project root, use `npm ci` for a clean lockfile install when needed; inspect dependency changes and lifecycle scripts before installing unfamiliar packages. Do not reinstall merely to edit documentation.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite at `http://127.0.0.1:5173`, strict port |
| `npm test` | Deterministic simulation and provenance checks |
| `npm run build` | `tsc -b` followed by the production Vite build |
| `npx tsc --noEmit` | Optional focused source type check using the installed compiler |
| `npm run test:e2e` | Playwright; starts/reuses local port 5173 |
| `npm run preview -- --port 4173 --strictPort` | Serve the already-built output for production QA |
| `node scripts/production-smoke.mjs` | Run in another terminal against that production preview |

There is **no lint script/configuration** currently. Do not claim lint passed or invent a command. TypeScript's configured scope is `src/`; passing the build does not independently type-check all test scripts.

Playwright defaults to installed Chrome. Set `PLAYWRIGHT_CHANNEL=msedge` or `chromium` when appropriate; the latter needs a Playwright browser installation (`npx playwright install chromium`). In PowerShell use `$env:PLAYWRIGHT_CHANNEL = 'msedge'`. Confirm a reused server is this app, not another process on port 5173. Tests write screenshots to `artifacts/`; review resulting changes intentionally.

Choose checks according to the change:

- Documentation-only: reread the file, verify referenced paths/scripts and review the diff. Application tests are unnecessary unless executable behavior changed.
- Simulation/inventory: run unit tests and build; run browser checks when motion, controls, geometry or visible claims change. Test signed ratios, locking/release, regulator adjustment, frame-rate consistency, pause/reset, runout and dial-derived strikes.
- Scene/UI: build, run end-to-end tests and inspect actual rendered views. Verify selection, focus/isolate, cameras/orbit/zoom/pan, all modes, reassembly, labels, guided flow, playback and responsive layout. Assert rendered transparency, not only JavaScript opacity values.
- Geometry/material/performance: review multi-angle and close-up captures across the operating cycle; inspect interference and compare frame/render metrics. Check repeated mode changes/mounts for resource growth. No automated full collision sweep or memory-leak proof currently exists.
- Asset loading changes: test slow/missing/invalid assets and usable failure states; the current procedural exhibit has no external model dependency to exercise.
- Production/deployment-affecting changes: build and run the production smoke check, inspect console/errors and output. The existing >500 KB Vite chunk advisory is not a test failure, but investigate material bundle regressions.

Preserve `window.__wadokei.snapshot()`, its selection hook, `window.__wadokeiScene()`, stable component IDs and `data-testid` contracts used by tests, or update consumers deliberately. Snapshots are QA evidence, not substitutes for visual inspection.

Report only checks actually run, their results, and remaining gaps. Dated successes in `VERIFICATION.md` do not establish that a new change passes. Do not equate passing browser tests with historical authentication, force validation, complete collision freedom, or guaranteed laptop performance.

## Repository safety and documentation

- Make the smallest task-focused change. Check existing dependencies before adding packages; explain the need and update manifest/lockfile together if required. Do not execute uninspected downloaded scripts or introduce hosted AI/external APIs without an explicit product need.
- Never commit credentials, API keys, secrets or local environment files. Preserve original assets and user work; justify any destructive asset replacement explicitly. Public visibility does not grant an asset licence.
- Respect `.gitignore`: keep `node_modules/`, `dist/`, test output and TypeScript build caches out of version control. Existing retained QA screenshots are distinct from deployable assets; include only intentional changes. Do not publish research reference images automatically.
- Update `README.md` for changes to controls, architecture, variant, component roles, asset provenance/licences, simulation limits, installation or testing. Update `src/inventory.ts` for component/source claims and `VERIFICATION.md` with newly executed validation where relevant. Keep agent workflow rules here instead of copying this entire file into the README.
- Known limits to retain until genuinely resolved: estimated dimensions/material appearance, illustrative gearing/teeth, prescribed foliot/verge dynamics, no force/contact/recoil model, no measured seasonal calibration, simplified striking, no authenticated source mesh, no automatic double-foliot selector or alarm.

## Working sequence

1. Read applicable instructions, inspect status, relevant code/assets and current documentation.
2. Identify the smallest change and the historical/mechanical invariants it touches.
3. Implement within the established boundaries; for large tasks deliver working, testable stages. Do not stop at a plan when implementation is requested.
4. Run the relevant checks and inspect rendered output where visual behavior changed; fix failures before declaring completion.
5. Review diffs and untracked files for accidental edits, generated output and secret/asset issues. Update documentation affected by the change.
6. Report the concrete result, actual verification and unresolved limitations. Do not invent evidence or conceal incomplete work.
