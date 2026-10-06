/** One team's current record and its simulated chances of ending up on the train trip. */
export interface TeamTripOdds {
  teamId: number;
  ownerName: string;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  standing: number;
  loserBracketProbability: number;
  ultimateLoserProbability: number;
  tripProbability: number;
}
