"use client";

import { Loader2, TrainFront } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { DatePicker } from "@/components/DatePicker/DatePicker";
import { FlightDrawer } from "@/components/FlightDrawer/FlightDrawer";
import { ItineraryDetails } from "@/components/ItineraryDetails/ItineraryDetails";
import { ItinerarySkeleton } from "@/components/ItinerarySkeleton/ItinerarySkeleton";
import { MapLegend } from "@/components/MapLegend/MapLegend";
import { TripOddsTable } from "@/components/TripOddsTable/TripOddsTable";
import { TripTable } from "@/components/TripTable/TripTable";
import type { FlightPanelState } from "@/types/flightPanelState";
import type { TripDetail } from "@/types/tripDetail";
import type { TripOddsReport } from "@/types/tripOddsReport";
import type { TripSummary } from "@/types/tripSummary";

const RouteMap = dynamic(() => import("@/components/RouteMap/RouteMap").then((module) => module.RouteMap), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-surface-sunken" />,
});

const LIMIT_PAGE = "/limit-max";

export interface TripDashboardProps {
  initialDate: string;
  initialSummaries: TripSummary[];
  tripOdds: TripOddsReport | null;
}

export function TripDashboard({ initialDate, initialSummaries, tripOdds }: TripDashboardProps) {
  const router = useRouter();
  const [date, setDate] = useState(initialDate);
  const [summaries, setSummaries] = useState(initialSummaries);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [selectedPickId, setSelectedPickId] = useState<number | null>(initialSummaries[0]?.pick.id ?? null);
  const [detail, setDetail] = useState<TripDetail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [loadedRouteKey, setLoadedRouteKey] = useState<string | null>(null);
  const [flightDrawer, setFlightDrawer] = useState<FlightPanelState | null>(null);

  useEffect(() => {
    if (selectedPickId === null) {
      return;
    }
    let cancelled = false;
    const routeKey = `${selectedPickId}|${date}`;
    fetch(`/api/trips/${selectedPickId}?date=${date}`)
      .then(async (response) => {
        const body = await response.json();
        if (cancelled) {
          return;
        }
        setLoadedRouteKey(routeKey);
        if (response.ok) {
          setDetail(body as TripDetail);
          setDetailError(null);
        } else {
          setDetail(null);
          setDetailError((body as { error?: string }).error ?? "Route unavailable");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadedRouteKey(routeKey);
          setDetailError("Route unavailable");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [selectedPickId, date]);

  const loadingRoute = selectedPickId !== null && loadedRouteKey !== `${selectedPickId}|${date}`;

  const changeDate = useCallback(
    async (nextDate: string) => {
      if (!nextDate || nextDate === date) {
        return;
      }
      const check = await fetch(`/api/dates/check?date=${nextDate}`);
      if (check.ok && !((await check.json()) as { allowed: boolean }).allowed) {
        router.push(LIMIT_PAGE);
        return;
      }
      setDate(nextDate);
      setFlightDrawer(null);
      setLoadingTrips(true);
      window.history.replaceState(null, "", `/?date=${nextDate}`);
      try {
        const response = await fetch(`/api/trips?date=${nextDate}`);
        if (response.ok) {
          setSummaries((await response.json()) as TripSummary[]);
        }
      } finally {
        setLoadingTrips(false);
      }
    },
    [date, router],
  );

  const openFlights = useCallback(
    async (summary: TripSummary) => {
      if (!summary.airport) {
        return;
      }
      const base = { airport: summary.airport, pickId: summary.pick.id };
      setFlightDrawer({ ...base, status: "loading" });
      try {
        const response = await fetch(`/api/flights?pickId=${summary.pick.id}&date=${date}`);
        if (response.status === 429) {
          router.push(LIMIT_PAGE);
          return;
        }
        const body = await response.json();
        setFlightDrawer(
          response.ok
            ? { ...base, status: "ready", quote: body }
            : { ...base, status: "error", message: body.error ?? "Flight lookup failed" },
        );
      } catch {
        setFlightDrawer({ ...base, status: "error", message: "Flight lookup failed. Try again in a moment." });
      }
    },
    [date, router],
  );

  const closeFlights = useCallback(() => setFlightDrawer(null), []);

  return (
    <main className="flex w-full flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-1 inline-flex size-10 items-center justify-center rounded-lg bg-brand text-on-brand">
            <TrainFront className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-fg">Fantasy Football Train Ride</h1>
            <p className="mt-1 text-fg-secondary">May allah have mercy on your soul...</p>
          </div>
        </div>
        <DatePicker label="Departure date" value={date} onChange={(nextDate) => void changeDate(nextDate)} />
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section aria-label="Picked destinations" className="flex flex-col gap-6">
          <TripTable
            summaries={summaries}
            selectedPickId={selectedPickId}
            loading={loadingTrips}
            onSelect={setSelectedPickId}
            onAirportClick={(summary) => void openFlights(summary)}
          />
          {tripOdds && <TripOddsTable report={tripOdds} />}
        </section>
        <section aria-label="Route map" className="flex flex-col gap-3">
          <div className="relative h-[32rem] overflow-hidden rounded-lg border border-line" aria-busy={loadingRoute}>
            <RouteMap detail={detail} />
            {loadingRoute && (
              <div className="absolute inset-0 z-[500] flex animate-pulse items-center justify-center bg-surface-sunken/70">
                <span className="flex items-center gap-2 rounded-full bg-surface-overlay px-4 py-2 text-sm font-medium text-fg shadow-[var(--shadow-overlay)]">
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Loading route…
                </span>
              </div>
            )}
          </div>
          <MapLegend />
          {loadingRoute ? (
            <ItinerarySkeleton />
          ) : (
            <>
              {detailError && <p className="text-sm text-error">{detailError}</p>}
              {detail && <ItineraryDetails detail={detail} />}
            </>
          )}
        </section>
      </div>

      <FlightDrawer state={flightDrawer} onClose={closeFlights} />
    </main>
  );
}
