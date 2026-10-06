import { injectable } from "tsyringe";

import type { FantasyLeagueClient } from "@/interfaces/fantasyLeagueClient";
import { seededRandom } from "@/logic/LoserBracketSimulator";
import type { LeagueMatchup } from "@/types/leagueMatchup";
import type { LeagueSeason } from "@/types/leagueSeason";

const SAMPLE_OWNERS = [
  "Sample Alex",
  "Sample Jordan",
  "Sample Casey",
  "Sample Morgan",
  "Sample Riley",
  "Sample Taylor",
  "Sample Quinn",
  "Sample Avery",
  "Sample Parker",
  "Sample Reese",
  "Sample Drew",
  "Sample Jamie",
];
const REGULAR_SEASON_WEEKS = 14;
const COMPLETED_WEEKS = 5;

/**
 * A made-up 12-team league for previewing the app before ESPN is connected. Enabled only by
 * ESPN_USE_SAMPLE_LEAGUE=true, and flagged as sample data so the UI can say so.
 */
@injectable()
export class SampleFantasyLeagueClient implements FantasyLeagueClient {
  async getSeason(season: number): Promise<LeagueSeason> {
    const random = seededRandom(season);
    const teams = SAMPLE_OWNERS.map((ownerName, index) => ({ teamId: index + 1, ownerName }));
    const averages = new Map(teams.map((team, index) => [team.teamId, 92 + index * 3.5]));
    const matchups: LeagueMatchup[] = [];

    for (let week = 1; week <= REGULAR_SEASON_WEEKS; week++) {
      const order = rotate(teams.map((team) => team.teamId), week);
      for (let slot = 0; slot < order.length / 2; slot++) {
        const homeTeamId = order[slot]!;
        const awayTeamId = order[order.length - 1 - slot]!;
        const completed = week <= COMPLETED_WEEKS;
        const score = (teamId: number) => (completed ? Math.round((averages.get(teamId)! + (random() - 0.5) * 50) * 100) / 100 : 0);
        matchups.push({ week, homeTeamId, awayTeamId, homePoints: score(homeTeamId), awayPoints: score(awayTeamId), completed });
      }
    }
    return { season, teams, matchups, isSample: true };
  }
}

/** Round-robin rotation: keep the first team fixed and rotate the rest one slot per week. */
function rotate(teamIds: number[], week: number): number[] {
  const [fixed, ...rest] = teamIds;
  const shift = week % rest.length;
  return [fixed!, ...rest.slice(shift), ...rest.slice(0, shift)];
}
