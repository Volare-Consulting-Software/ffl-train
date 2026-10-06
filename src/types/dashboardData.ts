import type { PickerSuggestion } from "@/types/pickerSuggestion";
import type { TripOddsReport } from "@/types/tripOddsReport";
import type { TripSummary } from "@/types/tripSummary";

/** Everything the home page renders for a departure date. */
export interface DashboardData {
  summaries: TripSummary[];
  suggestion: PickerSuggestion | null;
  tripOdds: TripOddsReport | null;
}
