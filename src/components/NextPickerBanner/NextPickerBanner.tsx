import type { PickerSuggestion } from "@/types/pickerSuggestion";

export interface NextPickerBannerProps {
  suggestion: PickerSuggestion | null;
}

export function NextPickerBanner({ suggestion }: NextPickerBannerProps) {
  if (!suggestion) {
    return null;
  }
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm dark:border-amber-700 dark:bg-amber-950">
      Week {suggestion.week} pick goes to <strong>{suggestion.teamName}</strong> ({suggestion.points.toFixed(2)} pts), the top
      scorer who hasn&apos;t picked yet.
    </div>
  );
}
