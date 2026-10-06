import type { TeamTripOdds } from "@/types/teamTripOdds";

/** Trip odds for every team, with the inputs that shaped them. */
export interface TripOddsReport {
  season: number;
  teams: TeamTripOdds[];
  simulations: number;
  remainingGames: number;
}
