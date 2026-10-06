import { injectable } from "tsyringe";

import type { FantasyLeagueClient } from "@/interfaces/fantasyLeagueClient";
import type { TeamWeekScore } from "@/types/teamWeekScore";

const ESPN_LEAGUE_URL = "https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons";

interface EspnTeam {
  id: number;
  name?: string;
  location?: string;
  nickname?: string;
}

interface EspnMatchupSide {
  teamId: number;
  totalPoints: number;
}

interface EspnMatchup {
  matchupPeriodId: number;
  winner: string;
  home?: EspnMatchupSide;
  away?: EspnMatchupSide;
}

interface EspnLeagueResponse {
  teams?: EspnTeam[];
  schedule?: EspnMatchup[];
}

/** Weekly scores from ESPN's fantasy football league API. */
@injectable()
export class EspnFantasyLeagueClient implements FantasyLeagueClient {
  async getCompletedWeekScores(season: number): Promise<TeamWeekScore[]> {
    const leagueId = process.env.ESPN_LEAGUE_ID;
    if (!leagueId) {
      throw new Error("ESPN_LEAGUE_ID is not set");
    }
    const headers: Record<string, string> = { Accept: "application/json" };
    if (process.env.ESPN_S2 && process.env.ESPN_SWID) {
      headers.Cookie = `espn_s2=${process.env.ESPN_S2}; SWID=${process.env.ESPN_SWID}`;
    }
    const response = await fetch(
      `${ESPN_LEAGUE_URL}/${season}/segments/0/leagues/${leagueId}?view=mMatchupScore&view=mTeam`,
      { headers, cache: "no-store" },
    );
    if (!response.ok) {
      throw new Error(`ESPN league request failed with ${response.status}`);
    }
    return toWeekScores((await response.json()) as EspnLeagueResponse);
  }
}

/** Flattens decided matchups into one score per team per week. Undecided (in-progress) weeks are left out. */
export function toWeekScores(league: EspnLeagueResponse): TeamWeekScore[] {
  const teamNames = new Map(
    (league.teams ?? []).map((team) => [team.id, team.name ?? `${team.location ?? ""} ${team.nickname ?? ""}`.trim()]),
  );
  return (league.schedule ?? [])
    .filter((matchup) => matchup.winner !== "UNDECIDED")
    .flatMap((matchup) =>
      [matchup.home, matchup.away]
        .filter((side): side is EspnMatchupSide => side !== undefined)
        .map((side) => ({
          teamId: side.teamId,
          teamName: teamNames.get(side.teamId) ?? `Team ${side.teamId}`,
          week: matchup.matchupPeriodId,
          points: side.totalPoints,
        })),
    );
}
