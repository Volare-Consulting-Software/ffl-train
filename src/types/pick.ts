/** A weekly destination pick added by that week's eligible top scorer. */
export interface Pick {
  id: number;
  season: number;
  week: number;
  pickerTeamId: number;
  pickerName: string;
  stationCode: string;
  destinationName: string;
}
