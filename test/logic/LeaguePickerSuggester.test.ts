import { It, Mock } from "moq.ts";

import type { FantasyLeagueClient } from "@/interfaces/fantasyLeagueClient";
import type { PickRepository } from "@/interfaces/pickRepository";
import { LeaguePickerSuggester } from "@/logic/LeaguePickerSuggester";
import type { Pick } from "@/types/pick";
import type { TeamWeekScore } from "@/types/teamWeekScore";

const SEASON = 2026;

const score = (week: number, teamId: number, points: number): TeamWeekScore => ({ week, teamId, ownerName: `Team ${teamId}`, points });
const pick = (week: number, pickerTeamId: number): Pick => ({
  id: week,
  season: SEASON,
  week,
  pickerTeamId,
  pickerName: `Team ${pickerTeamId}`,
  stationCode: "CHI",
  destinationName: "Chicago",
});

function suggester(scores: TeamWeekScore[], picks: Pick[]) {
  const leagueClient = new Mock<FantasyLeagueClient>().setup((client) => client.getCompletedWeekScores(It.IsAny())).returnsAsync(scores);
  const pickRepository = new Mock<PickRepository>().setup((repository) => repository.listForSeason(SEASON)).returnsAsync(picks);
  return new LeaguePickerSuggester(leagueClient.object(), pickRepository.object());
}

describe("suggest", () => {
  it("suggest_firstWeek_returnsTopScorer", async () => {
    const result = await suggester([score(1, 1, 101), score(1, 2, 140.5), score(1, 3, 99)], []).suggest(SEASON);

    expect(result).toEqual({ season: SEASON, week: 1, teamId: 2, ownerName: "Team 2", points: 140.5 });
  });

  it("suggest_topScorerAlreadyPicked_returnsNextBestScorer", async () => {
    const scores = [score(1, 2, 140), score(2, 2, 150), score(2, 3, 120), score(2, 1, 110)];

    const result = await suggester(scores, [pick(1, 2)]).suggest(SEASON);

    expect(result).toMatchObject({ week: 2, teamId: 3 });
  });

  it("suggest_tiedScores_prefersLowerTeamId", async () => {
    const result = await suggester([score(1, 5, 120), score(1, 4, 120)], []).suggest(SEASON);

    expect(result?.teamId).toBe(4);
  });

  it("suggest_everyCompletedWeekPicked_returnsNull", async () => {
    expect(await suggester([score(1, 1, 100)], [pick(1, 1)]).suggest(SEASON)).toBeNull();
  });
});
