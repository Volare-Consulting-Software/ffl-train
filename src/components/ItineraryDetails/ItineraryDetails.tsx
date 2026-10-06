import { Clock, TrainFront } from "lucide-react";

import { formatDuration, formatLocalTime } from "@/lib/format";
import type { TripDetail } from "@/types/tripDetail";

export interface ItineraryDetailsProps {
  detail: TripDetail;
}

export function ItineraryDetails({ detail }: ItineraryDetailsProps) {
  const { itinerary } = detail;

  return (
    <div className="rounded-lg border border-line bg-surface-raised p-5 text-sm">
      <h2 className="text-xl font-semibold text-fg">Charlotte to {detail.pick.destinationName}</h2>
      <p className="mt-1 text-fg-secondary">
        {formatDuration(itinerary.totalMinutes)} · {itinerary.totalMiles.toLocaleString()} mi
      </p>
      <ol className="mt-4 flex flex-col gap-4">
        {itinerary.legs.map((leg, index) => {
          const layover = itinerary.layovers[index];
          return (
            <li key={`${leg.trainNumber}-${leg.board.station.code}`} className="flex flex-col gap-1">
              <div className="flex items-center gap-2 font-semibold text-fg">
                <TrainFront className="size-4" aria-hidden="true" />
                {leg.trainName} {leg.trainNumber}
              </div>
              <div>
                Depart {leg.board.station.name} · {formatLocalTime(leg.board.departure, leg.board.station.timeZone)}
              </div>
              <div>
                Arrive {leg.alight.station.name} · {formatLocalTime(leg.alight.arrival, leg.alight.station.timeZone)}
              </div>
              <div className="text-xs text-fg-muted">
                {leg.intermediateStops.length} stops · {Math.round(leg.distanceMiles).toLocaleString()} mi
              </div>
              {layover && (
                <div className="mt-2 flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-fg">
                  <Clock className="size-4 shrink-0 text-warning" aria-hidden="true" />
                  Layover at {layover.station.name}: {formatDuration(layover.minutes)}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
