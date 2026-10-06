import { FlightSearchUnavailableError } from "@/logic/FlightSearchUnavailableError";
import { parseSerpApiResponse, toSearchResult } from "@/logic/SerpApiFlightSearchClient";

const segment = (flightNumber: string, from: string, to: string) => ({
  airline: "American",
  flight_number: flightNumber,
  duration: 95,
  departure_airport: { id: from, time: "2026-10-10 07:15" },
  arrival_airport: { id: to, time: "2026-10-10 09:50" },
});

describe("toSearchResult", () => {
  it("toSearchResult_bestAndOtherFlights_mapsEveryFareCheapestFirstWithLink", () => {
    const result = toSearchResult({
      search_metadata: { google_flights_url: "https://www.google.com/travel/flights?q=ORD-CLT" },
      best_flights: [{ flights: [segment("AA 1", "ORD", "CLT")], price: 210, total_duration: 115 }],
      other_flights: [{ flights: [segment("AA 2", "ORD", "DFW"), segment("AA 3", "DFW", "CLT")], price: 160, total_duration: 260 }],
    });

    expect(result.googleFlightsUrl).toBe("https://www.google.com/travel/flights?q=ORD-CLT");
    expect(result.itineraries.map((itinerary) => itinerary.priceUsd)).toEqual([160, 210]);
    expect(result.itineraries[0]?.segments.map((entry) => `${entry.flightNumber} ${entry.departureAirport}-${entry.arrivalAirport}`)).toEqual([
      "AA 2 ORD-DFW",
      "AA 3 DFW-CLT",
    ]);
  });

  it("toSearchResult_noFlights_returnsEmptyQuote", () => {
    expect(toSearchResult({}).itineraries).toEqual([]);
  });
});

describe("parseSerpApiResponse", () => {
  it("parseSerpApiResponse_htmlErrorPage_throwsRetryableErrorWithSnippet", () => {
    expect(() => parseSerpApiResponse(503, "<!DOCTYPE html><html><body>Timed out</body></html>")).toThrow(
      new FlightSearchUnavailableError("SerpApi returned 503 non-JSON: <!DOCTYPE html><html><body>Timed out</body></html>"),
    );
  });

  it("parseSerpApiResponse_jsonError_throwsRetryableError", () => {
    expect(() => parseSerpApiResponse(200, JSON.stringify({ error: "Google hasn't returned any results" }))).toThrow(
      FlightSearchUnavailableError,
    );
  });

  it("parseSerpApiResponse_jsonResults_returnsBody", () => {
    expect(parseSerpApiResponse(200, JSON.stringify({ best_flights: [] }))).toEqual({ best_flights: [] });
  });
});
