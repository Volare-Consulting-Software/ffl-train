import { inject, injectable } from "tsyringe";

import { type FantasyLeagueClient, FantasyLeagueClientToken } from "@/interfaces/fantasyLeagueClient";
import { type PickRepository, PickRepositoryToken } from "@/interfaces/pickRepository";
import type { PickerSuggester } from "@/interfaces/pickerSuggester";
import { completedWeekScores } from "@/lib/leagueScores";
import type { PickerSuggestion } from "@/types/pickerSuggestion";

/** Suggests the highest scorer who hasn't picked yet for the first completed week still missing a pick. */
@injectable()
export class LeaguePickerSuggester implements PickerSuggester {
  constructor(
    @inject(FantasyLeagueClientToken) private readonly leagueClient: FantasyLeagueClient,
    @inject(PickRepositoryToken) private readonly pickRepository: PickRepository,
  ) {}

  async suggest(season: number): Promise<PickerSuggestion | null> {
    const [league, picks] = await Promise.all([this.leagueClient.getSeason(season), this.pickRepository.listForSeason(season)]);
    const scores = completedWeekScores(league);
    const pickedWeeks = new Set(picks.map((pick) => pick.week));
    const pickedTeams = new Set(picks.map((pick) => pick.pickerTeamId));
    const openWeek = [...new Set(scores.map((score) => score.week))].sort((a, b) => a - b).find((week) => !pickedWeeks.has(week));
    if (openWeek === undefined) {
      return null;
    }

    // Ties go to the lower team id so the suggestion is stable between requests.
    const eligible = scores
      .filter((score) => score.week === openWeek && !pickedTeams.has(score.teamId))
      .sort((a, b) => b.points - a.points || a.teamId - b.teamId);
    const top = eligible[0];
    if (!top) {
      return null;
    }
    return { season, week: openWeek, teamId: top.teamId, ownerName: top.ownerName, points: top.points };
  }
}
