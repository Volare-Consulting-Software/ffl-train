import { Trophy } from "lucide-react";

import type { PickerSuggestion } from "@/types/pickerSuggestion";

export interface NextPickerBannerProps {
  suggestion: PickerSuggestion | null;
}

export function NextPickerBanner({ suggestion }: NextPickerBannerProps) {
  if (!suggestion) {
    return null;
  }
  return (
    <div className="flex items-center gap-3 rounded-lg bg-surface-selected px-4 py-3 text-sm text-fg">
      <Trophy className="size-5 shrink-0" aria-hidden="true" />
      <p>
        <strong className="font-bold">{suggestion.ownerName}</strong> picks next, with {suggestion.points.toFixed(2)} points
        in week {suggestion.week}.
      </p>
    </div>
  );
}
