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
    return <p className="rounded-lg border border-dashed p-6 text-center text-neutral-500">No destinations picked yet.</p>;
  }

  return (
    <div className={`overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800 ${loading ? "opacity-50" : ""}`}>
      <table className="w-full text-left text-sm">
        <thead className="bg-neutral-100 text-xs uppercase tracking-wide text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400">
          <tr>
            <th className="px-3 py-2">Week</th>
            <th className="px-3 py-2">Picked by</th>
            <th className="px-3 py-2">Destination</th>
            <th className="px-3 py-2 text-right">Distance</th>
            <th className="px-3 py-2 text-right">Train time</th>
            <th className="px-3 py-2">Airport</th>
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
                className={`cursor-pointer border-t border-neutral-200 dark:border-neutral-800 ${
                  selected ? "bg-blue-50 dark:bg-blue-950" : "hover:bg-neutral-50 dark:hover:bg-neutral-900"
                }`}
              >
                <td className="px-3 py-2">{summary.pick.week}</td>
                <td className="px-3 py-2">{summary.pick.pickerName}</td>
                <td className="px-3 py-2">
                  <div className="font-medium">{summary.pick.destinationName}</div>
                  {summary.error ? (
                    <div className="text-xs text-red-700 dark:text-red-400">{summary.error}</div>
                  ) : (
                    <div className="text-xs text-neutral-500">
                      {summary.pick.stationCode}
                      {summary.transfers ? ` · ${summary.transfers} transfer${summary.transfers > 1 ? "s" : ""}` : " · direct"}
                    </div>
                  )}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {summary.totalMiles !== null ? `${summary.totalMiles.toLocaleString()} mi` : "–"}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {summary.totalMinutes !== null ? formatDuration(summary.totalMinutes) : "–"}
                </td>
                <td className="px-3 py-2">
                  {summary.airport ? (
                    <button
                      type="button"
                      title={summary.airport.name}
                      onClick={(event) => {
                        event.stopPropagation();
                        onAirportClick(summary);
                      }}
                      className="rounded bg-neutral-200 px-2 py-0.5 font-mono font-semibold text-blue-800 hover:bg-blue-100 dark:bg-neutral-800 dark:text-blue-300 dark:hover:bg-blue-900"
                    >
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
