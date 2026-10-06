/** A regular-season matchup. `awayTeamId` is null on a bye; points are 0 until the game is played. */
export interface LeagueMatchup {
  week: number;
  homeTeamId: number;
  awayTeamId: number | null;
  homePoints: number;
  awayPoints: number;
  completed: boolean;
}
