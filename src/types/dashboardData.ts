import type { PickerSuggestion } from "@/types/pickerSuggestion";
import type { TripSummary } from "@/types/tripSummary";

/** Everything the home page renders for a departure date. */
export interface DashboardData {
  summaries: TripSummary[];
  selectedDates: string[];
  suggestion: PickerSuggestion | null;
}
