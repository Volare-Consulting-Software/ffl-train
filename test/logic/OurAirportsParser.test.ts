import { OurAirportsParser } from "@/logic/OurAirportsParser";

const CSV = `"id","ident","type","name","latitude_deg","longitude_deg","elevation_ft","continent","iso_country","iso_region","municipality","scheduled_service","gps_code","iata_code"
1,"KCLT","large_airport","Charlotte Douglas International Airport",35.214,-80.9431,748,"NA","US","US-NC","Charlotte","yes","KCLT","CLT"
2,"KGSO","medium_airport","Piedmont Triad International Airport",36.09,-79.94,925,"NA","US","US-NC","Greensboro","yes","KGSO","GSO"
3,"CYYZ","large_airport","Toronto Pearson International Airport",43.67,-79.63,569,"NA","CA","CA-ON","Toronto","yes","CYYZ","YYZ"
4,"EGLL","large_airport","Heathrow",51.47,-0.46,83,"EU","GB","GB-ENG","London","yes","EGLL","LHR"`;

describe("parse", () => {
  it("parse_mixedAirports_keepsLargeUsAndCanadianWithIataCodes", () => {
    const airports = new OurAirportsParser().parse(CSV);

    expect(airports.map((airport) => airport.code)).toEqual(["CLT", "YYZ"]);
    expect(airports[0]).toEqual({
      code: "CLT",
      name: "Charlotte Douglas International Airport",
      municipality: "Charlotte",
      region: "NC",
      country: "US",
      latitude: 35.214,
      longitude: -80.9431,
    });
  });
});
