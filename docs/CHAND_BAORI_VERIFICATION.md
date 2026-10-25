# Chand Baori verification — 25 October 2026

This report records checks actually run in `C:\Users\tanma\Documents\MLH` on Windows, Node 24 and installed Google Chrome. It does not establish historical survey accuracy, a calibrated thermal model or actual Gemma inference.

## Visitor control cleanup — 25 October 2026

Removed the creator-reference viewer, colour/finish switch and base-model inspection/upload dialog, including their handlers and styles. The reference-matched sandstone finish is fixed, and the installed monument loads automatically. Missing assets show an error and a reload action. Original source files and licence attribution remain preserved.

Executed after this change: `npm run build` passed; `npx playwright test e2e/heritage.spec.ts` passed **2/2**, including absence of the removed controls, actual geometry loading, environmental interactions and missing-asset recovery. Reviewed `artifacts/chand-explore.png` visually. An initial browser run exposed an ambiguous heading locator during loading; the locator now targets the page's level-one heading and the rerun passed. Unit tests and production smoke were not rerun for this cleanup. The earlier finish-switch verification below records previous behaviour and is superseded by this section.

## Surface finish update — 25 October 2026

Added shared procedural sandstone grain/roughness/relief, a muted mineral/earth palette, a continuous water-ripple normal map, locally generated reflections and a correctly framed full-model shadow light. The **Aged stone / Source palette** toggle restores the source colours without changing environmental inputs. These are artistic presentation textures, not photographic or archaeological surface records.

Executed after the update: `npm run build` passed both type configurations and production compilation; `npm test` passed **16/16**; `npx playwright test e2e/heritage.spec.ts` passed **2/2**. The browser scenario now verifies the reversible finish, unchanged simulation conditions, the shared 512-pixel texture and absence of GPU shader errors. The production smoke check also passed, including all modes, water, source-palette comparison, camera presets and a natural-material close-up.

The production run observed **106,346 rendered triangles, 55 draw calls, 60 FPS, 66 GPU geometries and seven textures** in its environmental view. Source geometry count and draw calls remain unchanged; the extra resources are shared texture/environment resources. These are session observations, not hardware guarantees. Original archive and all extracted geometry, palette, buffer and licence files were hash-verified unchanged.

New visual evidence includes `artifacts/chand-stone-detail.png` and `artifacts/chand-production-source-palette.png`; production overview/water captures show the updated finish. The original full-exhibit validation below is retained; this visual update reran the relevant heritage browser scenarios rather than claiming another full clock browser run.

## Original exhibit validation

| Check | Executed result |
| --- | --- |
| `npm test` | **16/16 passed**: nine environment/geometry/agent checks plus seven retained clock checks. |
| `npm run build` | Passed frontend and backend strict TypeScript checks and Vite production build. |
| `npm run test:e2e` | **4/4 passed**, final run approximately 1.3 minutes. Both clock and heritage interaction scenarios passed. |
| `node scripts/heritage-production-smoke.mjs` | Passed against port 4173: HTTP 200, actual local asset, three opaque display meshes, all modes, reversible clipping, water elevation change, enclosed basin mask and no uncaught page errors. |
| Local Ollama detection | Actual port 11434 connection refused; adapter truthfully reports offline with no installed tag claims. |
| Agent orchestration | A mocked Gemma plan executed validated tools; invalid plans were rejected atomically. Mocked browser transport applied a returned water-level change. These are **not real inference tests**. |
| Origin rejection | A non-local Origin sent to the loopback guide endpoint received HTTP 403. |
| Manual browser checks | Actual model, material correction, lower-level and overview navigation, level-rate input, +1 day, run/pause and baseline reset observed. |
| Asset integrity | Every extracted non-directory archive entry matched its original SHA-256 content. Original ZIP retained unchanged. |
| Retained clock integrity | Clock scene, mechanism, geometry, inventory, stylesheet and unit-test hashes match the preserved source project. Entry moved to a dedicated route; test/smoke URLs updated accordingly. |

## Browser coverage

Heritage tests load the actual supplied Chand Baori glTF and palette, verify three source meshes, reverse clipping, check six modes, operate water elevation, reject an invalid elevation, compare thermal outputs with shared calculations, orbit and zoom, use geometry-based observation markers, change camera presets, save/apply/compare scenarios, inspect evidence and offline AI, and check a 390-pixel portrait layout without horizontal overflow. A separate scenario intercepts the asset request to exercise recovery and uses an explicitly mocked guide response to verify state application.

The original clock scenarios continue to cover all 19 component records, real pointer selection, cameras, isolate, exploded view, regulation, connected motion, tour, sound audition, keyboard/pan and responsive layout.

An initial label teardown error during view changes was fixed by retaining stable label containers. Orbit drags initially also selected surfaces on release; pointer selection now ignores drag distance. An older five-second clock scene-ready assertion timed out during a concurrent cold build; it now waits up to 20 seconds for the actual ready attribute. The final suite passed independently after these corrections.

## Visual and performance observations

Reviewed captures include Explore, Water, Temperature/Environmental, Cross-section, comparison, portrait, Front, Top, Interior and Lower levels. The material's exported BLEND flag caused architecture sorting holes despite opaque used palette texels; display copies now write opaque depth. A basin mask now also constrains submerged tint, so the surrounding soil block is not portrayed as flooded. Interior/lower cameras use an exposed source surface rather than guessed points inside solid geometry.

The study-depth calibration ends at the inferred lowest exposed central source surface, keeping the analytical air domain above the source floor. The original soil block extends below that domain and source-surface inspections outside it are explicitly labelled unsupported.

The final production smoke observed approximately **106,346 rendered triangles, 55 draw calls and 61 FPS** in its environmental view, with 54 GPU geometries and three textures after mode changes. These are measurements of this test session, not a student-laptop guarantee or exhaustive memory-leak test. Vite retains the advisory for the approximately 704 KB uncompressed Three.js chunk; it is not a build error. The main heritage chunk is approximately 98 KB before compression, about 32 KB gzip, plus shared runtime and original model files.

## Retained visual evidence

- `artifacts/chand-production-explore.png`
- `artifacts/chand-production-water.png`
- `artifacts/chand-production-environment.png`
- `artifacts/chand-production-front.png`
- `artifacts/chand-production-top.png`
- `artifacts/chand-production-interior.png`
- `artifacts/chand-production-lower-levels.png`
- `artifacts/chand-section.png`
- `artifacts/chand-compare.png`
- `artifacts/chand-mobile.png`

## Remaining limits

No real Gemma response was generated: Ollama and an installed Gemma 4 tag remain a local setup prerequisite. No historical/current water observations, interior sensor records, groundwater model, storage volume integration, CFD, solar-ray/shadow thermal calculation, humidity/wind coupling, water-air heat transfer, archaeological component segmentation, independent survey calibration or rigorous collision sweep is claimed. The original artwork is voxel geometry. The metres scale and empirical environmental parameters remain explicitly illustrative. See [model notes](CHAND_BAORI.md) for equations, sources and reproduction instructions.

This project folder has no Git metadata. Review used scoped file inspection, preserved-source comparisons and original asset hashes; no Git diff or commit is claimed.
