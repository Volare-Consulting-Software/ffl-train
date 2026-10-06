// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { FlightDrawer } from "@/components/FlightDrawer/FlightDrawer";
import type { FlightPanelState } from "@/types/flightPanelState";

const AIRPORT = { code: "MSY", name: "Louis Armstrong New Orleans International Airport", municipality: "New Orleans", region: "LA", latitude: 29.99, longitude: -90.26 };
const READY: FlightPanelState = {
  airport: AIRPORT,
  pickId: 1,
  status: "ready",
  quote: {
    airportCode: "MSY",
    flightDate: "2026-10-10",
    priceUsd: 238,
    connections: 1,
    durationMinutes: 260,
    flightDistanceMiles: 581,
    segments: [
      { airline: "Delta", flightNumber: "DL 1", departureAirport: "MSY", departureTime: "2026-10-10 06:00", arrivalAirport: "ATL", arrivalTime: "2026-10-10 08:40", durationMinutes: 100 },
    ],
    googleFlightsUrl: "https://www.google.com/travel/flights?q=MSY-CLT",
    earliestDeparture: "2026-10-09 23:12",
    fetchedAt: "2026-10-06T12:00:00.000Z",
  },
};

describe("FlightDrawer", () => {
  it("FlightDrawer_readyQuote_showsFareSegmentsAndLink", () => {
    render(<FlightDrawer state={READY} onClose={vi.fn()} />);

    expect(screen.getByRole("dialog", { name: "MSY to CLT" })).toBeInTheDocument();
    expect(screen.getByText("$238")).toBeInTheDocument();
    expect(screen.getByText("581 mi")).toBeInTheDocument();
    expect(screen.getByText("MSY 6:00 AM → ATL 8:40 AM")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View on Google Flights/ })).toHaveAttribute("href", READY.status === "ready" ? READY.quote.googleFlightsUrl : "");
  });

  it("FlightDrawer_escapePressed_closes", async () => {
    const onClose = vi.fn();
    render(<FlightDrawer state={READY} onClose={onClose} />);

    await userEvent.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalled();
  });

  it("FlightDrawer_noState_rendersNothing", () => {
    const { container } = render(<FlightDrawer state={null} onClose={vi.fn()} />);

    expect(container).toBeEmptyDOMElement();
  });
});
