import type { InSeasonPrizeLeaderboardReport } from "@/types/inSeasonPrizeLeaderboardReport";

/** Ranks teams by points scored in each in-season prize period: weeks 1–4, 5–9 and 10–14. */
export interface InSeasonPrizeLeaderboardService {
  /** Builds the leaderboard as of `today` (YYYY-MM-DD in the league's time zone). */
  getReport(season: number, today: string): Promise<InSeasonPrizeLeaderboardReport>;
}

export const InSeasonPrizeLeaderboardServiceToken = Symbol.for("InSeasonPrizeLeaderboardService");
