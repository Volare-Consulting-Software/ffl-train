import { inject, injectable } from "tsyringe";

import { type FantasyLeagueClient, FantasyLeagueClientToken } from "@/interfaces/fantasyLeagueClient";
import { type MoonPhaseClient, MoonPhaseClientToken } from "@/interfaces/moonPhaseClient";
import { type MoonPhaseRepository, MoonPhaseRepositoryToken } from "@/interfaces/moonPhaseRepository";
import type { MoonSplitService } from "@/interfaces/moonSplitService";
import { isCrescent, MOON_TEAM_OWNER } from "@/lib/moonPhase";
import type { LeagueMatchup } from "@/types/leagueMatchup";
import type { MoonPhase } from "@/types/moonPhase";
import type { MoonSplit } from "@/types/moonSplit";
import type { MoonSplitReport } from "@/types/moonSplitReport";
import type { MoonSunday } from "@/types/moonSunday";
import type { MoonWeek } from "@/types/moonWeek";

interface DatedMatchup {
  matchup: LeagueMatchup;
  sunday: string;
}

/**
 * Splits the moon team's completed games by whether that week's Sunday had a crescent moon, and lists the
 * Sundays still to play. Sundays without a saved moon phase are looked up and saved first, so each date only
 * hits the outside source once.
 */
@injectable()
export class CrescentMoonSplitService implements MoonSplitService {
  constructor(
    @inject(FantasyLeagueClientToken) private readonly leagueClient: FantasyLeagueClient,
    @inject(MoonPhaseRepositoryToken) private readonly moonPhaseRepository: MoonPhaseRepository,
    @inject(MoonPhaseClientToken) private readonly moonPhaseClient: MoonPhaseClient,
  ) {}

  async getReport(season: number): Promise<MoonSplitReport> {
    const [league, sundays] = await Promise.all([this.leagueClient.getSeason(season), this.leagueClient.getWeekSundays(season)]);
    const team = league.teams.find((entry) => entry.ownerName === MOON_TEAM_OWNER);
    if (!team) {
      throw new Error(`${MOON_TEAM_OWNER} is not in the ${season} league`);
    }
    const ownerNames = new Map(league.teams.map((entry) => [entry.teamId, entry.ownerName]));

    const schedule = league.matchups
      .filter(
        (matchup) => matchup.awayTeamId !== null && (matchup.homeTeamId === team.teamId || matchup.awayTeamId === team.teamId),
      )
      .flatMap((matchup): DatedMatchup[] => {
        const sunday = sundays.get(matchup.week);
        if (!sunday) {
          console.warn(`No Sunday found for week ${matchup.week}; leaving it out of the moon split`);
          return [];
        }
        return [{ matchup, sunday }];
      })
      .sort((a, b) => a.matchup.week - b.matchup.week);
    const phases = await this.phasesFor(schedule.map((entry) => entry.sunday));

    const toSunday = ({ matchup, sunday }: DatedMatchup): MoonSunday => {
      const phase = phases.get(sunday)!;
      const opponentId = matchup.homeTeamId === team.teamId ? matchup.awayTeamId! : matchup.homeTeamId;
      return {
        week: matchup.week,
        sunday,
        illuminationPercent: phase.illuminationPercent,
        phaseName: phase.phaseName,
        isCrescent: isCrescent(phase.illuminationPercent),
        opponentName: ownerNames.get(opponentId) ?? `Team ${opponentId}`,
      };
    };
    const weeks = schedule
      .filter((entry) => entry.matchup.completed)
      .map((entry) => withResult(toSunday(entry), entry.matchup, team.teamId));
    return {
      ownerName: team.ownerName,
      crescent: summarize(weeks.filter((week) => week.isCrescent)),
      other: summarize(weeks.filter((week) => !week.isCrescent)),
      weeks,
      upcoming: schedule.filter((entry) => !entry.matchup.completed).map(toSunday),
    };
  }

  private async phasesFor(dates: string[]): Promise<Map<string, MoonPhase>> {
    const unique = [...new Set(dates)];
    const phases = new Map((await this.moonPhaseRepository.findByDates(unique)).map((phase) => [phase.date, phase]));
    const missing = unique.filter((date) => !phases.has(date));
    const fetched = await Promise.all(missing.map((date) => this.moonPhaseClient.lookup(date)));
    for (const phase of fetched) {
      await this.moonPhaseRepository.save(phase);
      phases.set(phase.date, phase);
    }
    return phases;
  }
}

function withResult(sunday: MoonSunday, matchup: LeagueMatchup, teamId: number): MoonWeek {
  const isHome = matchup.homeTeamId === teamId;
  const pointsFor = isHome ? matchup.homePoints : matchup.awayPoints;
  const opponentPoints = isHome ? matchup.awayPoints : matchup.homePoints;
  return {
    ...sunday,
    pointsFor,
    opponentPoints,
    result: pointsFor > opponentPoints ? "W" : pointsFor < opponentPoints ? "L" : "T",
  };
}

function summarize(weeks: MoonWeek[]): MoonSplit {
  const pointsFor = weeks.reduce((sum, week) => sum + week.pointsFor, 0);
  return {
    wins: weeks.filter((week) => week.result === "W").length,
    losses: weeks.filter((week) => week.result === "L").length,
    ties: weeks.filter((week) => week.result === "T").length,
    pointsFor: Math.round(pointsFor * 100) / 100,
    averagePoints: weeks.length > 0 ? Math.round((pointsFor / weeks.length) * 100) / 100 : null,
  };
}
