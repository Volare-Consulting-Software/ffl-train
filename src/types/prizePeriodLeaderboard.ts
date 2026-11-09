import type { PrizePeriod } from "@/types/prizePeriod";
import type { PrizeStanding } from "@/types/prizeStanding";

/** Every team's points for one prize period, highest first. */
export interface PrizePeriodLeaderboard {
  period: PrizePeriod;
  /** The week still being played, whose live points are included; null when every started week is final. */
  liveWeek: number | null;
  /** Weeks in this period that haven't started yet. */
  remainingWeeks: number[];
  standings: PrizeStanding[];
}
