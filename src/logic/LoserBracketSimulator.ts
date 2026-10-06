import type { LeagueMatchup } from "@/types/leagueMatchup";
import type { LeagueSeason } from "@/types/leagueSeason";
import type { SimulationOptions } from "@/types/simulationOptions";
import type { TeamTripOdds } from "@/types/teamTripOdds";

export const LOSER_BRACKET_SIZE = 6;
const SHRINK_GAMES = 3;
const DEFAULT_SCORE_STD_DEV = 25;
const DEFAULT_LEAGUE_AVERAGE = 110;
const MIN_SAMPLES_FOR_STD_DEV = 10;

interface TeamRecord {
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
}

interface TeamStrength {
  mean: number;
  stdDev: number;
}

/**
 * Monte Carlo model of who rides the train.
 *
 * Each run plays out the unplayed regular-season games, ranks the standings (win percentage, then
 * points for), and plays the loser bracket over the bottom six:
 *   round 1: 7th vs 10th and 8th vs 9th (losers advance, winners are safe)
 *   round 2: 12th vs the higher-standing round 1 loser, 11th vs the other
 *   final:   the two round 2 losers; the loser of the final is the ultimate loser.
 * Game scores are drawn from each team's points-for average, shrunk toward the league average while the
 * sample is small. The wheel then sends one of the other teams along, so
 *   P(trip) = P(ultimate loser) + (1 - P(ultimate loser)) / (teams - 1).
 */
export class LoserBracketSimulator {
  simulate(season: LeagueSeason, options: SimulationOptions): TeamTripOdds[] {
    const teamIds = season.teams.map((team) => team.teamId);
    const records = this.currentRecords(season);
    const strengths = this.strengths(season, records);
    const remaining = season.matchups.filter((matchup) => !matchup.completed);
    const currentStandings = this.rank(teamIds, records);

    const loserBracketCounts = new Map(teamIds.map((teamId) => [teamId, 0]));
    const ultimateLoserCounts = new Map(teamIds.map((teamId) => [teamId, 0]));
    const sampleScore = (teamId: number) => {
      const strength = strengths.get(teamId)!;
      return strength.mean + strength.stdDev * standardNormal(options.random);
    };

    for (let run = 0; run < options.iterations; run++) {
      const finalRecords = this.playOut(records, remaining, sampleScore);
      const standings = this.rank(teamIds, finalRecords);
      const bracket = standings.slice(-LOSER_BRACKET_SIZE);
      if (bracket.length < LOSER_BRACKET_SIZE) {
        continue;
      }
      bracket.forEach((teamId) => loserBracketCounts.set(teamId, loserBracketCounts.get(teamId)! + 1));
      const loser = this.playLoserBracket(bracket, sampleScore);
      ultimateLoserCounts.set(loser, ultimateLoserCounts.get(loser)! + 1);
    }

    const companionShare = teamIds.length > 1 ? 1 / (teamIds.length - 1) : 0;
    return season.teams.map((team) => {
      const record = records.get(team.teamId)!;
      const ultimateLoser = ultimateLoserCounts.get(team.teamId)! / options.iterations;
      return {
        teamId: team.teamId,
        ownerName: team.ownerName,
        wins: record.wins,
        losses: record.losses,
        ties: record.ties,
        pointsFor: Math.round(record.pointsFor * 100) / 100,
        standing: currentStandings.indexOf(team.teamId) + 1,
        loserBracketProbability: loserBracketCounts.get(team.teamId)! / options.iterations,
        ultimateLoserProbability: ultimateLoser,
        tripProbability: ultimateLoser + (1 - ultimateLoser) * companionShare,
      };
    });
  }

