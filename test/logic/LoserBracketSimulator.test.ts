import { LoserBracketSimulator, seededRandom } from "@/logic/LoserBracketSimulator";
import { buildLeagueSeason, TEAM_COUNT } from "../fixtures/leagueSeason";

const ITERATIONS = 20_000;
const BRACKET = [7, 8, 9, 10, 11, 12];
const EVEN_LEAGUE = Array.from({ length: TEAM_COUNT }, () => 110);

describe("playLoserBracket", () => {
  it("playLoserBracket_scores_pairs7v10And8v9ThenTwelfthAgainstHigherStandingLoser", () => {
    const fixedScores: Record<number, number> = { 7: 100, 10: 40, 8: 45, 9: 100, 11: 43, 12: 42 };
    const calls: number[] = [];

    const loser = new LoserBracketSimulator().playLoserBracket(BRACKET, (teamId) => {
      calls.push(teamId);
      return fixedScores[teamId]!;
    });

    // Round 1 losers are 10 and 8; 8 finished higher, so 12th plays 8 and 11th plays 10.
    expect(calls.slice(0, 8)).toEqual([7, 10, 8, 9, 12, 8, 11, 10]);
    expect(loser).toBe(10);
  });

  it("playLoserBracket_evenTeams_byeTeamsLoseTwiceAsOften", () => {
    const random = seededRandom(7);
    const simulator = new LoserBracketSimulator();
    const counts = new Map(BRACKET.map((teamId) => [teamId, 0]));

    for (let run = 0; run < ITERATIONS; run++) {
      const loser = simulator.playLoserBracket(BRACKET, () => random());
      counts.set(loser, counts.get(loser)! + 1);
    }

    for (const byeTeam of [11, 12]) {
      expect(counts.get(byeTeam)! / ITERATIONS).toBeCloseTo(0.25, 1);
    }
    for (const roundOneTeam of [7, 8, 9, 10]) {
      expect(counts.get(roundOneTeam)! / ITERATIONS).toBeCloseTo(0.125, 1);
    }
  });
});

describe("simulate", () => {
  it("simulate_finishedSeason_topSixGetOnlyTheWheelShareAndTripOddsSumToTwo", () => {
    const odds = new LoserBracketSimulator().simulate(buildLeagueSeason(EVEN_LEAGUE, 11), {
      iterations: ITERATIONS,
      random: seededRandom(1),
    });

    const topSix = odds.filter((team) => team.standing <= 6);
    expect(topSix).toHaveLength(6);
    for (const team of topSix) {
      expect(team.loserBracketProbability).toBe(0);
      expect(team.tripProbability).toBeCloseTo(1 / 11, 5);
    }
    for (const team of odds.filter((entry) => entry.standing > 6)) {
      expect(team.loserBracketProbability).toBe(1);
    }
    expect(odds.reduce((sum, team) => sum + team.ultimateLoserProbability, 0)).toBeCloseTo(1, 5);
    expect(odds.reduce((sum, team) => sum + team.tripProbability, 0)).toBeCloseTo(2, 5);
  });

  it("simulate_midSeason_weakLowScoringTeamOutranksStrongTeam", () => {
    const averages = Array.from({ length: TEAM_COUNT }, (_, index) => 80 + index * 6);
    const odds = new LoserBracketSimulator().simulate(buildLeagueSeason(averages, 5, 14), {
      iterations: ITERATIONS,
      random: seededRandom(3),
    });

    const weakest = odds.find((team) => team.teamId === 1)!;
    const strongest = odds.find((team) => team.teamId === TEAM_COUNT)!;
    expect(weakest.tripProbability).toBeGreaterThan(strongest.tripProbability * 2);
    expect(strongest.tripProbability).toBeGreaterThanOrEqual(1 / 11);
    expect(strongest.loserBracketProbability).toBeLessThan(weakest.loserBracketProbability);
  });

  it("simulate_sameSeed_returnsSameOdds", () => {
    const season = buildLeagueSeason(EVEN_LEAGUE, 4, 14);
    const run = () => new LoserBracketSimulator().simulate(season, { iterations: 2_000, random: seededRandom(9) });

    expect(run()).toEqual(run());
  });
});
