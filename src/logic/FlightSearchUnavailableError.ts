/** The fare search provider was slow or answered with something other than results; safe to retry later. */
export class FlightSearchUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FlightSearchUnavailableError";
  }
}
