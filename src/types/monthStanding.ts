/** A team's points for a month and how far it trails that month's leader. */
export interface MonthStanding {
  teamId: number;
  ownerName: string;
  points: number;
  /** Points behind the leader; 0 for the leader and anyone tied with them. */
  behind: number;
}
