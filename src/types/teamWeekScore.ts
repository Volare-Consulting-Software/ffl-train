/** A fantasy team's points for one matchup week. */
export interface TeamWeekScore {
  teamId: number;
  teamName: string;
  week: number;
  points: number;
}
