/** A fantasy team's points for one matchup week, labeled with the owner's name. */
export interface TeamWeekScore {
  teamId: number;
  ownerName: string;
  week: number;
  points: number;
}
