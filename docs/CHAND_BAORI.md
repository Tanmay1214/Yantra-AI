# Chand Baori — water, stone & climate

An interactive environmental exhibit around [Chand Baori by siddharthbandhu](https://sketchfab.com/3d-models/chand-baori-0fec124478454f74be29a9bd3e5534b8), licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). This is an artistic MagicaVoxel interpretation with educational overlays. It is not a measured architectural survey, a calibrated microclimate model or a reconstruction of historical groundwater.

## Start and controls

Use Node 22+ and npm. `npm ci`; `npm run dev`; open http://127.0.0.1:5173/chand-baori. The museum homepage is at `/` and the clock is at `/wadokei`. The exhibit wordmark returns to the homepage. The dev command starts Vite on loopback port 5173 and the local agent adapter on 8787.

- Left drag orbits; wheel zooms; right drag pans. Overview resets the camera. Front, Top, Interior and Lower levels frame the model.
- Explore uses the fixed, reference-matched sandstone finish. Water adds the contained surface, waterline and submerged tint. Temperature shows computed colours. Cross-section clips half of a display copy. Environmental combines depth, water and temperature; Architecture exposes observation markers attached to sampled source surfaces. Creator-reference viewing, colour switching, and base-model inspection/upload controls are not part of the visitor interface.
- Clicking the source geometry inspects its actual mesh name, elevation and temperature estimate. The model is split by export/material limits; these names do not establish separately identified stairs, walls or galleries.
- Water elevation has a range slider, numeric field, ±1 m buttons, scenario presets and reset. Reset restores the selected scenario baseline. Invalid numeric entries show an error without changing the simulation.
- Outdoor temperature, hour, exposure and observation depth update the same temperature model consumed by charts, overlays and tools. Advanced parameters expose the deep estimate, characteristic depth, solar increment, study depth/scale and independent water temperature.
- Level ramp runs a hypothetical elevation change at one scenario day per animation second. Pause or change a condition to stop it. +1 day advances exactly one scenario day. Reset restores the baseline. This is an explicitly prescribed level trajectory, not a groundwater or rainfall simulator.
- Save up to eight local snapshots; compare A/B values and curves, inspect their inputs and apply either to the scene. Snapshots retain model version and timestamp in browser storage. They are not weather records.
- Guide shows hosted connection state, suggested questions, concise explanations, actual numerical results and changed controls. Sources and raw tool details are collapsed. No model picker or local inference runtime is required.

## Asset provenance and actual inspection

The user downloaded the authorised glTF archive from Sketchfab's signed-in Download 3D Model option. We retained the original archive at `reference/chand-baori-original.zip`. SHA-256: `F2333CD190197B62D3FD1CB78857D5619B07734A2178872401F3C3A65D2DE28F`.

Extracted originals are in `public/models/chand-baori/`: `scene.gltf`, `scene.bin` (6,419,648 bytes), `textures/palette_baseColor.png` (256×1 RGBA) and `license.txt`. These source files are unchanged. No restricted download was scraped. The API advertised legitimate download availability and CC Attribution; the unauthenticated download endpoint returned 401 until the user supplied the archive.

| Runtime mesh | Vertices | Triangles | Material |
| ------------ | -------: | --------: | -------- |
| Object_2     |   65,534 |    41,188 | palette  |
| Object_3     |   65,533 |    40,666 | palette  |
| Object_4     |   31,501 |    19,602 | palette  |

Total: 101,456 triangles, 162,568 exported vertices including duplicated face vertices. API vertex counts use a different consolidation convention. All three meshes have normals and UVs. They are children of `Chand Baori.obj.cleaner.materialmerger.gles`, under `Sketchfab_model`. No independently named historical components or animation clips are present.

The original root matrix rotates the voxel Z-up data into glTF Y-up and uniformly scales it by 0.009686644189059734. With that transform applied, bounds are approximately X/Z ±0.610258584 and Y 0 to 0.813678112. Runtime preserves this orientation. `node scripts/inspect-chand.mjs` reproduces the source inventory, root transform, bounds and used palette values.

All used palette samples have alpha 255. The exporter nevertheless assigned BLEND to the entire material, causing triangle sorting holes between the three mesh chunks. Runtime copies of the identified `palette` material use opaque depth writing; original materials/files, geometry and source normals are retained. The original palette remains in the preserved asset files; the visitor UI uses the fixed sandstone presentation.

### Surface finish

`src/heritage/heritageMaterials.ts` generates a shared deterministic 512×512 packed texture for sandstone-like grain, roughness, shallow relief and pores. It is projected onto all three source mesh chunks in world space: the source UVs address only a 256×1 palette, so reusing them for ordinary surface maps would stretch the texture. Palette indices distinguish stone, pale trim, soil, vegetation and accent regions. The default presentation uses restrained mineral/earth colours, muted vegetation, warm directional light, a full-model soft shadow frustum and a locally generated reflection environment. Water uses a shared 256×256 ripple normal map projected continuously across the basin cells and a nonmetallic translucent material.

These procedural surfaces are artistic presentation additions, not scanned stone, measured weathering, newly authenticated material assignments or new architectural geometry. No new texture downloads, licences, runtime packages or geometry replacement are needed. Simulation overlays are applied after the fixed surface finish so their colours still follow the computed temperatures and basin mask. Ripple normals affect only shading, not water elevation or fluid dynamics.

The sandstone base and pale trim colours were adjusted to warm ochre-brown and golden buff using the user's reference photograph. This colour-only match keeps the procedural grain, roughness, relief and other materials unchanged.

Attribution shown in the viewport and evidence panel:

> This work is based on “Chand Baori” by siddharthbandhu, licensed under CC BY 4.0.

Links to the source, author and licence are in the original `license.txt`. Runtime additions are view transforms, an illustrative metre calibration, temperature/water shaders, observation markers, cutaway clipping and auxiliary depth graphics.

For administrator recovery, extract the unchanged archive into `public/models/chand-baori/`, keeping relative buffers/textures. The app automatically loads `scene.gltf`. Missing/invalid files show an error with a Reload exhibit action; environmental controls remain usable. There is no visitor upload dialog, model inventory modal or embedded creator viewer. Source links and licence attribution remain in the evidence and footer.

## Coordinate system, datum and basin mask

Right-handed Y-up. The source bounding-box maximum Y becomes study elevation **0 m**, not a surveyed ground level. The lowest exposed surface in the central 60% of the top-envelope raster is taken as the artistic basin floor. The distance from the highest point to that surface maps to study depth D (default **24 m**, an illustrative input). X/Z are centered and the same scale applies in all directions. This keeps the air-study domain above the inferred source floor instead of extending it through the soil block's underside. Dimensions, surface area and depth samples remain conditional on that illustrative calibration. The source includes elevated structures, so 0 m is not necessarily the courtyard rim. The inferred artistic floor is not an archaeological or hydrological survey.

Depth z is positive downward, elevation h is negative below the datum. Water levels are bounded −D ≤ h ≤ 0. The qualitative column indicator is (D+h)/D, explicitly **not a volume fraction**. Selected source-surface elevations and marker locations come from the transformed asset; marker labels indicate depth zones rather than verified historical components.

Water boundary calculation:

1. Rasterise the actual transformed source triangles to a 64×64 XZ height field using barycentric interpolation, retaining the highest covered Y per cell.
2. Find the lowest covered cell in the central 60% of the footprint below the requested water elevation.
3. Flood-fill adjacent covered cells below that elevation. Reject a connected component reaching the raster boundary or uncovered cells.
4. Render accepted cells as one instanced horizontal water surface. A clearance of 0.02 model metres avoids z-fighting. Clipping applies in section mode too.
5. Approximate area = accepted cell count × cell width × cell length. This is a raster surface estimate in illustrative metres, not surveyed storage. Empty/rejected masks produce no surface and no area claim.

This conservative top-envelope method can underestimate cavities under roofs/galleries; cell boundaries approximate stairs and may omit narrow features. The original model's visual features are retained. It does not solve fluid pressure, flow, waves or water balance, and it does not calculate volume. No cubic-metre values or historical/current water levels are reported.

## Temperature equations and assumptions

Model version: `chand-empirical-1.0`.

```text
Ts = Tout + G E max(0, cos(π(hour − 12)/12))
T(z) = Tdeep + (Ts − Tdeep) exp(−z/L)
```

Tout is outdoor air temperature (°C); E is exposure fraction (0–1); G is maximum illustrative surface temperature increment (°C); L is characteristic depth (m). The first expression is a simple daytime envelope, not astronomical solar radiation or a heat-balance calculation. The second is an empirical shape selected for this demonstration, not a universal law of stepwells.

Defaults: Tout 36 °C, Tdeep 26 °C, G 4 °C, E 0.6, hour 14, L 8 m, D 24 m, sample depth 12 m, water elevation −16 m, independent water temperature 25 °C. **All are configurable demonstration values.** None is measured at Chand Baori or claimed as a historical mean. Presets labelled summer, cool season, drought and replenishment are hypothetical collections of these inputs.

The chart uses 49 depth samples. Surface colour uses the identical analytic expression and a fixed 15–50 °C legend. Out-of-scale colours saturate at the legend ends; numeric outputs retain their values. Architectural illumination affects perceived colour; the numerical chart is the reading reference. Deep temperatures can exceed the surface in cool conditions. Water temperature is user-configured and uncoupled from air. Moving the waterline changes the depth of the near-water air sample, not the air-temperature equation.

Optional elevation trajectory:

```text
h(t + Δt) = clamp(h(t) + r Δt, −D, 0)
```

r is a user-configured m/day rate. It is not derived from rainfall or inflow and cannot be converted to a volumetric flow without storage geometry. No humidity, wind, evaporation, infiltration or groundwater exchange term is represented; unsupported inputs are rejected. Hidden-tab delays are discarded/capped to avoid jumps. These demonstrations do not recover real elapsed weather time.

## Hosted Gemma 4 guide

Both exhibits use Gemma 4 through Google's hosted Gemini API, with one compact Guide tab each. No local inference runtime is used. Copy .env.example to .env.local and set GEMINI_API_KEY on the server; the configured hosted model must be available to that key. See [guide setup, tools, privacy and limitations](GEMMA_GUIDE.md) and the [recording timeline](DEMO_SHOWCASE.md).

The loopback Node adapter on port 8787 sends native function declarations, validates Gemma's requested tools, returns actual deterministic results to the model and receives its explanation. The browser replays the complete bounded transaction before changing controls and rejects stale replies. Numbers in result summaries are generated by application code. Sources and raw tool details are collapsed by default. Questions, context and tool results are sent to Google's API; credentials remain server-only.

The stepwell tools support the existing bounded conditions, temperature profile and samples, saved-scenario comparison, hypothetical calculations, sources, views and cameras. A water change reveals Water view. No storage-volume, live weather, sensor, wind/humidity or groundwater capability is invented. Area estimates are withheld after level/scale changes until recalculated. The model and its limitations remain the same as before the hosted guide integration.

## Architecture and checks

`src/heritage/HeritageApp.tsx` owns one input state, scene options and local snapshots; `src/guide/GuidePanel.tsx` owns the shared guide UI. `environment.ts` owns versioned equations/validation; `assetGeometry.ts` owns source inspection/raster/flood-fill; `HeritageScene.tsx` owns rendering and reversible cloned-material overlays; `heritageMaterials.ts` owns shared procedural textures/shaders; `useMonumentAsset.ts` owns import states; `agentTools.ts` owns environmental operations; `src/guide/tools.ts` adds shared exhibit/tool validation and dispatch. `server/heritage-server.ts` orchestrates hosted native calls through `server/gemma.ts`. Existing dependencies were reused; the build checks frontend and backend configurations.

```sh
npm test
npm run build
npm run test:e2e
node scripts/inspect-chand.mjs
```

For production QA: build, run `npm run preview -- --port 4173 --strictPort`, and run `node scripts/heritage-production-smoke.mjs`. Run `npm run agent` separately for the hosted guide adapter. The retained clock smoke script still checks `/wadokei`.

Tests distinguish actual source geometry, deterministic computations, mocked native-call orchestration, mocked HTTP transport and provider failure handling. Mock success is not real inference; the separate live smoke script consumes actual API quota. The codebase has no lint script. Git was initialised for the initial GitHub push; use the current diff and preserve original asset bytes during review.

## Historical sources and unresolved questions

- [Rajasthan Tourism — Dausa](https://www.tourism.rajasthan.gov.in/dausa.html): location and the three-sided criss-cross staircase layout.
- [Rajasthan Tourism — Chand Baori](https://www.tourism.rajasthan.gov.in/content/rajasthan-tourism/en/tourist-destinations/chand-baori.html): its attribution to ninth-century King Chanda, three stair sides and fourth-side pavilion, and water/social functions. These are attributed historical descriptions, not a count or dimension survey of the voxel model.
- [Ministry of Tourism — Abhaneri festival](https://utsav.gov.in/view-event/abhaneri-festival-2): early medieval architectural context and the associated Harshat Mata Temple.
- [ASI](https://asi.nic.in/) was consulted as a starting point; no applicable detailed ASI record was established for this implementation. No ASI-backed dimension/date or measured thermal claim is made.
- The creator describes the artistic asset as made in MagicaVoxel. Its claimed 5–6 degree cooling is not a documented temperature series and is not adopted as a measured result or model calibration.
- [Parmar & Mishra, Passive cooling techniques in medieval Indian stepwells, Frontiers of Architectural Research 13(6), 1447–1460, DOI 10.1016/j.foar.2024.03.014](https://journal.hep.com.cn/foar/EN/10.1016/j.foar.2024.03.014): architectural/passive-cooling research consulted for general context. No dimensions, temperature ranges or historical attributions from its comparative tables are silently adopted as this asset's calibration.
- [Sharmin et al., ICUC12-1020, DOI 10.5194/icuc12-1020](https://meetingorganizer.copernicus.org/ICUC12/ICUC12-1020.html): conference research on measured microclimate and thermal comfort in Jodhpur. Its study location differs from Chand Baori; no sensor observations are transferred to this exhibit.

No Rani ki Vav architecture, seven-level claim, UNESCO designation or river-course narrative is reused here. No independent site-specific scientific measurement dataset was established. Future calibration requires surveyed geometry, the meaning of source dimensions, a known courtyard/basin datum, observation positions and independently documented thermal/water data.
