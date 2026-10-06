"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { FlightPanel } from "@/components/FlightPanel/FlightPanel";
import { ItineraryDetails } from "@/components/ItineraryDetails/ItineraryDetails";
import { NextPickerBanner } from "@/components/NextPickerBanner/NextPickerBanner";
import { SelectedDateChips } from "@/components/SelectedDateChips/SelectedDateChips";
import { TripTable } from "@/components/TripTable/TripTable";
import type { FlightPanelState } from "@/types/flightPanelState";
import type { PickerSuggestion } from "@/types/pickerSuggestion";
import type { TripDetail } from "@/types/tripDetail";
import type { TripSummary } from "@/types/tripSummary";

const RouteMap = dynamic(() => import("@/components/RouteMap/RouteMap").then((module) => module.RouteMap), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800" />,
});

const LIMIT_PAGE = "/limit-max";

export interface TripDashboardProps {
  initialDate: string;
  initialSummaries: TripSummary[];
  selectedDates: string[];
  suggestion: PickerSuggestion | null;
}

export function TripDashboard({ initialDate, initialSummaries, selectedDates, suggestion }: TripDashboardProps) {
  const router = useRouter();
  const [date, setDate] = useState(initialDate);
  const [summaries, setSummaries] = useState(initialSummaries);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [selectedPickId, setSelectedPickId] = useState<number | null>(initialSummaries[0]?.pick.id ?? null);
  const [detail, setDetail] = useState<TripDetail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [flightPanel, setFlightPanel] = useState<FlightPanelState | null>(null);

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
      setFlightPanel(null);
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

  const showFlight = useCallback(
    async (summary: TripSummary) => {
      if (!summary.airport) {
        return;
      }
      setFlightPanel({ airport: summary.airport, pickId: summary.pick.id, status: "loading" });
      const response = await fetch(`/api/flights?pickId=${summary.pick.id}&date=${date}`);
      if (response.status === 429) {
        router.push(LIMIT_PAGE);
        return;
      }
      const body = await response.json();
      setFlightPanel(
        response.ok
          ? { airport: summary.airport, pickId: summary.pick.id, status: "ready", quote: body }
          : { airport: summary.airport, pickId: summary.pick.id, status: "error", message: body.error ?? "Flight lookup failed" },
      );
    },
    [date, router],
  );

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Last-place train ride</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Every trip leaves Charlotte (CLT) on the selected date. Pick a row to see its route.
          </p>
        </div>
        <div className="flex flex-col gap-2 md:items-end">
          <label className="flex items-center gap-2 text-sm font-medium">
            Departure date
            <input
              type="date"
              value={date}
              onChange={(event) => void changeDate(event.target.value)}
              className="rounded-md border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <SelectedDateChips dates={selectedDates} activeDate={date} onSelect={(chosen) => void changeDate(chosen)} />
        </div>
      </header>

      <NextPickerBanner suggestion={suggestion} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="flex flex-col gap-4">
          <TripTable
            summaries={summaries}
            selectedPickId={selectedPickId}
            loading={loadingTrips}
            onSelect={setSelectedPickId}
            onAirportClick={(summary) => void showFlight(summary)}
          />
          {flightPanel && <FlightPanel state={flightPanel} onClose={() => setFlightPanel(null)} />}
        </section>
        <section className="flex flex-col gap-4">
          <div className="h-[28rem] overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
            <RouteMap detail={detail} summaries={summaries} />
          </div>
          {detailError && <p className="text-sm text-red-700 dark:text-red-400">{detailError}</p>}
          {detail && <ItineraryDetails detail={detail} />}
        </section>
      </div>
    </main>
  );
}
