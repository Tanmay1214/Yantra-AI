# YANTRA

An independent digital museum of historical engineering, with two working exhibits. The editorial homepage at `/` introduces **Wadokei** and **Chand Baori** through their actual 3D scenes. Enter the Japanese clock at `/wadokei` or the Indian stepwell at `/chand-baori`. Each exhibit’s header returns to the archive. Unknown paths show a recovery page.

The homepage uses the existing charcoal, brass and sandstone visual language, responsive layouts and optional Google Fonts with system fallbacks. Its previews load near the viewport; they reuse existing scene builders rather than duplicate geometry or run new simulations. They can be rotated with the pointer; the full exhibit links also work by keyboard. The clock preview is paused. The stepwell preview retains the fixed sandstone finish and the original asset attribution.

`src/museum.ts` contains the configurable product name, descriptor and exhibit routes. `src/main.tsx` dispatches between separately loaded page entries; `src/home/HomePage.tsx` and `home.css` own the homepage, and `ExhibitPreviews.tsx` connects the existing scenes. No router package or new dependency is required. Static hosts must rewrite these document routes to `index.html`, as Vite does in development and preview.

**Chand Baori** is an environmental study built around the authorised CC BY 4.0 MagicaVoxel model by siddharthbandhu. It includes local 3D exploration, water-elevation and depth-temperature experiments, six view modes, source-mesh inspection and versioned scenario comparisons. Both exhibits include a compact **Guide** tab powered by hosted **Gemma 4 through the Gemini API**.

Run `npm ci`, copy `.env.example` to `.env.local`, and set `GEMINI_API_KEY` in that local file. Then run `npm run dev` and open `http://127.0.0.1:5173/`. The command starts Vite and the server-side guide adapter. The configured model is `gemma-4-26b-a4b-it`; `gemma-4-31b-it` is also supported when available to the key. No local AI runtime is used and no Gemini-model fallback is substituted. All manual exhibit controls remain usable if the API is unavailable. Never prefix the credential with `VITE_`, put it in frontend code, or commit `.env.local`.

Read [the guide architecture and controls](docs/GEMMA_GUIDE.md) and [the screen-recording timeline](docs/DEMO_SHOWCASE.md). In either exhibit open **Guide**, choose one of the suggested questions or type a request, and press Enter. Shift+Enter adds a new line. Verified numerical results and applied changes appear under the answer; sources and raw tool details stay collapsed. Conversation context lasts for the current exhibit page visit.

Read [Chand Baori setup, provenance, equations and limitations](docs/CHAND_BAORI.md) and [executed verification](docs/CHAND_BAORI_VERIFICATION.md). `npm test` and `npm run test:e2e` cover both exhibits. For production preview, run `npm run build`, `npm run preview -- --port 4173 --strictPort`, and `npm run agent` in a separate terminal. The frontend can be static, but the guide requires a Node backend holding the server secret. The supplied adapter binds to loopback for development/demo use; a public deployment needs an authenticated, rate-limited backend and same-origin routing rather than exposing this development service directly.

`npm run test:e2e` covers homepage entry/return navigation, actual preview assets, phone layout, unavailable paths and both exhibits’ interactions. Production checks: `node scripts/home-production-smoke.mjs` and the exhibit smoke scripts target the preview on port 4173. See [homepage verification](docs/HOMEPAGE_VERIFICATION.md) for checks actually run. The original Wadokei documentation follows.

# TOKI · Wadokei object study

An interactive reconstruction of an **early single-foliot, weight-driven Japanese lantern clock**, built with React, TypeScript, Three.js, React Three Fiber and Drei. The exhibit presents documented operating principles using explicitly reconstructed geometry. It is not a digital scan, an authenticated replica of an individual museum object, or a validated physical simulation.

## Run

Requires Node.js 22+ and npm.

```sh
npm install
npm run dev
```

