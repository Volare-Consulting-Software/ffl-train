/** A matchup. `awayTeamId` is null on a bye; points are live while the week is in progress and 0 before it starts. */
export interface LeagueMatchup {
  week: number;
  homeTeamId: number;
  awayTeamId: number | null;
  homePoints: number;
  awayPoints: number;
  completed: boolean;
}
