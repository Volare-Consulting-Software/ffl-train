import { injectable } from "tsyringe";

import type { PickRepository } from "@/interfaces/pickRepository";
import { getDb } from "@/lib/db";
import type { Pick } from "@/types/pick";

const PICK_FIELDS = {
  id: true,
  season: true,
  week: true,
  pickerTeamId: true,
  pickerName: true,
  stationCode: true,
  destinationName: true,
} as const;

/** Picks stored in the picks table. */
@injectable()
export class PrismaPickRepository implements PickRepository {
  list(): Promise<Pick[]> {
    return getDb().pick.findMany({ select: PICK_FIELDS, orderBy: [{ season: "desc" }, { week: "desc" }] });
  }

  listForSeason(season: number): Promise<Pick[]> {
    return getDb().pick.findMany({ select: PICK_FIELDS, where: { season }, orderBy: { week: "desc" } });
  }

  findById(id: number): Promise<Pick | null> {
    return getDb().pick.findUnique({ select: PICK_FIELDS, where: { id } });
  }

  create(pick: Omit<Pick, "id">): Promise<Pick> {
    return getDb().pick.create({ select: PICK_FIELDS, data: pick });
  }
}
