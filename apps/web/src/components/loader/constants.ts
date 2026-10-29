/** Shared by CinematicLoader and the film it loads on demand (./film.ts). */

/** Length of one loop of the film, in seconds. */
export const CYCLE = 12;
/** The frame shown for reduced motion, or on devices too slow to animate: the logo over the storm. */
export const STILL_TIME = 10.8;
/** Captions for the bridge's three nodes, in the order the film's Overlay.labels lists them. */
export const CAPTIONS = ["Incubators", "Community", "Mentors"] as const;
