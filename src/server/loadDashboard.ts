import { container } from "@/container";
import { type DateUsageRepository, DateUsageRepositoryToken } from "@/interfaces/dateUsageRepository";
import { type MonthlyLeaderboardService, MonthlyLeaderboardServiceToken } from "@/interfaces/monthlyLeaderboardService";
import { type TripOddsService, TripOddsServiceToken } from "@/interfaces/tripOddsService";
import { type TripService, TripServiceToken } from "@/interfaces/tripService";
import { dateInZone, LEAGUE_TIME_ZONE } from "@/lib/dates";
import type { DashboardData } from "@/types/dashboardData";
import type { MonthlyLeaderboardReport } from "@/types/monthlyLeaderboardReport";
import type { TripOddsReport } from "@/types/tripOddsReport";

/** Server boundary that resolves services and gathers everything the home page needs for a date. */
export async function loadDashboard(departureDate: string): Promise<DashboardData> {
  const [summaries, tripOdds, monthlyLeaderboard] = await Promise.all([
    container.resolve<TripService>(TripServiceToken).listSummaries(departureDate),
    loadTripOdds(),
    loadMonthlyLeaderboard(),
  ]);
  return { summaries, tripOdds, monthlyLeaderboard };
}

/** Every departure date someone has already paid to look up, newest first. */
export function loadSelectedDates(): Promise<string[]> {
  return container.resolve<DateUsageRepository>(DateUsageRepositoryToken).listSelectedDates();
}

function currentSeason(): number {
  return Number(process.env.ESPN_SEASON ?? new Date().getFullYear());
}

async function loadTripOdds(): Promise<TripOddsReport | null> {
  try {
    return await container.resolve<TripOddsService>(TripOddsServiceToken).getOdds(currentSeason());
  } catch (err) {
    console.warn(`Trip odds unavailable: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}

async function loadMonthlyLeaderboard(): Promise<MonthlyLeaderboardReport | null> {
  try {
    return await container
      .resolve<MonthlyLeaderboardService>(MonthlyLeaderboardServiceToken)
      .getReport(currentSeason(), dateInZone(new Date(), LEAGUE_TIME_ZONE));
  } catch (err) {
    console.warn(`Monthly leaderboard unavailable: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}
