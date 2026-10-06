import { toWeekScores } from "@/logic/EspnFantasyLeagueClient";

describe("toWeekScores", () => {
  it("toWeekScores_decidedAndUndecidedMatchups_returnsDecidedWeeksWithOwnerNames", () => {
    const scores = toWeekScores({
      members: [{ id: "{OWNER-1}", firstName: "Sam", lastName: "Rivera" }],
      teams: [
        { id: 1, name: "Bobcats", primaryOwner: "{OWNER-1}" },
        { id: 2, location: "Queen City", nickname: "Crowns" },
      ],
      schedule: [
        { matchupPeriodId: 1, winner: "HOME", home: { teamId: 1, totalPoints: 120.4 }, away: { teamId: 2, totalPoints: 98.1 } },
        { matchupPeriodId: 2, winner: "UNDECIDED", home: { teamId: 2, totalPoints: 40 }, away: { teamId: 1, totalPoints: 30 } },
      ],
    });

    expect(scores).toEqual([
      { teamId: 1, ownerName: "Sam Rivera", week: 1, points: 120.4 },
      { teamId: 2, ownerName: "Queen City Crowns", week: 1, points: 98.1 },
    ]);
  });

  it("toWeekScores_byeWeek_includesHomeTeamOnly", () => {
    const scores = toWeekScores({ schedule: [{ matchupPeriodId: 3, winner: "HOME", home: { teamId: 9, totalPoints: 88 } }] });

    expect(scores).toEqual([{ teamId: 9, ownerName: "Team 9", week: 3, points: 88 }]);
  });
});
