import { toLeagueSeason } from "@/logic/EspnFantasyLeagueClient";

describe("toLeagueSeason", () => {
  it("toLeagueSeason_membersAndTeams_labelsTeamsWithOwnerNamesFallingBackToTeamName", () => {
    const season = toLeagueSeason(2026, {
      members: [{ id: "{OWNER-1}", firstName: "Sam", lastName: "Rivera" }],
      teams: [
        { id: 1, name: "Bobcats", primaryOwner: "{OWNER-1}" },
        { id: 2, location: "Queen City", nickname: "Crowns" },
      ],
    });

    expect(season.teams).toEqual([
      { teamId: 1, ownerName: "Sam Rivera" },
      { teamId: 2, ownerName: "Queen City Crowns" },
    ]);
    expect(season.isSample).toBe(false);
  });

  it("toLeagueSeason_schedule_keepsRegularSeasonAndMarksUndecidedWeeksUnplayed", () => {
    const season = toLeagueSeason(2026, {
      schedule: [
        { matchupPeriodId: 1, winner: "HOME", playoffTierType: "NONE", home: { teamId: 1, totalPoints: 120.4 }, away: { teamId: 2, totalPoints: 98.1 } },
        { matchupPeriodId: 2, winner: "UNDECIDED", home: { teamId: 2, totalPoints: 0 }, away: { teamId: 1, totalPoints: 0 } },
        { matchupPeriodId: 3, winner: "HOME", home: { teamId: 9, totalPoints: 88 } },
        { matchupPeriodId: 15, winner: "UNDECIDED", playoffTierType: "WINNERS_BRACKET", home: { teamId: 1, totalPoints: 0 }, away: { teamId: 2, totalPoints: 0 } },
      ],
    });

    expect(season.matchups).toEqual([
      { week: 1, homeTeamId: 1, awayTeamId: 2, homePoints: 120.4, awayPoints: 98.1, completed: true },
      { week: 2, homeTeamId: 2, awayTeamId: 1, homePoints: 0, awayPoints: 0, completed: false },
      { week: 3, homeTeamId: 9, awayTeamId: null, homePoints: 88, awayPoints: 0, completed: true },
    ]);
  });
});
