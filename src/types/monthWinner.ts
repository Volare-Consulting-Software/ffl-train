import type { LeagueTeam } from "@/types/leagueTeam";

/** The top scorer of a finished month. Teams tied for the most points share it. */
export interface MonthWinner {
  /** The month as YYYY-MM. */
  month: string;
  points: number;
  teams: LeagueTeam[];
}
