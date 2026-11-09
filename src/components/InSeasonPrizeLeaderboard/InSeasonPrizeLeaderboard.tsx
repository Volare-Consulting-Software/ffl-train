import { ChevronDown, Radio, Trophy } from "lucide-react";

import type { InSeasonPrizeLeaderboardReport } from "@/types/inSeasonPrizeLeaderboardReport";
import type { PrizePeriod } from "@/types/prizePeriod";
import type { PrizeStanding } from "@/types/prizeStanding";

export interface InSeasonPrizeLeaderboardProps {
  report: InSeasonPrizeLeaderboardReport;
}

const TOP_COUNT = 5;

const points = (value: number) => value.toFixed(1);

const weekRange = ({ firstWeek, lastWeek }: PrizePeriod) => `Weeks ${firstWeek}–${lastWeek}`;

/** How much of the period is still to play, counting weeks that haven't kicked off yet. */
function weeksLeftLabel(remaining: number, liveWeek: number | null): string {
  if (remaining > 0) {
    return `${remaining} ${remaining === 1 ? "week" : "weeks"} left`;
  }
  return liveWeek !== null ? "Final week" : "Final";
}

function StandingRow({ standing, rank }: { standing: PrizeStanding; rank: number }) {
  const leading = standing.behind === 0;
  return (
    <li
      className={`grid grid-cols-[2rem_minmax(0,1fr)_4.5rem] items-center gap-3 border-line px-4 ${rank === 1 ? "py-4" : "border-t py-2.5"}`}
    >
      <span className="text-right text-sm tabular-nums text-fg-muted">{rank}</span>
      <span className={`truncate ${leading ? "text-base font-bold text-fg" : "font-semibold text-fg-body"}`}>{standing.ownerName}</span>
      {leading ? (
        <span className="text-right text-lg font-extrabold tabular-nums text-fg">{points(standing.points)}</span>
      ) : (
        <span className="text-right font-semibold tabular-nums text-fg-secondary">
          <span aria-hidden="true">−{points(standing.behind)}</span>
          <span className="sr-only">{points(standing.behind)} behind</span>
        </span>
      )}
    </li>
  );
}

/** The current prize period's points leader and how far everyone else trails, plus each finished period's winner. */
export function InSeasonPrizeLeaderboard({ report }: InSeasonPrizeLeaderboardProps) {
  const { current, winners } = report;
  const leader = current?.standings[0];
  const played = leader !== undefined && current!.standings.some((standing) => standing.points > 0);
  const topStandings = current?.standings.slice(0, TOP_COUNT) ?? [];
  const moreStandings = current?.standings.slice(TOP_COUNT) ?? [];

  return (
    <section aria-labelledby="in-season-prize-leaderboard-title" className="@container flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="in-season-prize-leaderboard-title" className="flex items-center gap-2 text-xl font-semibold text-fg">
          <Trophy className="size-5" aria-hidden="true" />
          {current ? `${weekRange(current.period)} leaderboard` : "In-season prize leaderboard"}
        </h2>
        {current && (
          <p className="flex flex-wrap items-center gap-2 text-sm text-fg-secondary">
            <span className="font-semibold text-fg-body">{weeksLeftLabel(current.remainingWeeks.length, current.liveWeek)}</span>
            {current.liveWeek !== null && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-subtle px-2 py-0.5 text-xs font-semibold text-brand dark:bg-surface-raised dark:text-fg">
                <Radio className="size-3" aria-hidden="true" />
                Week {current.liveWeek} live
              </span>
            )}
          </p>
        )}
      </div>

      <div className={`grid gap-3 ${winners.length > 0 ? "@lg:grid-cols-[minmax(0,1fr)_13rem]" : ""}`}>
        <div className="rounded-lg border border-line bg-surface">
          {played ? (
            <>
              <ol aria-label="Standings" className="flex flex-col">
                {topStandings.map((standing, index) => (
                  <StandingRow key={standing.teamId} standing={standing} rank={index + 1} />
                ))}
              </ol>
              {moreStandings.length > 0 && (
                <details className="group border-t border-line">
                  <summary className="flex cursor-pointer list-none items-center justify-center gap-1 px-4 py-2 text-sm font-semibold text-fg-secondary hover:bg-surface-raised [&::-webkit-details-marker]:hidden">
                    <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden="true" />
                    <span className="group-open:hidden">Show all {current!.standings.length}</span>
                    <span className="hidden group-open:inline">Show top {TOP_COUNT}</span>
                  </summary>
                  <ol aria-label="More standings" className="flex flex-col">
                    {moreStandings.map((standing, index) => (
                      <StandingRow key={standing.teamId} standing={standing} rank={TOP_COUNT + index + 1} />
                    ))}
                  </ol>
                </details>
              )}
            </>
          ) : (
            <p className="px-4 py-6 text-sm text-fg-secondary">No games played yet.</p>
          )}
        </div>

        {winners.length > 0 && (
          <aside
            aria-labelledby="in-season-prize-winners-title"
            className="flex flex-col gap-2 self-start rounded-lg bg-surface-raised p-4"
          >
            <h3 id="in-season-prize-winners-title" className="text-sm font-semibold text-fg-secondary">
              Past winners
            </h3>
            <ul aria-label="Past winners" className="flex flex-col gap-3 text-sm">
              {winners.map((winner) => (
                <li key={winner.period.firstWeek} className="flex items-start gap-2">
                  <Trophy className="mt-0.5 size-4 shrink-0 text-brand dark:text-fg" aria-hidden="true" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="text-xs text-fg-secondary">{weekRange(winner.period)}</span>
                      <span className="tabular-nums text-fg-body">{points(winner.points)}</span>
                    </span>
                    <span className="font-semibold text-fg">{winner.teams.map((team) => team.ownerName).join(" & ")}</span>
                  </span>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>
    </section>
  );
}
