import type { TeamWeekScore } from "@/types/teamWeekScore";

/** Read access to the fantasy league's results. */
export interface FantasyLeagueClient {
  /** Scores for every team in every completed matchup week of a season. */
  getCompletedWeekScores(season: number): Promise<TeamWeekScore[]>;
}

export const FantasyLeagueClientToken = Symbol.for("FantasyLeagueClient");
