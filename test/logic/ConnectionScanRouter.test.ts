import { ConnectionScanRouter } from "@/logic/ConnectionScanRouter";
import { mockTransitRepository } from "../fixtures/registerMocks";

const FRIDAY = "2026-10-09";
const SATURDAY = "2026-10-10";

const createRouter = () => new ConnectionScanRouter(mockTransitRepository());

describe("findItinerary", () => {
  it("findItinerary_directTrain_returnsSingleLegWithShapePath", async () => {
    const itinerary = await createRouter().findItinerary("CLT", "BBB", FRIDAY);

    expect(itinerary?.legs).toHaveLength(1);
    expect(itinerary?.legs[0]?.trainName).toBe("Alpha");
    expect(itinerary?.totalMinutes).toBe(120);
    expect(itinerary?.totalMiles).toBe(90);
    expect(itinerary?.legs[0]?.path).toEqual([
      [35.24, -80.82],
      [35.6, -80.4],
      [36.0, -79.9],
    ]);
  });

  it("findItinerary_connectionUnderMinimumTransfer_takesLaterTrainAndReportsLayover", async () => {
    const itinerary = await createRouter().findItinerary("CLT", "DDD", FRIDAY);

    expect(itinerary?.legs.map((leg) => leg.trainNumber)).toEqual(["1", "4"]);
    expect(itinerary?.layovers).toEqual([
      expect.objectContaining({ minutes: 60, fromTrain: "Alpha 1", toTrain: "Beta 4" }),
    ]);
    expect(itinerary?.layovers[0]?.station.code).toBe("CCC");
    expect(itinerary?.totalMinutes).toBe(420);
    expect(itinerary?.totalMiles).toBe(280);
  });

  it("findItinerary_trainPastMidnight_arrivesNextDay", async () => {
    const itinerary = await createRouter().findItinerary("CLT", "EEE", FRIDAY);

    expect(itinerary?.departure).toBe("2026-10-10T03:00:00.000Z");
    expect(itinerary?.arrival).toBe("2026-10-10T05:30:00.000Z");
    expect(itinerary?.legs[0]?.intermediateStops).toEqual([]);
  });

  it("findItinerary_serviceNotRunningInWindow_returnsNull", async () => {
    expect(await createRouter().findItinerary("CLT", "EEE", SATURDAY)).toBeNull();
  });

  it("findItinerary_trainAlsoCallsAtOrigin_boardsAtOriginInsteadOfDoublingBack", async () => {
    const itinerary = await createRouter().findItinerary("CLT", "WAS", FRIDAY);

    expect(itinerary?.legs).toHaveLength(1);
    expect(itinerary?.legs[0]?.board.station.code).toBe("CLT");
    expect(itinerary?.layovers).toEqual([]);
  });

  it("findItinerary_unreachableStation_returnsNull", async () => {
    expect(await createRouter().findItinerary("CLT", "ZZZ", FRIDAY)).toBeNull();
  });

  it("findItinerary_unknownStation_throws", async () => {
    await expect(createRouter().findItinerary("CLT", "NOPE", FRIDAY)).rejects.toThrow("Unknown destination station NOPE");
  });
});
