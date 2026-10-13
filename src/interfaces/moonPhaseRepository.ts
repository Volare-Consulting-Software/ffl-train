import type { MoonPhase } from "@/types/moonPhase";

/** Saved moon phases, so each date is only looked up once. */
export interface MoonPhaseRepository {
  /** The saved phases for whichever of these dates have one. */
  findByDates(dates: string[]): Promise<MoonPhase[]>;
  save(phase: MoonPhase): Promise<void>;
}

export const MoonPhaseRepositoryToken = Symbol.for("MoonPhaseRepository");
