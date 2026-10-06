import { Dices } from "lucide-react";

import { InfoTooltip } from "@/components/InfoTooltip/InfoTooltip";
import { LOSER_BRACKET_SIZE } from "@/logic/LoserBracketSimulator";
import type { TripOddsReport } from "@/types/tripOddsReport";

export interface TripOddsTableProps {
  report: TripOddsReport;
}

const percent = (value: number) => `${(value * 100).toFixed(1)}%`;

/** Each person's chance of riding the train, as the ultimate loser or as the wheel's pick. */
export function TripOddsTable({ report }: TripOddsTableProps) {
  const highest = Math.max(...report.teams.map((team) => team.tripProbability), 0.0001);
  const bracketCutoff = report.teams.length - LOSER_BRACKET_SIZE;

  return (
    <section aria-labelledby="trip-odds-title" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="trip-odds-title" className="flex items-center gap-2 text-xl font-semibold text-fg">
          <Dices className="size-5" aria-hidden="true" />
          Trip odds
        </h2>
        {report.isSample && (
          <span className="rounded-full bg-surface-sunken px-2.5 py-0.5 text-xs font-medium text-fg">Sample league data</span>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-raised text-fg-secondary">
            <tr>
              <th className="h-12 whitespace-nowrap px-4 font-semibold">Person</th>
              <th className="h-12 whitespace-nowrap px-4 text-right font-semibold">Standing</th>
              <th className="h-12 whitespace-nowrap px-4 text-right font-semibold">Record</th>
              <th className="h-12 whitespace-nowrap px-4 text-right font-semibold">Points for</th>
              <th className="h-12 whitespace-nowrap px-4 text-right font-semibold">Loser bracket</th>
              <th className="h-12 whitespace-nowrap px-4 text-right font-semibold">
                <span className="inline-flex items-center gap-1.5">
                  Last place
                  <InfoTooltip label="How last place odds are calculated">
                    We replay the rest of the season {report.simulations.toLocaleString()} times. Your record so far is locked
                    in, and each remaining game is scored from your points for per game, so high scorers win more of them.
                    Standings sort by record, then points for. The bottom 6 play the loser bracket, where 11th and 12th only
                    have to lose twice instead of three times. This is how often you finished dead last.
                  </InfoTooltip>
                </span>
              </th>
              <th className="h-12 whitespace-nowrap px-4 font-semibold">
                <span className="inline-flex items-center gap-1.5">
                  On the trip
                  <InfoTooltip label="How trip odds are calculated">
                    Last place rides, plus one of the other {report.teams.length - 1} people picked by the wheel. So a person&apos;s
                    odds are their chance of finishing last, plus 1 in {report.teams.length - 1} of the rest:
                    <span className="mt-1 block font-semibold">
                      Last place + (1 − Last place) ÷ {report.teams.length - 1}
                    </span>
                  </InfoTooltip>
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {report.teams.map((team) => (
              <tr key={team.teamId} className="border-t border-line">
                <td className="px-4 py-3 font-semibold text-fg">{team.ownerName}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                  {team.standing}
                  {team.standing > bracketCutoff && <span className="sr-only"> (currently in the loser bracket)</span>}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                  {team.wins}-{team.losses}
                  {team.ties > 0 ? `-${team.ties}` : ""}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">{team.pointsFor.toFixed(1)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">{percent(team.loserBracketProbability)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">{percent(team.ultimateLoserProbability)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="w-12 text-right font-bold tabular-nums text-fg">{percent(team.tripProbability)}</span>
                    <span className="h-2 min-w-16 flex-1 overflow-hidden rounded-full bg-surface-sunken" aria-hidden="true">
                      <span className="block h-full rounded-full bg-brand" style={{ width: `${(team.tripProbability / highest) * 100}%` }} />
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </section>
  );
}
