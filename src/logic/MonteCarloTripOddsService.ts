import { inject, injectable } from "tsyringe";

import { type FantasyLeagueClient, FantasyLeagueClientToken } from "@/interfaces/fantasyLeagueClient";
import type { TripOddsService } from "@/interfaces/tripOddsService";
import { LoserBracketSimulator, seededRandom } from "@/logic/LoserBracketSimulator";
import type { LeagueSeason } from "@/types/leagueSeason";
import type { TripOddsReport } from "@/types/tripOddsReport";

const SIMULATIONS = 5_000;

/** Runs the loser bracket simulation over the league's current results, reusing it until the scores change. */
@injectable()
export class MonteCarloTripOddsService implements TripOddsService {
  private cache: { key: string; report: TripOddsReport } | null = null;

  constructor(@inject(FantasyLeagueClientToken) private readonly leagueClient: FantasyLeagueClient) {}

  async getOdds(season: number): Promise<TripOddsReport> {
    const league = await this.leagueClient.getSeason(season);
    const key = fingerprint(league);
    if (this.cache?.key === key) {
      return this.cache.report;
    }
    const teams = new LoserBracketSimulator()
      .simulate(league, { iterations: SIMULATIONS, random: seededRandom(hash(key)) })
      .sort((a, b) => b.tripProbability - a.tripProbability || a.standing - b.standing);
    const report: TripOddsReport = {
      season,
      teams,
      simulations: SIMULATIONS,
      remainingGames: league.matchups.filter((matchup) => !matchup.completed && matchup.awayTeamId !== null).length,
      isSample: league.isSample,
    };
    this.cache = { key, report };
    return report;
  }
}

function fingerprint(league: LeagueSeason): string {
  return JSON.stringify([league.season, league.teams, league.matchups.filter((matchup) => matchup.completed)]);
}

/** FNV-1a string hash, used to seed the simulation from the league data. */
function hash(value: string): number {
  let result = 0x811c9dc5;
  for (let index = 0; index < value.length; index++) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 0x01000193);
  }
  return result >>> 0;
}
