/** Centralized stacking order — never hardcode a z-index outside this file. */
export const zIndex = {
  base: 0,
  dropdown: 100,
  stickyNav: 200,
  overlay: 300,
  modal: 400,
  toast: 500,
  tooltip: 600,
  commandPalette: 700,
} as const;
