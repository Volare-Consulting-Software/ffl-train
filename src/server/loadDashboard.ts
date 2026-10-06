import { container } from "@/container";
import { type DateUsageRepository, DateUsageRepositoryToken } from "@/interfaces/dateUsageRepository";
import { type PickerSuggester, PickerSuggesterToken } from "@/interfaces/pickerSuggester";
import { type TripService, TripServiceToken } from "@/interfaces/tripService";
import type { DashboardData } from "@/types/dashboardData";
import type { PickerSuggestion } from "@/types/pickerSuggestion";

/** Server boundary that resolves services and gathers everything the home page needs for a date. */
export async function loadDashboard(departureDate: string): Promise<DashboardData> {
  const [summaries, selectedDates, suggestion] = await Promise.all([
    container.resolve<TripService>(TripServiceToken).listSummaries(departureDate),
    loadSelectedDates(),
    loadSuggestion(),
  ]);
  return { summaries, selectedDates, suggestion };
}

/** Every departure date someone has already paid to look up, newest first. */
export function loadSelectedDates(): Promise<string[]> {
  return container.resolve<DateUsageRepository>(DateUsageRepositoryToken).listSelectedDates();
}

async function loadSuggestion(): Promise<PickerSuggestion | null> {
  const season = Number(process.env.ESPN_SEASON ?? new Date().getFullYear());
  try {
    return await container.resolve<PickerSuggester>(PickerSuggesterToken).suggest(season);
  } catch (err) {
    console.warn(`Next picker unavailable: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}
