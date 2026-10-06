import { It, Mock } from "moq.ts";

import type { FantasyLeagueClient } from "@/interfaces/fantasyLeagueClient";
import type { PickRepository } from "@/interfaces/pickRepository";
import { LeaguePickerSuggester } from "@/logic/LeaguePickerSuggester";
import type { LeagueMatchup } from "@/types/leagueMatchup";
import type { Pick } from "@/types/pick";

const SEASON = 2026;

const game = (week: number, homeTeamId: number, homePoints: number, awayTeamId: number, awayPoints: number): LeagueMatchup => ({
  week,
  homeTeamId,
  awayTeamId,
  homePoints,
  awayPoints,
  completed: true,
});
const pick = (week: number, pickerTeamId: number): Pick => ({
  id: week,
  season: SEASON,
  week,
  pickerTeamId,
  pickerName: `Person ${pickerTeamId}`,
  stationCode: "CHI",
  destinationName: "Chicago",
});

function suggester(matchups: LeagueMatchup[], picks: Pick[]) {
  const teams = [1, 2, 3, 4, 5].map((teamId) => ({ teamId, ownerName: `Person ${teamId}` }));
  const leagueClient = new Mock<FantasyLeagueClient>()
    .setup((client) => client.getSeason(It.IsAny()))
    .returnsAsync({ season: SEASON, teams, matchups });
  const pickRepository = new Mock<PickRepository>().setup((repository) => repository.listForSeason(SEASON)).returnsAsync(picks);
  return new LeaguePickerSuggester(leagueClient.object(), pickRepository.object());
}

describe("suggest", () => {
  it("suggest_firstWeek_returnsTopScorer", async () => {
    const result = await suggester([game(1, 1, 101, 2, 140.5), game(1, 3, 99, 4, 90)], []).suggest(SEASON);

    expect(result).toEqual({ season: SEASON, week: 1, teamId: 2, ownerName: "Person 2", points: 140.5 });
  });

  it("suggest_topScorerAlreadyPicked_returnsNextBestScorer", async () => {
    const matchups = [game(1, 2, 140, 1, 90), game(2, 2, 150, 3, 120), game(2, 1, 110, 4, 80)];

    const result = await suggester(matchups, [pick(1, 2)]).suggest(SEASON);

    expect(result).toMatchObject({ week: 2, teamId: 3 });
  });

  it("suggest_tiedScores_prefersLowerTeamId", async () => {
    const result = await suggester([game(1, 5, 120, 4, 120)], []).suggest(SEASON);

    expect(result?.teamId).toBe(4);
  });

  it("suggest_everyCompletedWeekPicked_returnsNull", async () => {
    expect(await suggester([game(1, 1, 100, 2, 90)], [pick(1, 1)]).suggest(SEASON)).toBeNull();
  });
});
