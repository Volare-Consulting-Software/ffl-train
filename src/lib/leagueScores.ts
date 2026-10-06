import type { LeagueSeason } from "@/types/leagueSeason";
import type { TeamWeekScore } from "@/types/teamWeekScore";

/** One score per team per completed week, labeled with the owner's name. */
export function completedWeekScores(season: LeagueSeason): TeamWeekScore[] {
  const owners = new Map(season.teams.map((team) => [team.teamId, team.ownerName]));
  return season.matchups
    .filter((matchup) => matchup.completed)
    .flatMap((matchup) => {
      const sides: [number, number][] = [[matchup.homeTeamId, matchup.homePoints]];
      if (matchup.awayTeamId !== null) {
        sides.push([matchup.awayTeamId, matchup.awayPoints]);
      }
      return sides.map(([teamId, points]) => ({
        teamId,
        ownerName: owners.get(teamId) ?? `Team ${teamId}`,
        week: matchup.week,
        points,
      }));
    });
}
