/** Who should add the next destination, and for which week. */
export interface PickerSuggestion {
  season: number;
  week: number;
  teamId: number;
  teamName: string;
  points: number;
}
