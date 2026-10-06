import type { LatLng } from "@/types/latLng";
import type { TransitNetwork } from "@/types/transitNetwork";

/** Read access to the imported Amtrak schedule. */
export interface TransitRepository {
  /** Loads stations, trips and calendars. Implementations cache the result per process. */
  getNetwork(): Promise<TransitNetwork>;
  /** Track geometry for a shape, or an empty list when the shape is unknown. */
  getShape(shapeId: string): Promise<LatLng[]>;
}

export const TransitRepositoryToken = Symbol.for("TransitRepository");
