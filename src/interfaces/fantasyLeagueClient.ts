import type { LeagueSeason } from "@/types/leagueSeason";

/** Read access to the fantasy league's teams and schedule. */
export interface FantasyLeagueClient {
  getSeason(season: number): Promise<LeagueSeason>;
  /** The Sunday (`YYYY-MM-DD`) of each regular-season week, keyed by week number. */
  getWeekSundays(season: number): Promise<Map<number, string>>;
}

export const FantasyLeagueClientToken = Symbol.for("FantasyLeagueClient");
