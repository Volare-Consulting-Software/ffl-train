import { container } from "@/container";
import { type DateUsageRepository, DateUsageRepositoryToken } from "@/interfaces/dateUsageRepository";
import { type TripOddsService, TripOddsServiceToken } from "@/interfaces/tripOddsService";
import { type TripService, TripServiceToken } from "@/interfaces/tripService";
import type { DashboardData } from "@/types/dashboardData";
import type { TripOddsReport } from "@/types/tripOddsReport";

/** Server boundary that resolves services and gathers everything the home page needs for a date. */
export async function loadDashboard(departureDate: string): Promise<DashboardData> {
  const [summaries, tripOdds] = await Promise.all([
    container.resolve<TripService>(TripServiceToken).listSummaries(departureDate),
    loadTripOdds(),
  ]);
  return { summaries, tripOdds };
}

/** Every departure date someone has already paid to look up, newest first. */
export function loadSelectedDates(): Promise<string[]> {
  return container.resolve<DateUsageRepository>(DateUsageRepositoryToken).listSelectedDates();
}

async function loadTripOdds(): Promise<TripOddsReport | null> {
  try {
    return await container.resolve<TripOddsService>(TripOddsServiceToken).getOdds(Number(process.env.ESPN_SEASON ?? new Date().getFullYear()));
  } catch (err) {
    console.warn(`Trip odds unavailable: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}
