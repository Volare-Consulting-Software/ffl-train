"use client";

import { AlertCircle, Loader2, Moon, X } from "lucide-react";
import { type KeyboardEvent, useState } from "react";

import { useDrawerFocusTrap } from "@/hooks/useDrawerFocusTrap";
import { formatIsoDate, formatRecord } from "@/lib/format";
import type { MoonPanelState } from "@/types/moonPanelState";
import type { MoonSplit } from "@/types/moonSplit";
import type { MoonSplitReport } from "@/types/moonSplitReport";
import type { MoonSunday } from "@/types/moonSunday";
import type { MoonWeek } from "@/types/moonWeek";

export interface MoonDrawerProps {
  state: MoonPanelState | null;
  onClose: () => void;
}

/** Right-side drawer comparing the moon team's crescent moon Sundays with every other Sunday. */
export function MoonDrawer({ state, onClose }: MoonDrawerProps) {
  const panelRef = useDrawerFocusTrap(state !== null, onClose);

  if (!state) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[1000]">
      <div className="drawer-scrim absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="moon-drawer-title"
        className="drawer-panel absolute inset-y-0 right-0 flex w-full max-w-[480px] flex-col bg-surface-overlay text-fg-body shadow-[var(--shadow-overlay)]"
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div>
            <h2 id="moon-drawer-title" className="flex items-center gap-2 text-2xl font-bold text-fg">
              <Moon className="size-5" aria-hidden="true" />
              Crescent Moon Summary
            </h2>
            <p className="mt-1 text-sm text-fg-secondary">The power of Allah</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close crescent moon summary"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-fg hover:bg-brand-subtle dark:hover:bg-surface-raised"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </header>

        {state.status === "ready" ? (
          <MoonSummaryTabs report={state.report} />
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-5" aria-live="polite">
            {state.status === "loading" && (
              <p className="flex items-center gap-2 text-fg-secondary">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Checking the moon…
              </p>
            )}
            {state.status === "error" && (
              <div role="alert" className="flex gap-3 rounded-lg border border-error/40 bg-error/10 p-4 text-sm">
                <AlertCircle className="mt-0.5 size-5 shrink-0 text-error" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-fg">Couldn&apos;t load moon stats</p>
                  <p className="mt-1">{state.message}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

type MoonTab = "history" | "upcoming";

const TABS: { id: MoonTab; label: string }[] = [
  { id: "history", label: "History" },
  { id: "upcoming", label: "Upcoming" },
];

/** History and Upcoming tabs; the tab bar stays put while the selected list scrolls. Opens on History each time. */
function MoonSummaryTabs({ report }: { report: MoonSplitReport }) {
  const [selected, setSelected] = useState<MoonTab>("history");
  const crescentsLeft = report.upcoming.filter((week) => week.isCrescent).length;

  // Arrow keys move between tabs, as in the WAI-ARIA tabs pattern.
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
      return;
    }
    event.preventDefault();
    const index = TABS.findIndex((tab) => tab.id === selected);
    const next = TABS[(index + (event.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length]!;
    setSelected(next.id);
    document.getElementById(`moon-tab-${next.id}`)?.focus();
  };

  return (
    <>
      <div role="tablist" aria-label="Crescent moon summary" onKeyDown={onKeyDown} className="flex gap-1 border-b border-line px-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            id={`moon-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={selected === tab.id}
            aria-controls={`moon-panel-${tab.id}`}
            tabIndex={selected === tab.id ? 0 : -1}
            onClick={() => setSelected(tab.id)}
            className={`-mb-px border-b-2 px-3 py-3 text-sm font-semibold ${
              selected === tab.id ? "border-brand text-fg dark:border-fg" : "border-transparent text-fg-secondary hover:text-fg"
            }`}
          >
            {tab.label}
            {tab.id === "upcoming" && (
              <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-xs font-bold text-on-brand tabular-nums">
                {crescentsLeft}
                <span className="sr-only"> crescent {crescentsLeft === 1 ? "Sunday" : "Sundays"} left</span>
              </span>
            )}
          </button>
        ))}
      </div>

      <div
        id={`moon-panel-${selected}`}
        role="tabpanel"
        aria-labelledby={`moon-tab-${selected}`}
        className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-contain px-6 py-5"
      >
        {selected === "history" ? <HistoryPanel report={report} /> : <UpcomingPanel weeks={report.upcoming} />}
      </div>
    </>
  );
}

function HistoryPanel({ report }: { report: MoonSplitReport }) {
  if (report.weeks.length === 0) {
    return <p>No games have been played yet this season.</p>;
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <SplitCard title="Crescent moon" split={report.crescent} />
        <SplitCard title="Every other Sunday" split={report.other} />
      </div>
      <ol aria-label="Week by week" className="flex flex-col gap-3">
        {report.weeks.map((week) => (
          <WeekRow key={week.week} week={week} />
        ))}
      </ol>
    </>
  );
}

function UpcomingPanel({ weeks }: { weeks: MoonSunday[] }) {
  if (weeks.length === 0) {
    return <p>The regular season is over.</p>;
  }

  return (
    <ol aria-label="Upcoming Sundays" className="flex flex-col gap-3">
      {weeks.map((week) => (
        <WeekRow key={week.week} week={week} />
      ))}
    </ol>
  );
}

const RESULT_LABELS = { W: "Win", L: "Loss", T: "Tie" } as const;

/** Played crescent weeks get a solid fill; upcoming ones a lighter fill and a bold dashed outline, since they haven't happened yet. */
function crescentStyle(week: MoonSunday | MoonWeek): string {
  if (!week.isCrescent) {
    return "border border-line";
  }
  return "result" in week ? "border border-brand/50 bg-surface-selected" : "bg-surface-selected/40";
}

/** A dashed outline drawn in SVG, because CSS dashed borders don't allow setting the dash length. */
function DashedOutline() {
  return (
    <svg className="pointer-events-none absolute inset-0 size-full overflow-visible text-brand dark:text-fg" aria-hidden="true">
      <rect
        x="1"
        y="1"
        rx="7"
        style={{ width: "calc(100% - 2px)", height: "calc(100% - 2px)" }}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="12 8"
      />
    </svg>
  );
}

/** One Sunday's Moon and opponent, with the final score once the week has been played. */
function WeekRow({ week }: { week: MoonSunday | MoonWeek }) {
  return (
    <li
      aria-label={`Week ${week.week}`}
      className={`relative rounded-lg p-3 ${crescentStyle(week)}`}
    >
      {week.isCrescent && !("result" in week) && <DashedOutline />}
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span>
          <span className="font-semibold text-fg">Week {week.week}</span>
          <span className="text-fg-secondary"> · {formatIsoDate(week.sunday)}</span>
        </span>
        {week.isCrescent && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand dark:text-fg">
            <Moon className="size-3.5" aria-hidden="true" />
            Crescent
          </span>
        )}
      </div>
      <p className="mt-0.5 text-sm text-fg-secondary">vs {week.opponentName}</p>

      <div className="mt-2 flex items-end justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xl font-bold text-fg tabular-nums">
            {week.illuminationPercent}% <span className="text-sm font-medium text-fg-secondary">lit · {week.phaseName}</span>
          </p>
          <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-surface-sunken" aria-hidden="true">
            <span className="block h-full rounded-full bg-brand" style={{ width: `${week.illuminationPercent}%` }} />
          </span>
        </div>
        {"result" in week && (
          <div className="shrink-0 text-right">
            <p className="text-sm font-semibold text-fg">{RESULT_LABELS[week.result]}</p>
            <p className="text-sm tabular-nums">
              <span className="font-semibold text-fg">{week.pointsFor.toFixed(1)}</span>
              <span className="text-fg-secondary"> – {week.opponentPoints.toFixed(1)}</span>
            </p>
          </div>
        )}
      </div>
    </li>
  );
}

function SplitCard({ title, split }: { title: string; split: MoonSplit }) {
  return (
    <section aria-label={title} className="rounded-lg bg-surface-raised p-4">
      <h3 className="text-sm font-medium text-fg-secondary">{title}</h3>
      <p className="mt-1 text-3xl font-extrabold tracking-tight text-fg tabular-nums">
        {formatRecord(split.wins, split.losses, split.ties)}
      </p>
      <dl className="mt-3 flex flex-col gap-1 text-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-fg-secondary">Pts per game</dt>
          <dd className="font-semibold text-fg tabular-nums">{split.averagePoints === null ? "–" : split.averagePoints.toFixed(1)}</dd>
        </div>
      </dl>
    </section>
  );
}
