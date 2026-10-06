"use client";

import { TrainFront } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { FlightDrawer } from "@/components/FlightDrawer/FlightDrawer";
import { ItineraryDetails } from "@/components/ItineraryDetails/ItineraryDetails";
import { MapLegend } from "@/components/MapLegend/MapLegend";
import { NextPickerBanner } from "@/components/NextPickerBanner/NextPickerBanner";
import { TripTable } from "@/components/TripTable/TripTable";
import type { FlightPanelState } from "@/types/flightPanelState";
import type { PickerSuggestion } from "@/types/pickerSuggestion";
import type { TripDetail } from "@/types/tripDetail";
import type { TripSummary } from "@/types/tripSummary";

const RouteMap = dynamic(() => import("@/components/RouteMap/RouteMap").then((module) => module.RouteMap), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-surface-sunken" />,
});

const LIMIT_PAGE = "/limit-max";

export interface TripDashboardProps {
  initialDate: string;
  initialSummaries: TripSummary[];
  suggestion: PickerSuggestion | null;
}

export function TripDashboard({ initialDate, initialSummaries, suggestion }: TripDashboardProps) {
  const router = useRouter();
  const [date, setDate] = useState(initialDate);
  const [summaries, setSummaries] = useState(initialSummaries);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [selectedPickId, setSelectedPickId] = useState<number | null>(initialSummaries[0]?.pick.id ?? null);
  const [detail, setDetail] = useState<TripDetail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [flightDrawer, setFlightDrawer] = useState<FlightPanelState | null>(null);

  useEffect(() => {
    if (selectedPickId === null) {
      return;
    }
    let cancelled = false;
    fetch(`/api/trips/${selectedPickId}?date=${date}`)
      .then(async (response) => {
        const body = await response.json();
        if (cancelled) {
          return;
        }
        if (response.ok) {
          setDetail(body as TripDetail);
          setDetailError(null);
        } else {
          setDetail(null);
          setDetailError((body as { error?: string }).error ?? "Route unavailable");
        }
      })
      .catch(() => !cancelled && setDetailError("Route unavailable"));
    return () => {
      cancelled = true;
    };
  }, [selectedPickId, date]);

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
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-1 inline-flex size-10 items-center justify-center rounded-lg bg-brand text-on-brand">
            <TrainFront className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-fg">Last-place train ride</h1>
            <p className="mt-1 text-fg-secondary">Every trip leaves Charlotte on the selected date. Pick a row to see its route.</p>
          </div>
        </div>
        <label className="flex flex-col gap-1 text-sm font-semibold text-fg">
          Departure date
          <input
            type="date"
            value={date}
            onChange={(event) => void changeDate(event.target.value)}
            className="h-10 rounded-lg border border-line bg-surface-sunken px-3 font-normal text-fg focus-visible:border-brand"
          />
        </label>
      </header>

      <NextPickerBanner suggestion={suggestion} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section aria-label="Picked destinations">
          <TripTable
            summaries={summaries}
            selectedPickId={selectedPickId}
            loading={loadingTrips}
            onSelect={setSelectedPickId}
            onAirportClick={(summary) => void openFlights(summary)}
          />
        </section>
        <section aria-label="Route map" className="flex flex-col gap-3">
          <div className="h-[28rem] overflow-hidden rounded-lg border border-line">
            <RouteMap detail={detail} summaries={summaries} />
          </div>
          <MapLegend />
          {detailError && <p className="text-sm text-error">{detailError}</p>}
          {detail && <ItineraryDetails detail={detail} />}
        </section>
      </div>

      <FlightDrawer state={flightDrawer} onClose={closeFlights} />
    </main>
  );
}
