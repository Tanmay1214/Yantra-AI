# The Living Archive homepage — 25 October 2026

Implemented and checked in `C:\Users\tanma\Documents\MLH`. This folder has no Git metadata; review used scoped file inspection rather than claiming a Git diff.

## Implementation

- `/` is the editorial museum homepage; `/wadokei` retains the clock and `/chand-baori` opens the stepwell. Unknown document paths show a recovery page. Both exhibit wordmarks return home.
- `src/museum.ts` holds the shared product identity and routes. `src/home/` contains the page, isolated styles and lazy scene adapters. The homepage previews use the existing clock geometry and original Chand Baori asset; no replacement model or screenshot is used as an exhibit.
- Previews load when approaching the viewport. The clock preview is paused; both allow pointer navigation. Full simulation controls remain inside the original experiences. No simulation equations, source assets, package manifests or lockfiles changed.
- The homepage includes evidence links, reconstruction/estimate labels, model attribution, keyboard entry links, a skip link, reduced-motion styling and responsive layouts.

## Executed checks

| Check | Result |
| --- | --- |
| `npm run build` | Passed frontend/backend TypeScript and Vite production build. The existing approximately 704 KB Three.js chunk advisory remains. |
| `npm test` | **16/16 passed**: retained mechanical, environmental, geometry and agent validation tests. |
| `npm run test:e2e` | **6/6 passed**: both clock scenarios, both stepwell scenarios, homepage navigation/real previews/mobile layout and unknown-path recovery. |
| `node scripts/home-production-smoke.mjs` | Passed against port 4173: homepage HTTP 200, both previews, entry and return navigation, direct stepwell route reload, phone-width overflow check and no uncaught page errors. |
| Visual review | Reviewed desktop and 390-pixel full-page captures, plus the actual homepage and approach navigation in the in-app browser. |

Screenshots: `artifacts/archive-desktop.png`, `archive-mobile.png`, `archive-production.png` and `archive-production-mobile.png`.

## Limits

Static hosting must rewrite document routes to `index.html`; Vite development and preview support this, but no external deployment was tested or performed. Fonts have system fallbacks; offline-font appearance and non-WebGL hardware were not independently tested. Existing AI tests use a mocked transport and do not establish actual Gemma inference. No new historical measurements or validated physical claims were introduced. A user can change each preview's camera; those exploratory camera positions are not persisted between document visits.
