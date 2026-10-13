import { It, Mock, Times } from "moq.ts";

import type { FantasyLeagueClient } from "@/interfaces/fantasyLeagueClient";
import type { MoonPhaseClient } from "@/interfaces/moonPhaseClient";
import type { MoonPhaseRepository } from "@/interfaces/moonPhaseRepository";
import { MOON_TEAM_OWNER } from "@/lib/moonPhase";
import { CrescentMoonSplitService } from "@/logic/CrescentMoonSplitService";
import type { LeagueSeason } from "@/types/leagueSeason";
import type { MoonPhase } from "@/types/moonPhase";

const SEASON = 2026;
const MOON_TEAM = 5;
const SUNDAYS = new Map([
  [1, "2026-09-13"],
  [2, "2026-09-20"],
  [3, "2026-09-27"],
  [4, "2026-10-04"],
]);
const LEAGUE: LeagueSeason = {
  season: SEASON,
  teams: [
    { teamId: MOON_TEAM, ownerName: MOON_TEAM_OWNER },
    { teamId: 7, ownerName: "Someone Else" },
  ],
  matchups: [
    { week: 1, homeTeamId: MOON_TEAM, awayTeamId: 7, homePoints: 130, awayPoints: 100, completed: true },
    { week: 2, homeTeamId: 7, awayTeamId: MOON_TEAM, homePoints: 120, awayPoints: 90.5, completed: true },
    { week: 3, homeTeamId: MOON_TEAM, awayTeamId: 7, homePoints: 110, awayPoints: 105, completed: true },
    { week: 4, homeTeamId: MOON_TEAM, awayTeamId: 7, homePoints: 0, awayPoints: 0, completed: false },
  ],
};
const SAVED: MoonPhase[] = [
  { date: "2026-09-13", illuminationPercent: 7, phaseName: "Waxing Crescent" },
  { date: "2026-09-20", illuminationPercent: 62, phaseName: "Waxing Gibbous" },
];
const LOOKED_UP: MoonPhase = { date: "2026-09-27", illuminationPercent: 99, phaseName: "Full Moon" };
const UPCOMING_PHASE: MoonPhase = { date: "2026-10-04", illuminationPercent: 38, phaseName: "Waning Crescent" };

function buildService(league: LeagueSeason = LEAGUE) {
  const leagueClient = new Mock<FantasyLeagueClient>()
    .setup((client) => client.getSeason(SEASON))
    .returnsAsync(league)
    .setup((client) => client.getWeekSundays(SEASON))
    .returnsAsync(SUNDAYS);
  const repository = new Mock<MoonPhaseRepository>()
    .setup((instance) => instance.findByDates(It.IsAny()))
    .returnsAsync(SAVED)
    .setup((instance) => instance.save(It.IsAny()))
    .returnsAsync(undefined);
  const moonClient = new Mock<MoonPhaseClient>()
    .setup((client) => client.lookup("2026-09-27"))
    .returnsAsync(LOOKED_UP)
    .setup((client) => client.lookup("2026-10-04"))
    .returnsAsync(UPCOMING_PHASE);
  const service = new CrescentMoonSplitService(leagueClient.object(), repository.object(), moonClient.object());
  return { service, repository, moonClient };
}

describe("getReport", () => {
  it("getReport_mixedMoons_splitsCompletedGamesByCrescentSunday", async () => {
    const { service } = buildService();

    const report = await service.getReport(SEASON);

    expect(report.ownerName).toBe(MOON_TEAM_OWNER);
    expect(report.crescent).toEqual({ wins: 1, losses: 0, ties: 0, pointsFor: 130, averagePoints: 130 });
    expect(report.other).toEqual({ wins: 1, losses: 1, ties: 0, pointsFor: 200.5, averagePoints: 100.25 });
    expect(report.weeks.map((week) => [week.week, week.isCrescent, week.result, week.opponentName])).toEqual([
      [1, true, "W", "Someone Else"],
      [2, false, "L", "Someone Else"],
      [3, false, "W", "Someone Else"],
    ]);
  });

  it("getReport_unplayedWeek_listsItAsUpcomingWithMoonAndOpponent", async () => {
    const { service } = buildService();

    const report = await service.getReport(SEASON);

    expect(report.upcoming).toEqual([
      { week: 4, sunday: "2026-10-04", illuminationPercent: 38, phaseName: "Waning Crescent", isCrescent: true, opponentName: "Someone Else" },
    ]);
  });

  it("getReport_sundaysNotSaved_looksUpAndSavesOnlyThose", async () => {
    const { service, repository, moonClient } = buildService();

    await service.getReport(SEASON);

    moonClient.verify((client) => client.lookup("2026-09-27"), Times.Once());
    moonClient.verify((client) => client.lookup("2026-10-04"), Times.Once());
    moonClient.verify((client) => client.lookup("2026-09-13"), Times.Never());
    repository.verify((instance) => instance.save(LOOKED_UP), Times.Once());
    repository.verify((instance) => instance.save(UPCOMING_PHASE), Times.Once());
    repository.verify((instance) => instance.save(It.IsAny()), Times.Exactly(2));
  });

  it("getReport_ownerNotInLeague_throws", async () => {
    const { service } = buildService({ ...LEAGUE, teams: [{ teamId: 7, ownerName: "Someone Else" }] });

    await expect(service.getReport(SEASON)).rejects.toThrow(`${MOON_TEAM_OWNER} is not in the ${SEASON} league`);
  });
});