Open the URL printed by Vite (normally http://127.0.0.1:5173). Manual clock controls need no accounts or API keys; the optional Guide uses the server-side API setup above. For production: `npm run build`, then `npm run preview`. `dist/` is a static frontend; the Guide additionally needs its Node service. Optional Google Fonts have local serif/sans fallbacks. The clock model, materials and lighting require no remote assets.

## Controls

- Left-drag: orbit; scroll: zoom; right-drag: pan.
- Exterior: assembled housing. Interior: shutters and dial hidden. X-ray: transparent housing. Exploded: parts separated along assembly axes. Operating: housing ghosted and the power chain highlighted.
- Front, side, rear and top presets; the circular-arrow button resets the camera.
- Click a part or select it in the subsystem index. The record identifies its input, output, motion and evidence. Focus moves the camera; Isolate shows that component group alone.
- Play/Pause or **Space** controls the connected movement. Reset rewinds the weight, clears the model day and pauses. Speed ranges from 0.25× to 24×. The clock stops when the weight reaches its safe travel limit.
- The foliot slider moves both weights symmetrically and changes the beat period. Outward is slower. These settings are not a historical calibration.
- Labels and the power-path highlight can be toggled independently. The six-step tour follows gravity, transmission, escapement, regulator, display and bell.
- Evidence includes a seasonal comparison. Day/night buttons are **manual teaching presets for the same single foliot**, not a double-foliot selector or an astronomical calculation.
- Sound is opt-in. The help panel offers a synthetic bell audition with a visible hammer movement. No audio is downloaded.
- Escape closes help and exits isolation. Expand temporarily gives the viewport the full available width.

## Asset inspection and provenance

The original workspace contained unrelated PDF outputs and no frontend project. A file inventory found no GLB, glTF, FBX, OBJ, STL or Blender Wadokei assets in the workspace or Downloads. Those unrelated files were retained.

The supplied [Sketchfab model by Petaru](https://sketchfab.com/3d-models/japanese-clock-wadokei-f14aacb496bc41619c3c522e1fc26bdf) has public metadata reporting `isDownloadable: false`, 16,970 vertices and 31,605 faces. Its public preview shows an ornate architectural enclosure. **No source mesh was available**, so actual mesh names, transforms, normals, materials, hidden components, internal mechanism or bounding box could not be inspected or authenticated. No model geometry or PBR textures were extracted, imported or discarded.

`reference/sketchfab-preview.jpg` and `reference/jcwa-single-foliot.jpg` are research previews from their respective source sites, retained with source URLs here. They are not runtime assets and are not copied to `dist/`. Copyright remains with the respective sources; no redistribution rights are asserted. All runtime geometry, ornament and textures were created procedurally for this exhibit. There is no source-mesh mapping because no source mesh was imported.

The selected early single-foliot type follows the **JCWA early lantern-clock example**, rather than copying the Sketchfab enclosure or combining it with the Seiko double-foliot mechanism. JCWA documents a rotating dial, fixed pointer, bell and manual dawn/dusk weight adjustments for that family. Seiko's double-foliot clock is included only as a comparison source. A pendulum, balance spring, automatic double-foliot selector and alarm were deliberately not added to this chosen variant.

## Geometry and coordinate system

Right-handed Y-up scene; front is +Z. The brass movement occupies approximately X ±1.3, Y 3.65–6.85, Z ±1.1. The bell and finial rise to about Y 7.45. A separately modeled timber teaching stand supports it. **All model units and proportions are estimated; they do not represent measured historical dimensions.** The JCWA artifact measurements were not silently applied to a different assembly.

Major selectable groups (19): stand, frame, shutters, rotating dial, fixed indicator, dial motion-work, going weight, winding drum/cord, great wheel, second wheel, third wheel, crown escape wheel, verge, foliot, adjustable weights, bearings/bridges, bell, demonstration cam, hammer/linkage. The three shutters are separately named scene groups sharing one component record. Steel shafts, bushings, collars, slotted fasteners, frame pins, modeled floral relief, bevels, winding grooves and physical lattice members supply close-up detail.

`src/inventory.ts` is the source-backed component inventory: historical/mechanical role, what drives it, what it drives, source, geometry status, dimension status, inspection position and exploded offset. It powers both the hierarchy and inspector. Every part's evidence distinguishes documented features from inferred or newly designed geometry.

## Mechanical model

One mutable simulation state is the single source of truth. Scene transforms read it each frame; UI readings sample it without regenerating the scene. All going-train arbors lie along Z. Compound wheels are staggered in depth; pitch-center spacing is derived from the selected tooth counts and module.

| Stage | Driving teeth | Driven leaves | Signed ratio |
|---|---:|---:|---:|
| Great → second arbor | 48 | 12 | −4 |
| Second → third arbor | 40 | 10 | −4 |
| Third → escape arbor | 36 | 10 | −3.6 |
| Great arbor → dial motion-work | 32 | 32 | −1 |

The crown has 15 axial teeth. Its angle is gated through alternating pallet releases: half a tooth pitch per half oscillation, one tooth per complete oscillation. Each arbor's coordinate is solved backward through the exact signed ratios. The dial follows its 32:32 pair. The weight drop is `abs(greatAngle) × drumRadius` with an illustrative drum radius of 0.22 model units. It cannot descend independently of the train. The drum cord follows its right-hand tangent through a guide to the hanging eye.

The foliot/verge angle follows a prescribed alternating cycle. Beat duration uses `0.94 × sqrt((0.12 + 2r²) / (0.12 + 2×0.76²))` seconds as an **illustrative inertia-based rate curve**, not a natural-period equation for a real foliot. A foliot is not a spring-restored harmonic oscillator. Forces, pallet impulses, friction, recoil and amplitude-dependent rate are not solved.

A model day is one dial revolution, divided into twelve temporal-hour positions. It is intentionally accelerated and is not tied to wall-clock time. The chapter ring carries the verified repeated 九 八 七 六 五 四 sequence; its fine divisions and floral ornament are original interpretations.

### Bell mechanism boundary

A bell is supported by the selected reference, but its exact strike/count-wheel train is not established by the supplied evidence. The visible twelve-lobe cam, follower, lifting rod and pivoted hammer are therefore **new educational design**, consistently labeled in the UI and inventory. One demonstration strike occurs at each model hour, with a hammer lift before release. Authentic descending Japanese strike counts, a separate striking train, historical release sequencing and alarms are not claimed. Audition is a separate visitor control. Sound is synthesized and is not an acoustic recreation of the artifact.

### Stability and performance

Movement advances from delta time; large deltas are capped at 50 ms, and the first frame following visibility change is discarded. Hidden-tab stalls do not accumulate a huge catch-up jump. This favors continuity over recovering elapsed real time after a long stall. View-mode transitions use independent damping. Reset restores the original phase and stops the movement; current speed and weight setting are retained.

Shared geometry/materials, instanced shutter lattice and static hardware merged by component/material reduce draw calls. Moving arbors and adjustable weights remain separate. Pixel ratio is capped at 1.5, shadow maps at 1024²; lighting uses a locally generated environment. No large HDRI or texture downloads are required. Live FPS and render triangle counts are available in the footer tooltip. Performance depends on device/browser/GPU; software rendering is not a representative student-laptop benchmark.

## Architecture

- `src/geometry.ts`: toothed wheel/crown/bell geometry, wood/brass/dial textures, material palette and arbor centers.
- `src/WadokeiScene.tsx`: exterior and mechanical component builders, named selectable groups, reversible exploded/opacity transitions, camera director, lights and central frame update.
- `src/mechanism.ts`: metered phase, signed gear ratios, foliot rate, weight travel, display, strike events, pause/runout/reset state.
- `src/inventory.ts`: component inventory, bibliography and guided-tour content.
- `src/main.tsx`: page entry dispatch; `src/wadokei-entry.tsx`: clock interface, inspector, seasonal explanation, controls, synthesized sound and readonly QA snapshots.
- `src/styles.css`: responsive exhibit layout, accessible controls and restrained museum palette.
- `tests/simulation.test.ts`: deterministic mechanical and provenance checks.
- `e2e/exhibit.spec.ts`: browser interaction acceptance scenario and screenshots.

## Verification

```sh
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

The browser test uses the actual local application and WebGL scene. It checks named geometry, modes and material opacity, isolation, inspector records, camera movement, orbit/zoom, regulator setting, pause/reset/start, connected ratios and descent, all tour steps, source links, seasonal presets, bell audition, responsive overflow and uncaught page errors. It records screenshots to `artifacts/`. The deterministic tests cover ratios, locking/release, foliot setting, frame-rate consistency, tab-stall clamping, pause/reset, runout, hour events and inventory provenance.

Browser QA defaults to installed Google Chrome in a clean temporary testing profile. Set `PLAYWRIGHT_CHANNEL=msedge` to use installed Edge, or `PLAYWRIGHT_CHANNEL=chromium` for Playwright's downloaded browser. This Windows environment could not launch the downloaded full Chromium executable; installed Chrome completed the test normally. No user's browser profile is opened by the tests.

See `VERIFICATION.md` for the checks actually run on this build, results and any limitations. A script existing does not by itself mean that its checks passed.

For an additional production smoke check, run `npm run preview -- --port 4173 --strictPort` in one terminal and `node scripts/production-smoke.mjs` in another. This checks the compiled output and saves front/side/rear/top captures.

## Known approximations

1. This is a coherent explanatory single-foliot clock, not a replica of a named maker's movement or the unavailable Sketchfab asset.
2. Proportions, mass, materials' patina, stand, joinery, floral relief, shutter openwork, bearing design and detailed fastener profiles are inferred or newly designed. No maker's signature or exact historical dimensions are fabricated.
3. Ratios and gear positions are illustrative. Teeth have beveled straight flanks; they are not manufacturing-grade conjugate tooth profiles. Contact clearances have been visually reviewed, not proved by a full collision sweep.
4. Crown/verge movement teaches alternating locking and release. Real contact dynamics, recoil, losses and elastic deformation are omitted. The foliot waveform and rate curve are prescribed.
5. The dial advances from the train, but the simulation is an accelerated model day. Seasonal presets explain unequal hours without calculating local sunrise or changing the oscillator twice daily automatically.
6. The bell train is explicitly simplified; one strike is demonstrated, not the historical count sequence. No alarm mechanism is included.
7. Interior mode hides the shutters and front dial as an exhibit aid; it does not assert that the original case opened in precisely that way. Exploded offsets and isolation are modern teaching tools.
8. Sound uses synthesized partials. Procedural texture maps approximate aged wood and brass rather than reproducing museum surface scans.

## Bibliography

1. [Japan Clock & Watch Association — The World of Japanese Traditional Clock](https://www.jcwa.or.jp/en/etc/wadokei.html). Early single-foliot example, temporal hours, rotating dial/fixed pointer, weight adjustment, and differences between clock families.
2. [The Seiko Museum Ginza — Lantern Clock with Double Foliot Balance](https://museum.seiko.co.jp/en/collections/traditional_Japanese_clock/collect001/). Used to distinguish double-foliot switching from the chosen single-foliot design.
3. [University of Oxford, Cabinet — Key innovation: the escapement](https://www.cabinet.ox.ac.uk/key-innovation-escapement-0). Weight drive, crown wheel, verge/pallet sequence and foliot adjustment.
4. [Museo Galileo — Mechanism for a bell tower clock with verge escapement and foliot](https://mostre.museogalileo.it/motoperpetuo/en/after-leonardo/between-uncertainty-and-fraud/mechanism-for-a-bell-tower-clock-with-verge-escapement-and-foliot.html). Horizontal crown arbor and vertical two-blade verge.
5. [Petaru — Japanese clock (和時計) Wadokei](https://sketchfab.com/3d-models/japanese-clock-wadokei-f14aacb496bc41619c3c522e1fc26bdf). User-supplied visual reference; public preview/metadata only, no model files reused.

Research access: 25 October 2026. Kyoto University resources were searched, but no applicable mechanism/geometry source was established; no Kyoto-backed construction claim is made.
