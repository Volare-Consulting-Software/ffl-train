import { toSearchResult } from "@/logic/SerpApiFlightSearchClient";

const segment = (flightNumber: string, from: string, to: string) => ({
  airline: "American",
  flight_number: flightNumber,
  duration: 95,
  departure_airport: { id: from, time: "2026-10-10 07:15" },
  arrival_airport: { id: to, time: "2026-10-10 09:50" },
});

describe("toSearchResult", () => {
  it("toSearchResult_bestAndOtherFlights_picksCheapestWithSegmentsAndLink", () => {
    const result = toSearchResult({
      search_metadata: { google_flights_url: "https://www.google.com/travel/flights?q=ORD-CLT" },
      best_flights: [{ flights: [segment("AA 1", "ORD", "CLT")], price: 210, total_duration: 115 }],
      other_flights: [{ flights: [segment("AA 2", "ORD", "DFW"), segment("AA 3", "DFW", "CLT")], price: 160, total_duration: 260 }],
    });

    expect(result).toMatchObject({
      priceUsd: 160,
      connections: 1,
      durationMinutes: 260,
      googleFlightsUrl: "https://www.google.com/travel/flights?q=ORD-CLT",
    });
    expect(result.segments.map((entry) => `${entry.flightNumber} ${entry.departureAirport}-${entry.arrivalAirport}`)).toEqual([
      "AA 2 ORD-DFW",
      "AA 3 DFW-CLT",
    ]);
  });

  it("toSearchResult_noFlights_returnsEmptyQuote", () => {
    expect(toSearchResult({})).toMatchObject({ priceUsd: null, connections: null, durationMinutes: null, segments: [] });
  });
});
