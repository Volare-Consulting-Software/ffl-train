import type { LeagueMatchup } from "@/types/leagueMatchup";
import type { LeagueTeam } from "@/types/leagueTeam";

/** A league's teams and full regular-season schedule, played and unplayed. */
export interface LeagueSeason {
  season: number;
  teams: LeagueTeam[];
  matchups: LeagueMatchup[];
  /** True when the data is the built-in sample league rather than ESPN. */
  isSample: boolean;
}
