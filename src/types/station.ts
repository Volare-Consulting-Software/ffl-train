/** An Amtrak station from the imported GTFS feed. */
export interface Station {
  code: string;
  name: string;
  timeZone: string;
  latitude: number;
  longitude: number;
}
