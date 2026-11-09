/** A team's points for a prize period and how far it trails that period's leader. */
export interface PrizeStanding {
  teamId: number;
  ownerName: string;
  points: number;
  /** Points behind the leader; 0 for the leader and anyone tied with them. */
  behind: number;
}
