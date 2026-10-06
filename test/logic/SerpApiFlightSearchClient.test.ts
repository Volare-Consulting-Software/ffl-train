import { toSearchResult } from "@/logic/SerpApiFlightSearchClient";

const segment = { departure_airport: { id: "ORD" }, arrival_airport: { id: "CLT" } };

describe("toSearchResult", () => {
  it("toSearchResult_bestAndOtherFlights_picksCheapestAndCountsConnections", () => {
    const result = toSearchResult({
      best_flights: [{ flights: [segment], price: 210, total_duration: 115 }],
      other_flights: [{ flights: [segment, segment], price: 160, total_duration: 260 }],
    });

    expect(result).toMatchObject({ priceUsd: 160, connections: 1, durationMinutes: 260 });
  });

  it("toSearchResult_noFlights_returnsEmptyQuote", () => {
    expect(toSearchResult({})).toMatchObject({ priceUsd: null, connections: null, durationMinutes: null });
  });
});
