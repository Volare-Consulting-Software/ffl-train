/** One flight within a fare. Times are local to each airport as `YYYY-MM-DD HH:MM`. */
export interface FlightSegment {
  airline: string;
  flightNumber: string;
  departureAirport: string;
  departureTime: string;
  arrivalAirport: string;
  arrivalTime: string;
  durationMinutes: number | null;
}
