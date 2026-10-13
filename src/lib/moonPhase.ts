/** The one person whose results get the crescent moon breakdown. */
export const MOON_TEAM_OWNER = "Sam Longietti";

export const CRESCENT_MIN_PERCENT = 1;
export const CRESCENT_MAX_PERCENT = 49;

/** True for a crescent moon: 1–49% lit (under half), waxing or waning. */
export function isCrescent(illuminationPercent: number): boolean {
  return illuminationPercent >= CRESCENT_MIN_PERCENT && illuminationPercent <= CRESCENT_MAX_PERCENT;
}
