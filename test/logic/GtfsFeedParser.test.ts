import AdmZip from "adm-zip";

import { GtfsFeedParser, parseGtfsTime, projectOntoShape } from "@/logic/GtfsFeedParser";

function buildZip(files: Record<string, string>): Buffer {
  const zip = new AdmZip();
  for (const [name, content] of Object.entries(files)) {
    zip.addFile(name, Buffer.from(content));
  }
  return zip.toBuffer();
}

const FEED = {
  "routes.txt": "route_id,agency_id,route_short_name,route_long_name,route_type\nR1,51,,Carolinian,2\nBUS,99,,Thruway,3\n",
  "trips.txt": "route_id,service_id,trip_id,trip_short_name,direction_id,shape_id,trip_headsign\nR1,S1,T1,79,0,SH1,Charlotte\nBUS,S1,B1,8001,0,,Bus\n",
  "stop_times.txt":
    "trip_id,arrival_time,departure_time,stop_id,stop_sequence\nT1,07:00:00,07:00:00,RGH,1\nT1,24:30:00,24:35:00,CLT,2\nB1,08:00:00,08:00:00,XBS,1\n",
  "stops.txt":
    "stop_id,stop_code,stop_name,stop_url,stop_timezone,stop_lat,stop_lon\nRGH,RGH,Raleigh,,America/New_York,35.77,-78.64\nCLT,CLT,Charlotte,,America/New_York,35.24,-80.82\nXBS,XBS,Bus Stop,,America/New_York,30,-80\n",
  "shapes.txt": "shape_id,shape_pt_lat,shape_pt_lon,shape_pt_sequence\nSH1,35.24,-80.82,2\nSH1,35.77,-78.64,1\n",
  "calendar.txt":
    "service_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday,start_date,end_date\nS1,1,0,0,0,1,0,1,20261001,20261231\n",
};

describe("parse", () => {
  it("parse_mixedRailAndBus_keepsRailOnlyWithDistancesAndCalendars", () => {
    const feed = new GtfsFeedParser().parse(buildZip(FEED));

    expect(feed.routes).toEqual([{ id: "R1", name: "Carolinian" }]);
    expect(feed.trips.map((trip) => trip.id)).toEqual(["T1"]);
    expect(feed.stations.map((station) => station.code).sort()).toEqual(["CLT", "RGH"]);
    expect(feed.shapes[0]?.points).toEqual([
      [35.77, -78.64],
      [35.24, -80.82],
    ]);
    expect(feed.stopTimes[1]).toMatchObject({ stationCode: "CLT", arrivalSeconds: 88_200, departureSeconds: 88_500, shapeIndex: 1 });
    expect(feed.stopTimes[1]?.distanceMiles).toBeGreaterThan(120);
    expect(feed.calendars).toEqual([{ serviceId: "S1", weekdays: 0b1010001, startDate: "2026-10-01", endDate: "2026-12-31" }]);
  });

  it("parse_missingFile_throws", () => {
    const withoutShapes: Record<string, string> = { ...FEED };
    delete withoutShapes["shapes.txt"];

    expect(() => new GtfsFeedParser().parse(buildZip(withoutShapes))).toThrow("GTFS zip is missing shapes.txt");
  });
});

describe("parseGtfsTime", () => {
  it("parseGtfsTime_pastMidnight_returnsSecondsBeyondOneDay", () => {
    expect(parseGtfsTime("25:30:15")).toBe(91_815);
  });
});

describe("projectOntoShape", () => {
  it("projectOntoShape_stopFarFromTrack_fallsBackToStraightLine", () => {
    const projection = projectOntoShape(
      [
        [35, -80],
        [40, -80],
      ],
      [
        [35, -80],
        [35, -79],
      ],
    );

    expect(projection.shapeIndexes).toEqual([null, null]);
    expect(projection.distances[1]).toBeCloseTo(345.5, 0);
  });
});
