import { injectable } from "tsyringe";

import type { FantasyLeagueClient } from "@/interfaces/fantasyLeagueClient";
import type { LeagueSeason } from "@/types/leagueSeason";

const ESPN_LEAGUE_URL = "https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons";
const REGULAR_SEASON_TIER = "NONE";

interface EspnMember {
  id: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
}

interface EspnTeam {
  id: number;
  name?: string;
  location?: string;
  nickname?: string;
  primaryOwner?: string;
  owners?: string[];
}

interface EspnMatchupSide {
  teamId: number;
  totalPoints: number;
}

interface EspnMatchup {
  matchupPeriodId: number;
  winner: string;
  playoffTierType?: string;
  home?: EspnMatchupSide;
  away?: EspnMatchupSide;
}

export interface EspnLeagueResponse {
  members?: EspnMember[];
  teams?: EspnTeam[];
  schedule?: EspnMatchup[];
}

/** Teams and the regular-season schedule from ESPN's fantasy football league API. */
@injectable()
export class EspnFantasyLeagueClient implements FantasyLeagueClient {
  async getSeason(season: number): Promise<LeagueSeason> {
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
    return toLeagueSeason(season, (await response.json()) as EspnLeagueResponse);
  }
}

/**
 * Maps ESPN's league payload to teams labeled with the owner's name (falling back to the team name)
 * and the regular-season schedule. ESPN playoff matchups are left out; an undecided week is unplayed.
 */
export function toLeagueSeason(season: number, league: EspnLeagueResponse): LeagueSeason {
  const memberNames = new Map(
    (league.members ?? []).map((member) => [
      member.id,
      `${member.firstName ?? ""} ${member.lastName ?? ""}`.trim() || member.displayName || "",
    ]),
  );
  const teams = (league.teams ?? []).map((team) => {
    const ownerId = team.primaryOwner ?? team.owners?.[0];
    const teamName = team.name ?? `${team.location ?? ""} ${team.nickname ?? ""}`.trim();
    return { teamId: team.id, ownerName: (ownerId && memberNames.get(ownerId)) || teamName || `Team ${team.id}` };
  });
  const matchups = (league.schedule ?? [])
    .filter((matchup) => (matchup.playoffTierType ?? REGULAR_SEASON_TIER) === REGULAR_SEASON_TIER && matchup.home)
    .map((matchup) => ({
      week: matchup.matchupPeriodId,
      homeTeamId: matchup.home!.teamId,
      awayTeamId: matchup.away?.teamId ?? null,
      homePoints: matchup.home!.totalPoints,
      awayPoints: matchup.away?.totalPoints ?? 0,
      completed: matchup.winner !== "UNDECIDED",
    }));
  return { season, teams, matchups };
}
