import { formatDuration, formatIsoDate, formatUsd } from "@/lib/format";
import type { FlightPanelState } from "@/types/flightPanelState";

export interface FlightPanelProps {
  state: FlightPanelState;
  onClose: () => void;
}

export function FlightPanel({ state, onClose }: FlightPanelProps) {
  const { airport } = state;

  return (
    <aside className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800" aria-live="polite">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold">
            {airport.code} → CLT
          </h2>
          <p className="text-sm text-neutral-500">
            {airport.name}, {airport.municipality}
          </p>
        </div>
        <button type="button" onClick={onClose} className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100">
          Close
        </button>
      </div>

      {state.status === "loading" && <p className="mt-3 text-sm">Looking up fares…</p>}
      {state.status === "error" && <p className="mt-3 text-sm text-red-700 dark:text-red-400">{state.message}</p>}
      {state.status === "ready" && (
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-neutral-500">Cheapest one-way</dt>
            <dd className="text-lg font-semibold">{state.quote.priceUsd !== null ? formatUsd(state.quote.priceUsd) : "No fares"}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Flight distance</dt>
            <dd className="text-lg font-semibold">{state.quote.flightDistanceMiles.toLocaleString()} mi</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Connections</dt>
            <dd className="text-lg font-semibold">
              {state.quote.connections === null ? "–" : state.quote.connections === 0 ? "Nonstop" : state.quote.connections}
            </dd>
          </div>
          <div>
            <dt className="text-neutral-500">Flight time</dt>
            <dd className="text-lg font-semibold">
              {state.quote.durationMinutes !== null ? formatDuration(state.quote.durationMinutes) : "–"}
            </dd>
          </div>
          <p className="col-span-full text-xs text-neutral-500">
            Flying {formatIsoDate(state.quote.flightDate)}. Price as of {new Date(state.quote.fetchedAt).toLocaleString()}.
          </p>
        </dl>
      )}
    </aside>
  );
}
