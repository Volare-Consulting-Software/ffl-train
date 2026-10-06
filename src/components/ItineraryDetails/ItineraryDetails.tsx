import { formatDuration, formatLocalTime } from "@/lib/format";
import type { TripDetail } from "@/types/tripDetail";

export interface ItineraryDetailsProps {
  detail: TripDetail;
}

export function ItineraryDetails({ detail }: ItineraryDetailsProps) {
  const { itinerary } = detail;

  return (
    <div className="rounded-lg border border-neutral-200 p-4 text-sm dark:border-neutral-800">
      <h2 className="font-semibold">
        Charlotte → {detail.pick.destinationName}
        <span className="ml-2 font-normal text-neutral-500">
          {formatDuration(itinerary.totalMinutes)} · {itinerary.totalMiles.toLocaleString()} mi
        </span>
      </h2>
      <ol className="mt-3 flex flex-col gap-3">
        {itinerary.legs.map((leg, index) => {
          const layover = itinerary.layovers[index];
          return (
            <li key={`${leg.trainNumber}-${leg.board.station.code}`} className="flex flex-col gap-1">
              <div className="font-medium">
                {leg.trainName} {leg.trainNumber}
              </div>
              <div>
                Depart {leg.board.station.name} · {formatLocalTime(leg.board.departure, leg.board.station.timeZone)}
              </div>
              <div>
                Arrive {leg.alight.station.name} · {formatLocalTime(leg.alight.arrival, leg.alight.station.timeZone)}
              </div>
              <div className="text-xs text-neutral-500">
                {leg.intermediateStops.length} stops · {Math.round(leg.distanceMiles).toLocaleString()} mi
              </div>
              {layover && (
                <div className="mt-1 rounded bg-amber-50 px-2 py-1 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
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
