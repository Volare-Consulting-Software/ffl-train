import { inject, injectable } from "tsyringe";

import { type FantasyLeagueClient, FantasyLeagueClientToken } from "@/interfaces/fantasyLeagueClient";
import type { InSeasonPrizeLeaderboardService } from "@/interfaces/inSeasonPrizeLeaderboardService";
import type { InSeasonPrizeLeaderboardReport } from "@/types/inSeasonPrizeLeaderboardReport";
import type { LeagueMatchup } from "@/types/leagueMatchup";
import type { LeagueTeam } from "@/types/leagueTeam";
import type { PrizePeriod } from "@/types/prizePeriod";
import type { PrizePeriodLeaderboard } from "@/types/prizePeriodLeaderboard";
import type { PrizePeriodWinner } from "@/types/prizePeriodWinner";
import type { PrizeStanding } from "@/types/prizeStanding";

/** The regular season split into three prizes of roughly equal length. */
const PRIZE_PERIODS: readonly PrizePeriod[] = [
  { firstWeek: 1, lastWeek: 4 },
  { firstWeek: 5, lastWeek: 9 },
  { firstWeek: 10, lastWeek: 14 },
];

interface PeriodProgress {
  period: PrizePeriod;
  matchups: LeagueMatchup[];
  startedWeeks: number[];
  remainingWeeks: number[];
}

/**
 * Totals each team's regular-season points within each prize period. A week has started once its NFL Sunday
 * arrives or ESPN has finalized it, and a week in progress counts its live points.
 */
@injectable()
export class LeagueInSeasonPrizeLeaderboardService implements InSeasonPrizeLeaderboardService {
  constructor(@inject(FantasyLeagueClientToken) private readonly leagueClient: FantasyLeagueClient) {}

  async getReport(season: number, today: string): Promise<InSeasonPrizeLeaderboardReport> {
    const [league, sundays] = await Promise.all([this.leagueClient.getSeason(season), this.leagueClient.getWeekSundays(season)]);
    const byWeek = new Map<number, LeagueMatchup[]>();
    for (const matchup of league.matchups) {
      byWeek.set(matchup.week, [...(byWeek.get(matchup.week) ?? []), matchup]);
    }
    const hasStarted = (week: number) => {
      const sunday = sundays.get(week);
      return (sunday !== undefined && sunday <= today) || (byWeek.get(week)?.some((matchup) => matchup.completed) ?? false);
    };

    const started = PRIZE_PERIODS.map((period): PeriodProgress => {
      const weeks = Array.from({ length: period.lastWeek - period.firstWeek + 1 }, (_, index) => period.firstWeek + index);
      const startedWeeks = weeks.filter(hasStarted);
      return {
        period,
        matchups: startedWeeks.flatMap((week) => byWeek.get(week) ?? []),
        startedWeeks,
        remainingWeeks: weeks.filter((week) => !hasStarted(week)),
      };
    }).filter((progress) => progress.startedWeeks.length > 0);

    const current = started.at(-1);
    return {
      season,
      current: current ? toLeaderboard(current, league.teams) : null,
      winners: started
        .slice(0, -1)
        .filter((progress) => progress.remainingWeeks.length === 0 && progress.matchups.every((matchup) => matchup.completed))
        .map((progress) => toWinner(progress, league.teams)),
    };
  }
}

function toLeaderboard({ period, matchups, remainingWeeks }: PeriodProgress, teams: LeagueTeam[]): PrizePeriodLeaderboard {
  const liveWeek = matchups.find((matchup) => !matchup.completed)?.week ?? null;
  return { period, liveWeek, remainingWeeks, standings: rank(matchups, teams) };
}

function toWinner({ period, matchups }: PeriodProgress, teams: LeagueTeam[]): PrizePeriodWinner {
  const leaders = rank(matchups, teams).filter((standing) => standing.behind === 0);
  return {
    period,
    points: leaders[0]?.points ?? 0,
    teams: leaders.map(({ teamId, ownerName }) => ({ teamId, ownerName })),
  };
}

/** Sums each team's points across the matchups, highest first with ties broken by team id. */
function rank(matchups: LeagueMatchup[], teams: LeagueTeam[]): PrizeStanding[] {
  const points = new Map(teams.map((team) => [team.teamId, 0]));
  for (const matchup of matchups) {
    points.set(matchup.homeTeamId, (points.get(matchup.homeTeamId) ?? 0) + matchup.homePoints);
    if (matchup.awayTeamId !== null) {
      points.set(matchup.awayTeamId, (points.get(matchup.awayTeamId) ?? 0) + matchup.awayPoints);
    }
  }
  const ownerNames = new Map(teams.map((team) => [team.teamId, team.ownerName]));
  const sorted = [...points.entries()]
    .map(([teamId, total]): [number, number] => [teamId, roundPoints(total)])
    .sort(([aId, a], [bId, b]) => b - a || aId - bId);
  const leaderPoints = sorted[0]?.[1] ?? 0;
  return sorted.map(([teamId, total]) => ({
    teamId,
    ownerName: ownerNames.get(teamId) ?? `Team ${teamId}`,
    points: total,
    behind: roundPoints(leaderPoints - total),
  }));
}

/** ESPN scores carry two decimals; rounding keeps summed floats from splitting ties. */
function roundPoints(points: number): number {
  return Math.round(points * 100) / 100;
}
