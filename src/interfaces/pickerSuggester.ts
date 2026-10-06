import type { PickerSuggestion } from "@/types/pickerSuggestion";

/** Works out who adds the next destination. */
export interface PickerSuggester {
  /**
   * The top scorer of the earliest completed week without a pick, skipping teams that already
   * picked this season. Null when every completed week has a pick.
   */
  suggest(season: number): Promise<PickerSuggestion | null>;
}

export const PickerSuggesterToken = Symbol.for("PickerSuggester");
