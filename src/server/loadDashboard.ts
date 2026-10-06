import { container } from "@/container";
import { type DateUsageRepository, DateUsageRepositoryToken } from "@/interfaces/dateUsageRepository";
import { type PickerSuggester, PickerSuggesterToken } from "@/interfaces/pickerSuggester";
import { type TripOddsService, TripOddsServiceToken } from "@/interfaces/tripOddsService";
import { type TripService, TripServiceToken } from "@/interfaces/tripService";
import type { DashboardData } from "@/types/dashboardData";
import type { PickerSuggestion } from "@/types/pickerSuggestion";
import type { TripOddsReport } from "@/types/tripOddsReport";

/** Server boundary that resolves services and gathers everything the home page needs for a date. */
export async function loadDashboard(departureDate: string): Promise<DashboardData> {
  const [summaries, suggestion, tripOdds] = await Promise.all([
    container.resolve<TripService>(TripServiceToken).listSummaries(departureDate),
    loadSuggestion(),
    loadTripOdds(),
  ]);
  return { summaries, suggestion, tripOdds };
}

/** Every departure date someone has already paid to look up, newest first. */
export function loadSelectedDates(): Promise<string[]> {
  return container.resolve<DateUsageRepository>(DateUsageRepositoryToken).listSelectedDates();
}

function currentSeason(): number {
  return Number(process.env.ESPN_SEASON ?? new Date().getFullYear());
}

async function loadSuggestion(): Promise<PickerSuggestion | null> {
  const season = currentSeason();
  try {
    return await container.resolve<PickerSuggester>(PickerSuggesterToken).suggest(season);
  } catch (err) {
    console.warn(`Next picker unavailable: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}

async function loadTripOdds(): Promise<TripOddsReport | null> {
  try {
    return await container.resolve<TripOddsService>(TripOddsServiceToken).getOdds(currentSeason());
  } catch (err) {
    console.warn(`Trip odds unavailable: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}
