import { formatIsoDate } from "@/lib/format";

const MAX_CHIPS = 6;

export interface SelectedDateChipsProps {
  dates: string[];
  activeDate: string;
  onSelect: (date: string) => void;
}

/** Dates someone already paid to look up; choosing one never counts against the weekly limit. */
export function SelectedDateChips({ dates, activeDate, onSelect }: SelectedDateChipsProps) {
  if (dates.length === 0) {
    return null;
  }
  return (
    <div className="flex flex-wrap items-center gap-1 text-xs">
      <span className="text-neutral-500">Previously selected:</span>
      {dates.slice(0, MAX_CHIPS).map((date) => (
        <button
          key={date}
          type="button"
          onClick={() => onSelect(date)}
          className={`rounded-full border px-2 py-0.5 ${
            date === activeDate
              ? "border-blue-600 bg-blue-600 text-white"
              : "border-neutral-300 hover:border-blue-500 dark:border-neutral-700"
          }`}
        >
          {formatIsoDate(date)}
        </button>
      ))}
    </div>
  );
}
