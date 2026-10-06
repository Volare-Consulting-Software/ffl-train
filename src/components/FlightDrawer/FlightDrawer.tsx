"use client";

import { AlertCircle, ExternalLink, Loader2, Plane, X } from "lucide-react";
import { useEffect, useRef } from "react";

import { formatClockTime, formatDuration, formatIsoDate, formatUsd } from "@/lib/format";
import type { FlightPanelState } from "@/types/flightPanelState";
import type { FlightQuote } from "@/types/flightQuote";

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface FlightDrawerProps {
  state: FlightPanelState | null;
  onClose: () => void;
}

/** Right-side drawer with the fare from the destination's airport back to Charlotte. */
export function FlightDrawer({ state, onClose }: FlightDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const isOpen = state !== null;

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const trigger = document.activeElement as HTMLElement | null;
    panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) {
        return;
      }
      // Keep keyboard focus inside the drawer while it is open.
      const focusable = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      trigger?.focus();
    };
  }, [isOpen, onClose]);

  if (!state) {
    return null;
  }
  const { airport } = state;

  return (
    <div className="fixed inset-0 z-[1000]">
      <div className="drawer-scrim absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="flight-drawer-title"
        className="drawer-panel absolute inset-y-0 right-0 flex w-full max-w-[480px] flex-col bg-surface-overlay text-fg-body shadow-[var(--shadow-overlay)]"
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div>
            <h2 id="flight-drawer-title" className="flex items-center gap-2 text-2xl font-bold text-fg">
              <Plane className="size-5" aria-hidden="true" />
              {airport.code} to CLT
            </h2>
            <p className="mt-1 text-sm text-fg-secondary">
              {airport.name}, {airport.municipality}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close fare details"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-fg hover:bg-brand-subtle dark:hover:bg-surface-raised"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5" aria-live="polite">
          {state.status === "loading" && (
            <p className="flex items-center gap-2 text-fg-secondary">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Looking up fares…
            </p>
          )}
          {state.status === "error" && (
            <div role="alert" className="flex gap-3 rounded-lg border border-error/40 bg-error/10 p-4 text-sm">
              <AlertCircle className="mt-0.5 size-5 shrink-0 text-error" aria-hidden="true" />
              <div>
                <p className="font-semibold text-fg">Couldn&apos;t load fares</p>
                <p className="mt-1">{state.message}</p>
              </div>
            </div>
          )}
          {state.status === "ready" && <FareDetails quote={state.quote} />}
        </div>

        {state.status === "ready" && state.quote.googleFlightsUrl && (
          <footer className="border-t border-line px-6 py-4">
            <a
              href={state.quote.googleFlightsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-line-strong px-4 font-semibold text-fg hover:bg-surface-sunken"
            >
              View on Google Flights
              <ExternalLink className="size-4" aria-hidden="true" />
            </a>
          </footer>
        )}
      </div>
    </div>
  );
}

function FareDetails({ quote }: { quote: FlightQuote }) {
  if (quote.priceUsd === null) {
    return <p>No fares found for {formatIsoDate(quote.flightDate)}.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-medium text-fg-secondary">Cheapest one-way</p>
        <p className="text-5xl font-extrabold tracking-tight text-fg">{formatUsd(quote.priceUsd)}</p>
        <p className="mt-1 text-sm text-fg-secondary">Flying {formatIsoDate(quote.flightDate)}, the day the train arrives</p>
      </div>

      <dl className="grid grid-cols-3 gap-4 rounded-lg bg-surface-raised p-4">
        <div>
          <dt className="text-xs font-medium text-fg-secondary">Distance</dt>
          <dd className="text-lg font-bold text-fg">{quote.flightDistanceMiles.toLocaleString()} mi</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-fg-secondary">Connections</dt>
          <dd className="text-lg font-bold text-fg">
            {quote.connections === null ? "–" : quote.connections === 0 ? "Nonstop" : quote.connections}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-fg-secondary">Flight time</dt>
          <dd className="text-lg font-bold text-fg">{quote.durationMinutes !== null ? formatDuration(quote.durationMinutes) : "–"}</dd>
        </div>
      </dl>

      {quote.segments.length > 0 && (
        <section>
          <h3 className="text-base font-semibold text-fg">Flights</h3>
          <ol className="mt-3 flex flex-col gap-3">
            {quote.segments.map((segment, index) => (
              <li key={`${segment.flightNumber}-${index}`} className="rounded-lg border border-line p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-fg">{segment.airline}</span>
                  <span className="font-mono text-sm text-fg-secondary">{segment.flightNumber}</span>
                </div>
                <div className="mt-1 text-sm tabular-nums">
                  {segment.departureAirport} {formatClockTime(segment.departureTime)} → {segment.arrivalAirport}{" "}
                  {formatClockTime(segment.arrivalTime)}
                </div>
                {segment.durationMinutes !== null && (
                  <div className="text-xs text-fg-muted">{formatDuration(segment.durationMinutes)}</div>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      <p className="text-xs text-fg-muted">
        Price as of {new Date(quote.fetchedAt).toLocaleString()}. Saved fares are reused and don&apos;t count against the weekly date
        limit.
      </p>
    </div>
  );
}
