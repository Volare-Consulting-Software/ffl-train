import { Mock } from "moq.ts";

import type { FantasyLeagueClient } from "@/interfaces/fantasyLeagueClient";
import { LeagueMonthlyLeaderboardService } from "@/logic/LeagueMonthlyLeaderboardService";
import type { LeagueMatchup } from "@/types/leagueMatchup";
import type { LeagueSeason } from "@/types/leagueSeason";

const SEASON = 2026;
const TEAMS = [
  { teamId: 1, ownerName: "Ryan McCoy" },
  { teamId: 2, ownerName: "Sam Longietti" },
  { teamId: 3, ownerName: "Ty Houle" },
  { teamId: 4, ownerName: "Mark Pizzuto" },
];
const SUNDAYS = new Map([
  [1, "2026-09-13"],
  [2, "2026-09-20"],
  [3, "2026-09-27"],
  [4, "2026-10-04"],
  [5, "2026-10-11"],
  [15, "2026-12-20"],
]);

/** Team 1 plays team 2 and team 3 plays team 4, with points listed in team order. */
const week = (number: number, scores: [number, number, number, number], completed = true): LeagueMatchup[] => [
  { week: number, homeTeamId: 1, awayTeamId: 2, homePoints: scores[0], awayPoints: scores[1], completed },
  { week: number, homeTeamId: 3, awayTeamId: 4, homePoints: scores[2], awayPoints: scores[3], completed },
];

function buildService(matchups: LeagueMatchup[], playoffMatchups: LeagueMatchup[] = []) {
  const league: LeagueSeason = { season: SEASON, teams: TEAMS, matchups, playoffMatchups };
  const client = new Mock<FantasyLeagueClient>()
    .setup((instance) => instance.getSeason(SEASON))
    .returnsAsync(league)
    .setup((instance) => instance.getWeekSundays(SEASON))
    .returnsAsync(SUNDAYS);
  return new LeagueMonthlyLeaderboardService(client.object());
}

describe("getReport", () => {
  it("getReport_mondayAfterMonthEnds_keepsWeekInMonthOfItsSunday", async () => {
    const service = buildService([...week(1, [100, 90, 80, 70]), ...week(2, [100, 90, 80, 70]), ...week(3, [100, 90, 80, 120], false)]);

    const report = await service.getReport(SEASON, "2026-09-28");

    expect(report.current?.month).toBe("2026-09");
    expect(report.current?.weeks).toEqual([1, 2, 3]);
    expect(report.winners).toEqual([]);
  });

  it("getReport_laterWeeksThisMonth_listsWeeksNotStartedYet", async () => {
    const service = buildService([
      ...week(1, [100, 90, 80, 70]),
      ...week(2, [0, 0, 0, 0], false),
      ...week(3, [0, 0, 0, 0], false),
      ...week(4, [0, 0, 0, 0], false),
    ]);

    const report = await service.getReport(SEASON, "2026-09-15");

    expect(report.current?.weeks).toEqual([1]);
    expect(report.current?.remainingWeeks).toEqual([2, 3]);
  });

  it("getReport_weekInProgress_countsLivePointsAndRanksByDeficit", async () => {
    const service = buildService([...week(4, [120.5, 100, 90, 80]), ...week(5, [10, 45, 20, 0], false)]);

    const report = await service.getReport(SEASON, "2026-10-11");

    expect(report.current).toEqual({
      month: "2026-10",
      weeks: [4, 5],
      liveWeek: 5,
      remainingWeeks: [],
      standings: [
        { teamId: 2, ownerName: "Sam Longietti", points: 145, behind: 0 },
        { teamId: 1, ownerName: "Ryan McCoy", points: 130.5, behind: 14.5 },
        { teamId: 3, ownerName: "Ty Houle", points: 110, behind: 35 },
        { teamId: 4, ownerName: "Mark Pizzuto", points: 80, behind: 65 },
      ],
    });
  });

  it("getReport_finishedMonth_awardsTopScorerAndSharesTies", async () => {
    const service = buildService([
      ...week(1, [100.1, 90, 80, 70]),
      ...week(2, [100.1, 90, 80, 70]),
      ...week(3, [100.1, 120.3, 80, 70]),
      ...week(4, [0, 0, 0, 0], false),
    ]);

    const report = await service.getReport(SEASON, "2026-10-04");

    expect(report.winners).toEqual([
      {
        month: "2026-09",
        points: 300.3,
        teams: [
          { teamId: 1, ownerName: "Ryan McCoy" },
          { teamId: 2, ownerName: "Sam Longietti" },
        ],
      },
    ]);
    expect(report.current?.liveWeek).toBe(4);
  });

  it("getReport_beforeFirstSunday_hasNoCurrentMonth", async () => {
    const service = buildService(week(1, [0, 0, 0, 0], false));

    const report = await service.getReport(SEASON, "2026-09-10");

    expect(report.current).toBeNull();
    expect(report.winners).toEqual([]);
  });

  it("getReport_earlierMonthStillUnfinished_hasNoWinnerYet", async () => {
    const service = buildService([...week(3, [100, 90, 80, 70], false), ...week(4, [100, 90, 80, 70])]);

    const report = await service.getReport(SEASON, "2026-10-05");

    expect(report.winners).toEqual([]);
    expect(report.current?.month).toBe("2026-10");
  });

  it("getReport_playoffWeek_countsTowardItsMonth", async () => {
    const playoffs: LeagueMatchup[] = [
      { week: 15, homeTeamId: 1, awayTeamId: 2, homePoints: 110, awayPoints: 95, completed: false },
      { week: 15, homeTeamId: 4, awayTeamId: null, homePoints: 130, awayPoints: 0, completed: false },
    ];
    const service = buildService(week(5, [100, 90, 80, 70]), playoffs);

    const report = await service.getReport(SEASON, "2026-12-21");

    expect(report.current?.month).toBe("2026-12");
    expect(report.current?.standings.map((standing) => [standing.ownerName, standing.points])).toEqual([
      ["Mark Pizzuto", 130],
      ["Ryan McCoy", 110],
      ["Sam Longietti", 95],
      ["Ty Houle", 0],
    ]);
    expect(report.winners.map((winner) => winner.month)).toEqual(["2026-10"]);
  });
});
