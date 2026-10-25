# Verification — 25 October 2026

The current Chand Baori exhibit is covered by [Chand Baori verification](docs/CHAND_BAORI_VERIFICATION.md). The original Wadokei verification record below is retained for the clock at `/wadokei`.

This records checks actually executed against the completed implementation on Windows with Node 24 and installed Google Chrome. No historical authenticity or validated physical-dynamics claim follows from these tests.

## Executed checks

| Check | Result |
|---|---|
| `npm install` | Completed; npm audit reported zero vulnerabilities at installation time. |
| `npm test` | **7 / 7 passed**. Signed gear ratios, crown locking/release, rate adjustment, pause/reset, frame-rate invariance, large-delta clamping, safe runout, dial-derived strikes and complete inventory source references. |
| `npm run test:e2e` | **2 / 2 passed**, final run approximately 55 seconds, no uncaught page errors. |
| `npm run build` | TypeScript checking and Vite production build passed. |
| `node scripts/production-smoke.mjs` | Passed against production preview at port 4173: HTTP 200, WebGL mounted, 21 named groups, nine uniquely named toothed meshes, reversible interior/exterior, no uncaught page errors. |
| Production multi-angle review | Front, side, rear and top presets captured and visually inspected. |
| Final visual review | Exterior, open interior, X-ray, exploded assembly, escapement and foliot close-ups, and a 390-pixel portrait layout inspected. |

The first browser scenario exercises all five view modes; checks hidden/transparent housing and finite exploded transforms; selects/focuses/isolates parts; adjusts the foliot; starts, pauses and resets the clock; checks connected ratios and descent; operates every camera preset; orbits/zooms; toggles labels; visits all six tour steps; checks source links and seasonal presets; auditions the bell; and checks portrait overflow.

The second scenario selects **all 19 component records**, tests actual pointer raycasting in the viewport, isolates a component hidden by the interior mode, pans, uses the Space keyboard shortcut, expands/restores the viewport, and captures X-ray and escapement views. The first scenario also verifies that component labels remain below 32 screen pixels high at close zoom.

## Visual corrections made during verification

- Reframed the home view so the stand base clears the playback bar.
- Replaced repeated shutter bars with instanced geometry; merged fixed hardware by material within each selectable component.
- Fixed material shader invalidation when changing transparency. Confirmed that the housing actually becomes translucent in rendered output, not only in its JavaScript properties.
- Removed distance-based HTML label scaling and reserved separate portrait space for the heading, clock and controls.
- Raised the foliot and hanging regulator weights clear of the upper plate; extended its shaft and modeled its bearing opening.
- Added physical cord openings through the timber and movement plates.
- Extended bearing bridges to the support rails and suspended the bell from modeled arches and a crossbar.
- Gave every wheel and pinion a unique semantic mesh name, with tooth-count metadata.

## Performance and bundle observations

The final desktop browser scenario reported **252 draw calls and 101,442 triangles** in its close-up operating view. The same run reported about **56 FPS**; earlier runs ranged approximately 34–56 FPS, depending on view, test load and resolution. These are observations on this test environment, not a guaranteed laptop benchmark. Portrait/exterior renders were around 103,254 triangles. Geometry hidden by interior/isolation modes reduces rendered work.

The production output has approximately 504 KB of application/helper JavaScript and 703 KB of shared Three.js JavaScript before compression, about **158 KB + 181 KB gzip**, plus approximately 5.5 KB gzip CSS. Vite emits its informational >500 KB chunk-size advisory; this is not a build error. The exhibit uses no downloaded model, texture pack or HDRI at runtime.

## Retained screenshots

- `artifacts/production-exterior.png` — production build, initial exterior.
- `artifacts/interior.png` — separate movement and supporting hardware.
- `artifacts/xray.png` — genuinely translucent housing.
- `artifacts/exploded.png` — separated assembly.
- `artifacts/escapement.png` — guided power path and crown-wheel close-up.
- `artifacts/foliot.png` — regulator and adjustable weights.
- `artifacts/mobile.png` — portrait layout without horizontal overflow.
- `artifacts/view-front.png`, `view-side.png`, `view-rear.png`, `view-top.png` — production multi-angle captures.

## Limits of verification

No original downloadable asset was available, so its hidden internals, scale, mesh hierarchy and historical accuracy could not be authenticated. The public preview and metadata were inspected instead. No full swept collision proof, force/contact simulation, measured inertia calibration, historical dimension survey, acoustic validation or independent museum-curator review was performed. The bell linkage is a newly designed teaching mechanism. The single-foliot exhibit intentionally has no double-foliot selector or alarm. See README and the in-app evidence panel for reconstruction limits and bibliography.
