import { EXHIBIT_PATHS, MUSEUM } from "./museum";

const path = location.pathname.replace(/\/+$/, "") || "/";
if (path === EXHIBIT_PATHS.wadokei) {
  document.title = "Wadokei — The shape of time";
  void import("./wadokei-entry");
} else if (path === EXHIBIT_PATHS.chandBaori) {
  document.title = "Chand Baori — Water, stone & climate";
  void import("./heritage/HeritageApp");
} else {
  document.title = path === "/" ? MUSEUM.name : `Page not found — ${MUSEUM.name}`;
  void import("./home/HomePage");
}
