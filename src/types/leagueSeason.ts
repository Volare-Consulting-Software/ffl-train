import type { LeagueMatchup } from "@/types/leagueMatchup";
import type { LeagueTeam } from "@/types/leagueTeam";

/** A league's teams, full regular-season schedule and the playoff and consolation matchups set so far. */
export interface LeagueSeason {
  season: number;
  teams: LeagueTeam[];
  matchups: LeagueMatchup[];
  playoffMatchups: LeagueMatchup[];
}
