import type { Pick } from "@/types/pick";

/** Weekly destination picks. */
export interface PickRepository {
  /** All picks, newest week first. */
  list(): Promise<Pick[]>;
  listForSeason(season: number): Promise<Pick[]>;
  findById(id: number): Promise<Pick | null>;
  create(pick: Omit<Pick, "id">): Promise<Pick>;
}

export const PickRepositoryToken = Symbol.for("PickRepository");
