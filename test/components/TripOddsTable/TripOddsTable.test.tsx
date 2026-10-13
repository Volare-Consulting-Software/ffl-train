// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TripOddsTable } from "@/components/TripOddsTable/TripOddsTable";
import type { TeamTripOdds } from "@/types/teamTripOdds";
import type { TripOddsReport } from "@/types/tripOddsReport";

const team = (teamId: number, ownerName: string): TeamTripOdds => ({
  teamId,
  ownerName,
  wins: 3,
  losses: 2,
  ties: 0,
  pointsFor: 600.4,
  standing: teamId,
  loserBracketProbability: 0.2,
  ultimateLoserProbability: 0.02,
  tripProbability: 0.1,
});
const REPORT: TripOddsReport = { season: 2026, teams: [team(1, "Sam Longietti"), team(2, "Ryan McCoy")], simulations: 5000, remainingGames: 54 };

describe("TripOddsTable", () => {
  it("TripOddsTable_moonButtonClicked_callsOnMoonClick", async () => {
    const onMoonClick = vi.fn();
    render(<TripOddsTable report={REPORT} onMoonClick={onMoonClick} />);

    await userEvent.click(screen.getByRole("button", { name: "Crescent moon summary for Sam Longietti" }));

    expect(onMoonClick).toHaveBeenCalledOnce();
    expect(screen.getAllByRole("button", { name: /Crescent moon summary/ })).toHaveLength(1);
  });
});
