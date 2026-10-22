import type { MonthStanding } from "@/types/monthStanding";

/** Every team's points for one month, highest first. */
export interface MonthLeaderboard {
  /** The month as YYYY-MM. */
  month: string;
  /** Weeks whose NFL Sunday falls in this month. */
  weeks: number[];
  /** The week still being played, whose live points are included; null when every week is final. */
  liveWeek: number | null;
  /** Scheduled weeks later this month that haven't started yet. */
  remainingWeeks: number[];
  standings: MonthStanding[];
}
