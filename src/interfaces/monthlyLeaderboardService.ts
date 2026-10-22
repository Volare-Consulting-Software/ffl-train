import type { MonthlyLeaderboardReport } from "@/types/monthlyLeaderboardReport";

/** Ranks teams by points scored each month, assigning every week to the month of its NFL Sunday. */
export interface MonthlyLeaderboardService {
  /** Builds the leaderboard as of `today` (YYYY-MM-DD in the league's time zone). */
  getReport(season: number, today: string): Promise<MonthlyLeaderboardReport>;
}

export const MonthlyLeaderboardServiceToken = Symbol.for("MonthlyLeaderboardService");
