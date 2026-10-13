/** One regular-season week for the moon team: that Sunday's Moon and who they play. */
export interface MoonSunday {
  week: number;
  sunday: string;
  illuminationPercent: number;
  phaseName: string;
  isCrescent: boolean;
  opponentName: string;
}
