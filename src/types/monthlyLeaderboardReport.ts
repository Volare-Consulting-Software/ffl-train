import type { MonthLeaderboard } from "@/types/monthLeaderboard";
import type { MonthWinner } from "@/types/monthWinner";

/** The current month's standings and the winner of each finished month of the season. */
export interface MonthlyLeaderboardReport {
  season: number;
  /** Null before the season's first Sunday. */
  current: MonthLeaderboard | null;
  /** Oldest month first. */
  winners: MonthWinner[];
}
