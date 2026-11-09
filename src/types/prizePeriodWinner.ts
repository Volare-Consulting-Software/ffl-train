import type { LeagueTeam } from "@/types/leagueTeam";
import type { PrizePeriod } from "@/types/prizePeriod";

/** The top scorer of a finished prize period. Teams tied for the most points share it. */
export interface PrizePeriodWinner {
  period: PrizePeriod;
  points: number;
  teams: LeagueTeam[];
}
