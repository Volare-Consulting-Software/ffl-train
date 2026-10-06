import type { LeagueSeason } from "@/types/leagueSeason";

/** Read access to the fantasy league's teams and schedule. */
export interface FantasyLeagueClient {
  getSeason(season: number): Promise<LeagueSeason>;
}

export const FantasyLeagueClientToken = Symbol.for("FantasyLeagueClient");
