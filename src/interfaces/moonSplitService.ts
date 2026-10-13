import type { MoonSplitReport } from "@/types/moonSplitReport";

/** The moon team's crescent vs non-crescent Sunday results, filling in any missing moon phases first. */
export interface MoonSplitService {
  getReport(season: number): Promise<MoonSplitReport>;
}

export const MoonSplitServiceToken = Symbol.for("MoonSplitService");