  /** Plays the six-team loser bracket, ordered best to worst standing, and returns the ultimate loser. */
  playLoserBracket(bracket: number[], sampleScore: (teamId: number) => number): number {
    const [seventh, eighth, ninth, tenth, eleventh, twelfth] = bracket as [number, number, number, number, number, number];
    const loserOf = (a: number, b: number) => (sampleScore(a) < sampleScore(b) ? a : b);

    const roundOneLosers = [loserOf(seventh, tenth), loserOf(eighth, ninth)].sort(
      (a, b) => bracket.indexOf(a) - bracket.indexOf(b),
    ) as [number, number];
    const finalistA = loserOf(twelfth, roundOneLosers[0]);
    const finalistB = loserOf(eleventh, roundOneLosers[1]);
    return loserOf(finalistA, finalistB);
  }

  private currentRecords(season: LeagueSeason): Map<number, TeamRecord> {
    const records = new Map(season.teams.map((team) => [team.teamId, { wins: 0, losses: 0, ties: 0, pointsFor: 0 }]));
    for (const matchup of season.matchups.filter((entry) => entry.completed)) {
      applyResult(records, matchup.homeTeamId, matchup.awayTeamId, matchup.homePoints, matchup.awayPoints);
    }
    return records;
  }

  private strengths(season: LeagueSeason, records: Map<number, TeamRecord>): Map<number, TeamStrength> {
    const scores = season.matchups
      .filter((matchup) => matchup.completed)
      .flatMap((matchup) => (matchup.awayTeamId === null ? [matchup.homePoints] : [matchup.homePoints, matchup.awayPoints]));
    const leagueAverage = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : DEFAULT_LEAGUE_AVERAGE;
    const stdDev =
      scores.length >= MIN_SAMPLES_FOR_STD_DEV
        ? Math.sqrt(scores.reduce((sum, score) => sum + (score - leagueAverage) ** 2, 0) / (scores.length - 1))
        : DEFAULT_SCORE_STD_DEV;

    return new Map(
      [...records].map(([teamId, record]) => {
        const games = record.wins + record.losses + record.ties;
        // Shrink toward the league average so one big or awful early week doesn't swing the odds.
        const mean = (record.pointsFor + SHRINK_GAMES * leagueAverage) / (games + SHRINK_GAMES);
        return [teamId, { mean, stdDev }];
      }),
    );
  }

  private playOut(
    records: Map<number, TeamRecord>,
    remaining: LeagueMatchup[],
    sampleScore: (teamId: number) => number,
  ): Map<number, TeamRecord> {
    const simulated = new Map([...records].map(([teamId, record]) => [teamId, { ...record }]));
    for (const matchup of remaining) {
      if (matchup.awayTeamId === null) {
        continue;
      }
      applyResult(simulated, matchup.homeTeamId, matchup.awayTeamId, sampleScore(matchup.homeTeamId), sampleScore(matchup.awayTeamId));
    }
    return simulated;
  }

  /** Team ids from first to last place: win percentage, then points for. */
  private rank(teamIds: number[], records: Map<number, TeamRecord>): number[] {
    const winPercentage = (record: TeamRecord) => {
      const games = record.wins + record.losses + record.ties;
      return games === 0 ? 0 : (record.wins + record.ties / 2) / games;
    };
    return [...teamIds].sort((a, b) => {
      const recordA = records.get(a)!;
      const recordB = records.get(b)!;
      return winPercentage(recordB) - winPercentage(recordA) || recordB.pointsFor - recordA.pointsFor || a - b;
    });
  }
}

function applyResult(records: Map<number, TeamRecord>, homeId: number, awayId: number | null, homePoints: number, awayPoints: number) {
  const home = records.get(homeId);
  if (!home) {
    return;
  }
  home.pointsFor += homePoints;
  const away = awayId === null ? undefined : records.get(awayId);
  if (!away) {
    return;
  }
  away.pointsFor += awayPoints;
  if (homePoints > awayPoints) {
    home.wins++;
    away.losses++;
  } else if (awayPoints > homePoints) {
    away.wins++;
    home.losses++;
  } else {
    home.ties++;
    away.ties++;
  }
}

/** Box-Muller transform: a standard normal sample from two uniform samples. */
function standardNormal(random: () => number): number {
  const u = 1 - random();
  const v = random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** Small seeded PRNG (mulberry32) so the same league data always produces the same odds. */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}
