/** A team's record and scoring over a set of weeks. */
export interface MoonSplit {
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  averagePoints: number | null;
}
