# Graph Report - Yantra-AI  (2026-10-25)

## Corpus Check
- Corpus is ~45,275 words - fits in a single context window. You may not need a graph.

## Summary
- 613 nodes · 1060 edges · 62 communities (57 shown, 5 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 32 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Gemma Client and UI
- Chand Baori Domain Model
- 3D Asset Pipeline
- Wadokei Simulation Components
- Project Dependencies
- TypeScript Compiler Config
- Application UI Runtime
- Museum Archive Overview
- Asset Inspection Scripts
- Chand Baori Architecture
- Hosted Gemma Guide
- End-to-End Testing
- Gemma Verification Runs
- Verification and Invariants
- Wadokei Historical Sources
- Mobile Museum Archive
- Mobile Wadokei Study
- Chand Baori Asset Licensing
- Package Scripts
- Desktop Museum Archive
- Production Mobile Archive
- Mobile Stepwell Simulation
- Gemma Wadokei Clock Guide
- Gemma Stepwell Comparison
- Gemma Power Path Guide
- Gemma Water Scenario Guide
- Wadokei Interior Exhibit
- Wadokei Exterior Exhibit
- Wadokei X-Ray Exhibit
- Homepage Architecture
- Server TypeScript Config
- Stepwell Scenario Comparison
- Stepwell Environmental Controls
- Stepwell Water Exploration
- Production Stepwell Conditions
- Production Stepwell Exploration
- Stepwell Front View
- Stepwell Interior View
- Stepwell Lower Levels
- Stepwell Source Palette
- Stepwell Top View
- Stepwell Water Mode
- Stepwell Cross Section
- Stepwell Palette Study
- Stepwell Stone Detail
- Wadokei Exploded View
- Wadokei Exterior View
- Wadokei Foliot Mechanics
- Gemma Temperature Guide
- Wadokei Front View
- Wadokei Rear View
- Wadokei Side View
- Wadokei Top View
- Vite Build Configuration
- Chand Baori Texture
- Development Server
- Reference Colour Study
- Escapement Mechanics
- Wadokei Escapement View
- Baseline Dry Scenario
- React Entry Document

## God Nodes (most connected - your core abstractions)
1. `Assembly()` - 26 edges
2. `HeritageApp()` - 19 edges
3. `Cylinder()` - 17 edges
4. `Box()` - 16 edges
5. `executeGuideTool()` - 16 edges
6. `App()` - 14 edges
7. `validateGuideContext()` - 13 edges
8. `SceneContent()` - 13 edges
9. `compilerOptions` - 13 edges
10. `temperature()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `Hosted Gemma-Only Policy` --semantically_similar_to--> `Hosted Gemma 4 Guide`  [INFERRED] [semantically similar]
  AGENTS.md → docs/GEMMA_GUIDE.md
- `YANTRA Screen-Recording Timeline` --references--> `YANTRA Digital Museum`  [EXTRACTED]
  docs/DEMO_SHOWCASE.md → README.md
- `Chand Baori Environmental Exhibit` --references--> `Chand Baori Water Stone and Climate Exhibit`  [EXTRACTED]
  README.md → docs/CHAND_BAORI.md
- `Chand Baori Environmental Exhibit` --references--> `Chand Baori Verification Report`  [EXTRACTED]
  README.md → docs/CHAND_BAORI_VERIFICATION.md
- `Hosted Gemma Setup` --references--> `YANTRA Screen-Recording Timeline`  [EXTRACTED]
  README.md → docs/DEMO_SHOWCASE.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **YANTRA Homepage and Exhibit Routes** — readme_yantra_museum, readme_homepage_architecture, readme_wadokei_object_study, readme_chand_baori_exhibit [EXTRACTED 1.00]
- **Hosted Gemma Guide Architecture** — docs_gemma_guide_server_gemma, docs_gemma_guide_heritage_server, docs_gemma_guide_shared_tool_dispatch, docs_gemma_guide_guide_panel [EXTRACTED 1.00]
- **Chand Baori Environmental Study Pipeline** — docs_chand_baori_authorised_asset, docs_chand_baori_illustrative_datum, docs_chand_baori_basin_mask, docs_chand_baori_temperature_model, docs_chand_baori_chand_baori_exhibit [EXTRACTED 1.00]

## Communities (62 total, 5 thin omitted)

### Community 0 - "Gemma Client and UI"
Cohesion: 0.05
Nodes (67): response(), lucide-react@^0.468.0, lucide-react, apiKey(), discoverModels(), envPath, generate(), GenerationReply (+59 more)

### Community 1 - "Chand Baori Domain Model"
Cohesion: 0.10
Nodes (41): AgentContext, executeTool(), GeometryContext, PLAN_SCHEMA, TOOL_NAMES, validateContext(), advanceEnvironment(), ASSET_URL (+33 more)

### Community 2 - "3D Asset Pipeline"
Cohesion: 0.07
Nodes (41): dependencies, react@^19.1.1, react-dom@^19.1.1, @react-three/drei@^10.7.4, @react-three/fiber@^9.3.0, three@^0.179.1, react, react-dom (+33 more)

### Community 3 - "Wadokei Simulation Components"
Cohesion: 0.11
Nodes (47): ARBORS, bellGeometry(), brassTexture, chapterTexture, crownGeometry(), gearGeometry(), materials, random() (+39 more)

### Community 4 - "Project Dependencies"
Cohesion: 0.14
Nodes (18): devDependencies, @playwright/test@^1.55.0, tsx@^4.20.5, @types/node@^22.20.5, @types/react@^19.1.10, @types/react-dom@^19.1.7, @types/three@^0.179.0, typescript@~5.7.3 (+10 more)

### Community 5 - "TypeScript Compiler Config"
Cohesion: 0.13
Nodes (14): compilerOptions, allowImportingTsExtensions, esModuleInterop, isolatedModules, jsx, lib, module, moduleResolution (+6 more)

### Community 6 - "Application UI Runtime"
Cohesion: 0.18
Nodes (10): ClockPreview(), makeSimulation(), App(), audition(), openTour(), reset(), ring(), stepTour() (+2 more)

### Community 7 - "Museum Archive Overview"
Cohesion: 0.18
Nodes (7): Chand Baori water architecture exhibit, Digital museum of machines, architecture, and environmental ingenuity, Yantra archive desktop webpage screenshot, Interactive environmental study, Interactive mechanical reconstruction, Wadokei Japanese timekeeping exhibit, Yantra

### Community 8 - "Asset Inspection Scripts"
Cohesion: 0.17
Nodes (10): bounds, buffer, counts, gltf, idat, png, raw, report (+2 more)

### Community 9 - "Chand Baori Architecture"
Cohesion: 0.20
Nodes (9): Chand Baori Project Extension, YANTRA Route and Module Ownership, Top-Envelope Basin Mask, Chand Baori Water Stone and Climate Exhibit, Sharmin et al. Jodhpur Microclimate Research, Hypothetical Water Elevation Trajectory, Parmar and Mishra Stepwell Cooling Research, Rajasthan Tourism Chand Baori Sources (+1 more)

### Community 10 - "Hosted Gemma Guide"
Cohesion: 0.33
Nodes (8): Chand Baori Hosted Gemma Guide Integration, YANTRA Screen-Recording Timeline, Reusable Guide Panel, Heritage Native Function-Calling Server, Hosted Gemma 4 Guide, Server Gemma Adapter, Shared Guide Tool Validation and Dispatch, Hosted Gemma Setup

### Community 11 - "End-to-End Testing"
Cohesion: 0.24
Nodes (3): @playwright/test, ask(), evidence

### Community 12 - "Gemma Verification Runs"
Cohesion: 0.22
Nodes (6): Chand Empirical Temperature Model 1.0, Gemma 31B Stepwell Comparison Run, Default Gemma 26B Clock Live Run, Default Gemma 26B Stepwell Partial Run, Hosted Gemma Guide Verification Report, YANTRA Project Handover

### Community 13 - "Verification and Invariants"
Cohesion: 0.22
Nodes (6): Connected Clock Simulation Invariants, Visitor Control Cleanup, Chand Baori Verification Report, Wadokei Mechanical Model, Executed Wadokei Checks, Wadokei Verification Report

### Community 14 - "Wadokei Historical Sources"
Cohesion: 0.33
Nodes (7): Early Single-Foliot Wadokei Variant, Japan Clock and Watch Association Source, Museo Galileo Verge and Foliot Source, Oxford Escapement Source, Petaru Wadokei Visual Reference, Seiko Museum Double-Foliot Source, TOKI Wadokei Object Study

### Community 15 - "Mobile Museum Archive"
Cohesion: 0.48
Nodes (6): Yantra archive mobile webpage screenshot, Chand Baori water architecture exhibit, Digital museum of machines, architecture, and environmental ingenuity, Interactive 3D historical studies, Historical references and model limitations, Wadokei Japanese timekeeping mechanism exhibit

### Community 16 - "Mobile Wadokei Study"
Cohesion: 0.33
Nodes (6): Mobile Wadokei evidence and provenance page, Documented principle, explanatory reconstruction, and exhibit design distinctions, Adjustable foliot weight rhythm control, Research sources and mechanical glossary, Edo-period seasonal temporal hours, Mobile interactive Wadokei reconstruction

### Community 17 - "Chand Baori Asset Licensing"
Cohesion: 0.33
Nodes (6): Authorised Chand Baori glTF Asset, Procedural Sandstone Surface Finish, Surface Finish Validation, Creative Commons Attribution 4.0, Chand Baori 3D Model, siddharthbandhu

### Community 18 - "Package Scripts"
Cohesion: 0.29
Nodes (7): scripts, agent, build, dev, preview, test, test:e2e

### Community 19 - "Desktop Museum Archive"
Cohesion: 0.40
Nodes (5): Yantra archive production desktop webpage, Chand Baori live 3D water architecture study, Digital museum of machines, architecture, and environmental ingenuity, Historical evidence, reconstructed geometry, simulated estimates, and sources, Wadokei live 3D mechanism study

### Community 20 - "Production Mobile Archive"
Cohesion: 0.40
Nodes (5): Yantra archive production mobile webpage, Chand Baori interactive environmental study, Digital museum of machines, architecture, and environmental ingenuity, Source references and model limitations, Wadokei interactive mechanical reconstruction

### Community 21 - "Mobile Stepwell Simulation"
Cohesion: 0.40
Nodes (5): Mobile Chand Baori environmental study interface, Outdoor air, time, solar exposure, and observation depth inputs, Mobile interactive 3D Chand Baori model, Simulated temperature-by-depth profile, Water elevation scenario control

### Community 22 - "Gemma Wadokei Clock Guide"
Cohesion: 0.33
Nodes (5): Gemma 4 hosted API guide, Gemma-guided live Wadokei interface screenshot, Interior view with connected movement held, Isolated fifteen-tooth crown escape wheel, Paused Wadokei movement

### Community 23 - "Gemma Stepwell Comparison"
Cohesion: 0.33
Nodes (5): Gemma AI quota temporarily unavailable, Chand Baori, Simulated temperature estimate of 28.7 degrees Celsius at twelve metres, Gemma comparison live Chand Baori interface screenshot, Temperature study mode

### Community 24 - "Gemma Power Path Guide"
Cohesion: 0.33
Nodes (5): Wadokei live guided power-path interface, Adjustable foliot weights controlling beat rhythm, Operating view exposing the clock gear train, Power path from falling weight through staged gear transmission, Single-foliot lantern clock reconstruction

### Community 25 - "Gemma Water Scenario Guide"
Cohesion: 0.33
Nodes (5): Chand Baori live guided water interface, Interactive Chand Baori environmental model, Verified tools calculate and change the exhibit while the model explains, Water elevation set to minus eighteen metres, Water mode visualizing a lowered water level

### Community 26 - "Wadokei Interior Exhibit"
Cohesion: 0.33
Nodes (5): Wadokei interior-view exhibit interface, Adjustable foliot weights regulate beat timing, Visible wheels, arbor, bridge, weight, and bell mechanism, Interior view with dial and shutters removed, Single-foliot lantern clock reconstruction

### Community 27 - "Wadokei Exterior Exhibit"
Cohesion: 0.33
Nodes (5): Production Wadokei exterior-view exhibit, Housing, time-reading, and gravity-transmission component index, Exterior housing, dial, bell, stand, and falling weight, Adjustable foliot weights controlling beat rhythm, Complete single-foliot lantern clock reconstruction

### Community 28 - "Wadokei X-Ray Exhibit"
Cohesion: 0.33
Nodes (5): Wadokei X-ray exhibit interface, Housing, time-reading, and movement component index, Rotating numbered ring driven relative to a fixed front-dial bridge, Wadokei single-foliot lantern clock reconstruction, Transparent housing revealing the assembled clock movement

### Community 29 - "Homepage Architecture"
Cohesion: 0.33
Nodes (5): Homepage Executed Checks, Living Archive Homepage, Chand Baori Environmental Exhibit, Editorial Homepage Architecture, YANTRA Digital Museum

### Community 30 - "Server TypeScript Config"
Cohesion: 0.33
Nodes (5): ./tsconfig.json, compilerOptions, types, extends, include

### Community 31 - "Stepwell Scenario Comparison"
Cohesion: 0.40
Nodes (4): Chand Baori environmental study comparison interface, Interactive 3D model of Chand Baori, Comparison of baseline and hot-summer study snapshots, Air temperature estimates by observation depth

### Community 32 - "Stepwell Environmental Controls"
Cohesion: 0.50
Nodes (4): Chand Baori environmental conditions interface, Outdoor air, time, solar exposure, and observation-depth controls, Interactive 3D Chand Baori model with depth markers, Relative water column and study-bottom measurements

### Community 33 - "Stepwell Water Exploration"
Cohesion: 0.40
Nodes (4): Chand Baori water-elevation exploration interface, Hypothetical environmental study, Interactive 3D Chand Baori architectural model, Adjustable water elevation scenario

### Community 34 - "Production Stepwell Conditions"
Cohesion: 0.50
Nodes (5): Production Chand Baori environmental conditions interface, Outdoor air estimate set to 36 degrees Celsius, Interactive hypothetical environmental study, Aged-stone 3D Chand Baori model, Water elevation set to minus ten metres

### Community 35 - "Production Stepwell Exploration"
Cohesion: 0.50
Nodes (4): Production Chand Baori exploration view, Explore, water, temperature, cross-section, environmental, and architecture modes, Aged-stone overview of the Chand Baori 3D model, Water elevation scenario set to minus sixteen metres

### Community 36 - "Stepwell Front View"
Cohesion: 0.50
Nodes (5): Production Chand Baori front view, Depth and simulated temperature markers, Environmental conditions panel linked to the model view, Front elevation view of the Chand Baori 3D model, Water elevation scenario set to minus ten metres

### Community 37 - "Stepwell Interior View"
Cohesion: 0.50
Nodes (4): Production Chand Baori interior view, Depth marker at 20.4 metres, Submerged interior perspective of Chand Baori stairs and structures, Translucent water-volume visualization

### Community 38 - "Stepwell Lower Levels"
Cohesion: 0.50
Nodes (4): Production Chand Baori lower-levels view, Water elevation and air-temperature controls, Submerged lower-level perspective of Chand Baori, Translucent water visualization across lower stair levels

### Community 39 - "Stepwell Source Palette"
Cohesion: 0.50
Nodes (4): Production Chand Baori source-palette view, Green surface and stratified brown terrain layers, Source-derived color palette applied to the 3D model, Chand Baori architectural reconstruction

### Community 40 - "Stepwell Top View"
Cohesion: 0.40
Nodes (5): Chand Baori, Depth and simulated temperature markers, Interactive environmental study, Chand Baori production top-view interface screenshot, Water elevation at minus ten metres

### Community 41 - "Stepwell Water Mode"
Cohesion: 0.40
Nodes (5): Chand Baori, Chand Baori production water-mode screenshot, Submerged lower stepwell levels, Water elevation at minus ten metres, Water exploration mode

### Community 42 - "Stepwell Cross Section"
Cohesion: 0.40
Nodes (5): Air and shade environmental inputs, Chand Baori, Architectural cross-section view, Temperature profile across six, twelve, eighteen, and twenty-four metre depths, Chand Baori cross-section interface screenshot

### Community 43 - "Stepwell Palette Study"
Cohesion: 0.40
Nodes (5): Baseline water-elevation scenario, Chand Baori, Chand Baori source-palette interface screenshot, Source palette material treatment, Colour-coded stratified terrain block

### Community 44 - "Stepwell Stone Detail"
Cohesion: 0.40
Nodes (5): Aged stone surface treatment, Chand Baori, Water elevation and air-shade controls, Chand Baori aged-stone detail interface screenshot, Close-up stepped architectural geometry

### Community 45 - "Wadokei Exploded View"
Cohesion: 0.40
Nodes (4): Exploded assembly view, Wadokei exploded-view screenshot, Clock components separated along assembly axes, Wadokei single-foliot lantern clock

### Community 46 - "Wadokei Exterior View"
Cohesion: 0.40
Nodes (4): Complete exterior instrument, Adjustable foliot weights, Wadokei exterior-view screenshot, Wadokei single-foliot lantern clock

### Community 47 - "Wadokei Foliot Mechanics"
Cohesion: 0.40
Nodes (4): Adjustable foliot weights, Foliot balance bar, Wadokei foliot operating-view screenshot, Wadokei single-foliot lantern clock

### Community 48 - "Gemma Temperature Guide"
Cohesion: 0.40
Nodes (4): Chand Baori live guided temperature interface, Interactive Chand Baori environmental model, Simulated estimate of 28.7 degrees Celsius at 12 metres depth, Temperature mode with depth markers

### Community 49 - "Wadokei Front View"
Cohesion: 0.40
Nodes (4): Front orthographic view of Wadokei reconstruction, Suspended going-train weight beneath the clock housing, Front view showing numbered dial and pointer, Wadokei single-foliot lantern clock

### Community 50 - "Wadokei Rear View"
Cohesion: 0.40
Nodes (5): Rear view of Wadokei reconstruction, Suspended driving weight, Clockwork visible behind the rear lattice, Rear view through lattice housing, Wadokei single-foliot lantern clock

### Community 51 - "Wadokei Side View"
Cohesion: 0.40
Nodes (5): Side view of Wadokei reconstruction, Suspended driving weight below the housing, Gearwork visible through the lattice panel, Side profile with lattice housing and bell, Wadokei single-foliot lantern clock

### Community 52 - "Wadokei Top View"
Cohesion: 0.40
Nodes (5): Top view of Wadokei reconstruction, Bell mounted on the clock roof, Balance bar and adjustable foliot weights, Top-down view of the bell and foliot assembly, Wadokei single-foliot lantern clock

### Community 53 - "Vite Build Configuration"
Cohesion: 0.40
Nodes (4): vite@^6.4.1, @vitejs/plugin-react@^4.7.0, vite, @vitejs/plugin-react

### Community 54 - "Chand Baori Texture"
Cohesion: 0.50
Nodes (3): Chand Baori base-color palette texture strip, Base-color map for the Chand Baori model, Narrow multi-color texture palette

### Community 56 - "Reference Colour Study"
Cohesion: 1.00
Nodes (3): Aged stone reference palette, Chand Baori, Chand Baori reference-colour interface screenshot

### Community 58 - "Wadokei Escapement View"
Cohesion: 0.67
Nodes (3): Adjustable foliot weights, Wadokei escapement operating-view screenshot, Wadokei single-foliot lantern clock

## Knowledge Gaps
- **86 isolated node(s):** `./tsconfig.json`, `YANTRA Route and Module Ownership`, `Connected Clock Simulation Invariants`, `Oxford Escapement Source`, `Museo Galileo Verge and Foliot Source` (+81 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 216 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `three` connect `3D Asset Pipeline` to `Asset Inspection Scripts`, `Chand Baori Domain Model`, `Wadokei Simulation Components`, `Project Dependencies`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **What connects `./tsconfig.json`, `YANTRA Route and Module Ownership`, `Connected Clock Simulation Invariants` to the rest of the system?**
  _86 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Gemma Client and UI` be split into smaller, more focused modules?**
  _Cohesion score 0.05381400208986416 - nodes in this community are weakly interconnected._
- **Why does `react` connect `3D Asset Pipeline` to `Gemma Client and UI`, `Chand Baori Domain Model`, `Wadokei Simulation Components`, `Project Dependencies`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Should `Chand Baori Domain Model` be split into smaller, more focused modules?**
  _Cohesion score 0.09796806966618288 - nodes in this community are weakly interconnected._
- **Why does `@playwright/test` connect `End-to-End Testing` to `Gemma Client and UI`, `Chand Baori Domain Model`, `Exhibit Snapshot Tests`, `Project Dependencies`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Should `3D Asset Pipeline` be split into smaller, more focused modules?**
  _Cohesion score 0.07088989441930618 - nodes in this community are weakly interconnected._