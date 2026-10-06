/** A large commercial airport, identified by its IATA code. */
export interface Airport {
  code: string;
  name: string;
  municipality: string;
  region: string;
  latitude: number;
  longitude: number;
}
