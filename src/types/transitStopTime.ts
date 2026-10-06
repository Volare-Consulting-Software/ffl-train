/** A scheduled call in a trip. Seconds are from the service day's start in the feed's agency time zone and may exceed 24h. */
export interface TransitStopTime {
  stationCode: string;
  arrivalSeconds: number;
  departureSeconds: number;
  distanceMiles: number;
  shapeIndex: number | null;
}
