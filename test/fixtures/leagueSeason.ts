import { seededRandom } from "@/logic/LoserBracketSimulator";
import type { LeagueMatchup } from "@/types/leagueMatchup";
import type { LeagueSeason } from "@/types/leagueSeason";

export const TEAM_COUNT = 12;

/**
 * A 12-team round-robin league. `averages` sets each team's typical score (index 0 = team 1);
 * the first `completedWeeks` weeks get noisy scores around those averages, the rest are unplayed.
 */
export function buildLeagueSeason(averages: number[], completedWeeks: number, totalWeeks = 11): LeagueSeason {
  const random = seededRandom(42);
  const teamIds = averages.map((_, index) => index + 1);
  const matchups: LeagueMatchup[] = [];
  for (let week = 1; week <= totalWeeks; week++) {
    const [fixed, ...rest] = teamIds;
    const shift = week % rest.length;
    const order = [fixed!, ...rest.slice(shift), ...rest.slice(0, shift)];
    for (let slot = 0; slot < order.length / 2; slot++) {
      const homeTeamId = order[slot]!;
      const awayTeamId = order[order.length - 1 - slot]!;
      const completed = week <= completedWeeks;
      const score = (teamId: number) => (completed ? averages[teamId - 1]! + (random() - 0.5) * 60 : 0);
      matchups.push({ week, homeTeamId, awayTeamId, homePoints: score(homeTeamId), awayPoints: score(awayTeamId), completed });
    }
  }
  return {
    season: 2026,
    teams: teamIds.map((teamId) => ({ teamId, ownerName: `Person ${teamId}` })),
    matchups,
  };
}
