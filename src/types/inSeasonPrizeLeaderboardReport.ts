import type { PrizePeriodLeaderboard } from "@/types/prizePeriodLeaderboard";
import type { PrizePeriodWinner } from "@/types/prizePeriodWinner";

/** The current prize period's standings and the winner of each finished period of the season. */
export interface InSeasonPrizeLeaderboardReport {
  season: number;
  /** Null before the season's first week starts. */
  current: PrizePeriodLeaderboard | null;
  /** Earliest period first. */
  winners: PrizePeriodWinner[];
}
