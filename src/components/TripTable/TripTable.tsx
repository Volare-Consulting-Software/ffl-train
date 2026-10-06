import { Plane } from "lucide-react";

import { formatDuration } from "@/lib/format";
import type { TripSummary } from "@/types/tripSummary";

export interface TripTableProps {
  summaries: TripSummary[];
  selectedPickId: number | null;
  loading: boolean;
  onSelect: (pickId: number) => void;
  onAirportClick: (summary: TripSummary) => void;
}

export function TripTable({ summaries, selectedPickId, loading, onSelect, onAirportClick }: TripTableProps) {
  if (summaries.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-line-strong p-8 text-center text-fg-secondary">
        No destinations picked yet.
      </p>
    );
  }

  return (
    <div className={`overflow-x-auto rounded-lg border border-line bg-surface transition-opacity ${loading ? "opacity-50" : ""}`}>
      <table className="w-full text-left text-sm">
        <thead className="bg-surface-raised text-fg-secondary">
          <tr>
            <th className="h-12 whitespace-nowrap px-4 font-semibold">Picked by</th>
            <th className="h-12 px-4 font-semibold">Destination</th>
            <th className="h-12 whitespace-nowrap px-4 text-right font-semibold">Distance</th>
            <th className="h-12 whitespace-nowrap px-4 text-right font-semibold">Train time</th>
            <th className="h-12 px-4 font-semibold">Airport</th>
          </tr>
        </thead>
        <tbody>
          {summaries.map((summary) => {
            const selected = summary.pick.id === selectedPickId;
            return (
              <tr
                key={summary.pick.id}
                onClick={() => onSelect(summary.pick.id)}
                aria-selected={selected}
                className={`cursor-pointer border-t border-line ${selected ? "bg-surface-selected" : "hover:bg-surface-raised"}`}
              >
                <td className="px-4 py-3 text-fg">{summary.pick.pickerName}</td>
                <td className="px-4 py-3">
                  <div className="font-semibold text-fg">{summary.pick.destinationName}</div>
                  {summary.error ? (
                    <div className="text-xs text-error">{summary.error}</div>
                  ) : (
                    <div className="text-xs text-fg-secondary">
                      {summary.pick.stationCode}
                      {summary.transfers ? ` · ${summary.transfers} transfer${summary.transfers > 1 ? "s" : ""}` : " · direct"}
                    </div>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                  {summary.totalMiles !== null ? `${summary.totalMiles.toLocaleString()} mi` : "–"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                  {summary.totalMinutes !== null ? formatDuration(summary.totalMinutes) : "–"}
                </td>
                <td className="px-4 py-3">
                  {summary.airport ? (
                    <button
                      type="button"
                      title={`${summary.airport.name}: see fares to Charlotte`}
                      aria-label={`${summary.airport.code} fares to Charlotte`}
                      onClick={(event) => {
                        event.stopPropagation();
                        onAirportClick(summary);
                      }}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line-strong bg-surface px-2.5 font-mono text-sm font-semibold text-fg hover:border-brand hover:bg-brand-subtle dark:hover:bg-surface-raised"
                    >
                      <Plane className="size-4" aria-hidden="true" />
                      {summary.airport.code}
                    </button>
                  ) : (
                    "–"
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
