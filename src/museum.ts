// Shared product identity and public routes. Keep exhibit-specific content in its own module.
export const MUSEUM = {
  name: "YANTRA",
  descriptor: "A digital museum of machines, architecture, and environmental ingenuity.",
} as const;

export const EXHIBIT_PATHS = {
  wadokei: "/wadokei",
  chandBaori: "/chand-baori",
} as const;
