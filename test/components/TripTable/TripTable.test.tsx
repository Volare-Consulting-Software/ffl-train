// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TripTable } from "@/components/TripTable/TripTable";
import type { TripSummary } from "@/types/tripSummary";

const SUMMARY: TripSummary = {
  pick: { id: 4, season: 2026, week: 5, pickerTeamId: 2, pickerName: "Bobcats", stationCode: "CHI", destinationName: "Chicago" },
  destination: { code: "CHI", name: "Chicago Union Station", timeZone: "America/Chicago", latitude: 41.88, longitude: -87.64 },
  totalMiles: 1152,
  totalMinutes: 1694,
  arrival: "2026-10-10T13:45:00.000Z",
  transfers: 1,
  airport: { code: "ORD", name: "O'Hare", municipality: "Chicago", region: "IL", latitude: 41.98, longitude: -87.9 },
  error: null,
};

describe("TripTable", () => {
  it("TripTable_rowClicked_selectsPick", async () => {
    const onSelect = vi.fn();
    const onAirportClick = vi.fn();
    render(<TripTable summaries={[SUMMARY]} selectedPickId={null} loading={false} onSelect={onSelect} onAirportClick={onAirportClick} />);

    await userEvent.click(screen.getByText("Chicago"));

    expect(onSelect).toHaveBeenCalledWith(4);
    expect(onAirportClick).not.toHaveBeenCalled();
    expect(screen.getByText("1,152 mi")).toBeInTheDocument();
    expect(screen.getByText("28h 14m")).toBeInTheDocument();
  });

  it("TripTable_airportCodeClicked_requestsFlightWithoutSelectingRow", async () => {
    const onSelect = vi.fn();
    const onAirportClick = vi.fn();
    render(<TripTable summaries={[SUMMARY]} selectedPickId={null} loading={false} onSelect={onSelect} onAirportClick={onAirportClick} />);

    await userEvent.click(screen.getByRole("button", { name: "ORD" }));

    expect(onAirportClick).toHaveBeenCalledWith(SUMMARY);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("TripTable_noPicks_showsEmptyState", () => {
    render(<TripTable summaries={[]} selectedPickId={null} loading={false} onSelect={vi.fn()} onAirportClick={vi.fn()} />);

    expect(screen.getByText("No destinations picked yet.")).toBeInTheDocument();
  });
});
