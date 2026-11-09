import type { InSeasonPrizeLeaderboardReport } from "@/types/inSeasonPrizeLeaderboardReport";
import type { TripOddsReport } from "@/types/tripOddsReport";
import type { TripSummary } from "@/types/tripSummary";

/** Everything the home page renders for a departure date. */
export interface DashboardData {
  summaries: TripSummary[];
  tripOdds: TripOddsReport | null;
  inSeasonPrizeLeaderboard: InSeasonPrizeLeaderboardReport | null;
}
