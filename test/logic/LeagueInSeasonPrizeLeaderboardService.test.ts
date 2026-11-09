import { Mock } from "moq.ts";

import type { FantasyLeagueClient } from "@/interfaces/fantasyLeagueClient";
import { LeagueInSeasonPrizeLeaderboardService } from "@/logic/LeagueInSeasonPrizeLeaderboardService";
import type { LeagueMatchup } from "@/types/leagueMatchup";
import type { LeagueSeason } from "@/types/leagueSeason";

const SEASON = 2026;
const TEAMS = [
  { teamId: 1, ownerName: "Ryan McCoy" },
  { teamId: 2, ownerName: "Sam Longietti" },
  { teamId: 3, ownerName: "Ty Houle" },
  { teamId: 4, ownerName: "Mark Pizzuto" },
];
/** Week 1's Sunday is 2026-09-13, and each later week falls a Sunday after that. */
const SUNDAYS = new Map(
  Array.from({ length: 14 }, (_, index): [number, string] => [
    index + 1,
    new Date(Date.UTC(2026, 8, 13 + index * 7)).toISOString().slice(0, 10),
  ]),
);

/** Team 1 plays team 2 and team 3 plays team 4, with points listed in team order. */
const week = (number: number, scores: [number, number, number, number], completed = true): LeagueMatchup[] => [
  { week: number, homeTeamId: 1, awayTeamId: 2, homePoints: scores[0], awayPoints: scores[1], completed },
  { week: number, homeTeamId: 3, awayTeamId: 4, homePoints: scores[2], awayPoints: scores[3], completed },
];

const weeks = (from: number, to: number, scores: [number, number, number, number]) =>
  Array.from({ length: to - from + 1 }, (_, index) => week(from + index, scores)).flat();

function buildService(matchups: LeagueMatchup[]) {
  const league: LeagueSeason = { season: SEASON, teams: TEAMS, matchups };
  const client = new Mock<FantasyLeagueClient>()
    .setup((instance) => instance.getSeason(SEASON))
    .returnsAsync(league)
    .setup((instance) => instance.getWeekSundays(SEASON))
    .returnsAsync(SUNDAYS);
  return new LeagueInSeasonPrizeLeaderboardService(client.object());
}

describe("getReport", () => {
  it("getReport_midFirstPeriod_listsWeeksNotStartedYet", async () => {
    const service = buildService([...week(1, [100, 90, 80, 70]), ...week(2, [0, 0, 0, 0], false), ...week(3, [0, 0, 0, 0], false)]);

    const report = await service.getReport(SEASON, "2026-09-15");

    expect(report.current?.period).toEqual({ firstWeek: 1, lastWeek: 4 });
    expect(report.current?.remainingWeeks).toEqual([2, 3, 4]);
    expect(report.winners).toEqual([]);
  });

  it("getReport_weekInProgress_countsLivePointsAndRanksByDeficit", async () => {
    const service = buildService([...week(5, [120.5, 100, 90, 80]), ...week(6, [10, 45, 20, 0], false)]);

    const report = await service.getReport(SEASON, "2026-10-18");

    expect(report.current).toEqual({
      period: { firstWeek: 5, lastWeek: 9 },
      remainingWeeks: [7, 8, 9],
      standings: [
        { teamId: 2, ownerName: "Sam Longietti", points: 145, behind: 0 },
        { teamId: 1, ownerName: "Ryan McCoy", points: 130.5, behind: 14.5 },
        { teamId: 3, ownerName: "Ty Houle", points: 110, behind: 35 },
        { teamId: 4, ownerName: "Mark Pizzuto", points: 80, behind: 65 },
      ],
    });
  });

  it("getReport_mondayAfterPeriodsLastSunday_keepsThatPeriodCurrent", async () => {
    const service = buildService([...weeks(1, 8, [100, 90, 80, 70]), ...week(9, [50, 40, 30, 20], false)]);

    const report = await service.getReport(SEASON, "2026-11-09");

    expect(report.current?.period).toEqual({ firstWeek: 5, lastWeek: 9 });
    expect(report.current?.remainingWeeks).toEqual([]);
  });

  it("getReport_finishedPeriod_awardsTopScorerAndSharesTies", async () => {
    const service = buildService([
      ...week(1, [100.1, 90, 80, 70]),
      ...week(2, [100.1, 90, 80, 70]),
      ...week(3, [100.1, 90, 80, 70]),
      ...week(4, [100.1, 130.4, 80, 70]),
      ...week(5, [0, 0, 0, 0], false),
    ]);

    const report = await service.getReport(SEASON, "2026-10-11");

    expect(report.winners).toEqual([
      {
        period: { firstWeek: 1, lastWeek: 4 },
        points: 400.4,
        teams: [
          { teamId: 1, ownerName: "Ryan McCoy" },
          { teamId: 2, ownerName: "Sam Longietti" },
        ],
      },
    ]);
    expect(report.current?.period).toEqual({ firstWeek: 5, lastWeek: 9 });
  });

  it("getReport_earlierPeriodStillUnfinished_hasNoWinnerYet", async () => {
    const service = buildService([...weeks(1, 3, [100, 90, 80, 70]), ...week(4, [100, 90, 80, 70], false), ...week(5, [100, 90, 80, 70])]);

    const report = await service.getReport(SEASON, "2026-10-12");

    expect(report.winners).toEqual([]);
    expect(report.current?.period).toEqual({ firstWeek: 5, lastWeek: 9 });
  });

  it("getReport_regularSeasonOver_keepsLastPeriodCurrentWithEarlierWinners", async () => {
    const service = buildService([
      ...weeks(1, 4, [100, 90, 80, 70]),
      ...weeks(5, 9, [90, 100, 80, 70]),
      ...weeks(10, 14, [70, 80, 90, 100]),
    ]);

    const report = await service.getReport(SEASON, "2026-12-27");

    expect(report.winners.map((winner) => [winner.period.firstWeek, winner.teams[0]!.ownerName, winner.points])).toEqual([
      [1, "Ryan McCoy", 400],
      [5, "Sam Longietti", 500],
    ]);
    expect(report.current?.period).toEqual({ firstWeek: 10, lastWeek: 14 });
    expect(report.current?.standings[0]).toEqual({ teamId: 4, ownerName: "Mark Pizzuto", points: 500, behind: 0 });
  });

  it("getReport_beforeFirstSunday_hasNoCurrentPeriod", async () => {
    const service = buildService(week(1, [0, 0, 0, 0], false));

    const report = await service.getReport(SEASON, "2026-09-10");

    expect(report.current).toBeNull();
    expect(report.winners).toEqual([]);
  });
});
