import type { MoonPhase } from "@/types/moonPhase";

/** Looks up the Moon's illumination for a calendar date from an outside source. */
export interface MoonPhaseClient {
  lookup(date: string): Promise<MoonPhase>;
}

export const MoonPhaseClientToken = Symbol.for("MoonPhaseClient");
