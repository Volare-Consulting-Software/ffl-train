import { inject, injectable } from "tsyringe";

import { type FantasyLeagueClient, FantasyLeagueClientToken } from "@/interfaces/fantasyLeagueClient";
import type { MonthlyLeaderboardService } from "@/interfaces/monthlyLeaderboardService";
import type { LeagueMatchup } from "@/types/leagueMatchup";
import type { LeagueTeam } from "@/types/leagueTeam";
import type { MonthLeaderboard } from "@/types/monthLeaderboard";
import type { MonthlyLeaderboardReport } from "@/types/monthlyLeaderboardReport";
import type { MonthStanding } from "@/types/monthStanding";
import type { MonthWinner } from "@/types/monthWinner";

interface MonthWeeks {
  month: string;
  weeks: LeagueMatchup[][];
}

/**
 * Totals each team's points by month, regular season and playoffs alike. A week belongs to the month of its
 * NFL Sunday, so a Monday game that spills into the next month still counts for the previous one.
 */
@injectable()
export class LeagueMonthlyLeaderboardService implements MonthlyLeaderboardService {
  constructor(@inject(FantasyLeagueClientToken) private readonly leagueClient: FantasyLeagueClient) {}

  async getReport(season: number, today: string): Promise<MonthlyLeaderboardReport> {
    const [league, sundays] = await Promise.all([this.leagueClient.getSeason(season), this.leagueClient.getWeekSundays(season)]);
    const byWeek = new Map<number, LeagueMatchup[]>();
    for (const matchup of [...league.matchups, ...league.playoffMatchups]) {
      byWeek.set(matchup.week, [...(byWeek.get(matchup.week) ?? []), matchup]);
    }

    const months: MonthWeeks[] = [];
    const upcoming: { week: number; month: string }[] = [];
    for (const week of [...byWeek.keys()].sort((a, b) => a - b)) {
      const sunday = sundays.get(week);
      if (!sunday) {
        console.warn(`No Sunday found for week ${week}; leaving it out of the monthly leaderboard`);
        continue;
      }
      const month = sunday.slice(0, 7);
      if (sunday > today) {
        upcoming.push({ week, month });
        continue;
      }
      const last = months.at(-1);
      if (last?.month === month) {
        last.weeks.push(byWeek.get(week)!);
      } else {
        months.push({ month, weeks: [byWeek.get(week)!] });
      }
    }

    const current = months.at(-1);
    return {
      season,
      current: current
        ? toLeaderboard(
            current,
            upcoming.filter((entry) => entry.month === current.month).map((entry) => entry.week),
            league.teams,
          )
        : null,
      winners: months
        .slice(0, -1)
        .filter((entry) => entry.weeks.flat().every((matchup) => matchup.completed))
        .map((entry) => toWinner(entry, league.teams)),
    };
  }
}

function toLeaderboard({ month, weeks }: MonthWeeks, remainingWeeks: number[], teams: LeagueTeam[]): MonthLeaderboard {
  const liveWeek = weeks.flat().find((matchup) => !matchup.completed)?.week ?? null;
  return { month, weeks: weeks.map((week) => week[0]!.week), liveWeek, remainingWeeks, standings: rank(weeks.flat(), teams) };
}

function toWinner(entry: MonthWeeks, teams: LeagueTeam[]): MonthWinner {
  const standings = rank(entry.weeks.flat(), teams);
  const leaders = standings.filter((standing) => standing.behind === 0);
  return {
    month: entry.month,
    points: leaders[0]?.points ?? 0,
    teams: leaders.map(({ teamId, ownerName }) => ({ teamId, ownerName })),
  };
}

/** Sums each team's points across the matchups, highest first with ties broken by team id. */
function rank(matchups: LeagueMatchup[], teams: LeagueTeam[]): MonthStanding[] {
  const points = new Map(teams.map((team) => [team.teamId, 0]));
  for (const matchup of matchups) {
    points.set(matchup.homeTeamId, (points.get(matchup.homeTeamId) ?? 0) + matchup.homePoints);
    if (matchup.awayTeamId !== null) {
      points.set(matchup.awayTeamId, (points.get(matchup.awayTeamId) ?? 0) + matchup.awayPoints);
    }
  }
  const ownerNames = new Map(teams.map((team) => [team.teamId, team.ownerName]));
  const sorted = [...points.entries()].map(([teamId, total]): [number, number] => [teamId, roundPoints(total)]).sort(([aId, a], [bId, b]) => b - a || aId - bId);
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
