// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { MoonDrawer } from "@/components/MoonDrawer/MoonDrawer";
import type { MoonPanelState } from "@/types/moonPanelState";

const READY: MoonPanelState = {
  status: "ready",
  report: {
    ownerName: "Sam Longietti",
    crescent: { wins: 1, losses: 0, ties: 0, pointsFor: 130, averagePoints: 130 },
    other: { wins: 1, losses: 1, ties: 0, pointsFor: 200.5, averagePoints: 100.25 },
    weeks: [
      { week: 1, sunday: "2026-09-13", illuminationPercent: 7, phaseName: "Waxing Crescent", isCrescent: true, opponentName: "Ryan McCoy", pointsFor: 130, opponentPoints: 100, result: "W" },
      { week: 2, sunday: "2026-09-20", illuminationPercent: 62, phaseName: "Waxing Gibbous", isCrescent: false, opponentName: "Ty Houle", pointsFor: 90.5, opponentPoints: 120, result: "L" },
    ],
    upcoming: [
      { week: 6, sunday: "2026-10-18", illuminationPercent: 45, phaseName: "Waxing Crescent", isCrescent: true, opponentName: "Michael Blum" },
      { week: 7, sunday: "2026-10-25", illuminationPercent: 96, phaseName: "Waxing Gibbous", isCrescent: false, opponentName: "Jay Haynes" },
    ],
  },
};

describe("MoonDrawer", () => {
  it("MoonDrawer_readyReport_showsBothSplitsAndWeeks", () => {
    render(<MoonDrawer state={READY} onClose={vi.fn()} />);

    expect(screen.getByRole("dialog", { name: "Crescent Moon Summary" })).toBeInTheDocument();
    const crescent = screen.getByRole("region", { name: "Crescent moon" });
    expect(within(crescent).getByText("1-0")).toBeInTheDocument();
    expect(within(crescent).getAllByText("130.0")).toHaveLength(2);
    const other = screen.getByRole("region", { name: "Every other Sunday" });
    expect(within(other).getByText("1-1")).toBeInTheDocument();
    expect(within(other).getByText("200.5")).toBeInTheDocument();
    const weekOne = screen.getByRole("listitem", { name: "Week 1" });
    expect(weekOne).toHaveTextContent("Sun, Sep 13, 2026");
    expect(weekOne).toHaveTextContent("7% lit · Waxing Crescent");
    expect(weekOne).toHaveTextContent("Crescent");
    expect(weekOne).toHaveTextContent("vs Ryan McCoy");
    const weekTwo = screen.getByRole("listitem", { name: "Week 2" });
    expect(weekTwo).toHaveTextContent("62% lit · Waxing Gibbous");
    expect(weekTwo).toHaveTextContent("Loss");
    expect(within(weekTwo).queryByText("Crescent")).not.toBeInTheDocument();
  });

  it("MoonDrawer_upcomingTabClicked_listsMoonAndOpponentWithoutScore", async () => {
    render(<MoonDrawer state={READY} onClose={vi.fn()} />);

    await userEvent.click(screen.getByRole("tab", { name: /Upcoming/ }));

    expect(screen.queryByRole("region", { name: "Crescent moon" })).not.toBeInTheDocument();
    const upcoming = screen.getByRole("list", { name: "Upcoming Sundays" });
    const weekSix = within(upcoming).getByRole("listitem", { name: "Week 6" });
    expect(weekSix).toHaveTextContent("vs Michael Blum");
    expect(weekSix).toHaveTextContent("45% lit · Waxing Crescent");
    expect(weekSix).not.toHaveTextContent(/Win|Loss/);
  });

  it("MoonDrawer_upcomingTab_showsCrescentSundaysLeftInTitle", () => {
    render(<MoonDrawer state={READY} onClose={vi.fn()} />);

    expect(screen.getByRole("tab", { name: /^Upcoming\s*1\s*crescent Sunday left$/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "History" })).toHaveAttribute("aria-selected", "true");
  });

  it("MoonDrawer_arrowRightOnTabs_switchesToUpcoming", async () => {
    render(<MoonDrawer state={READY} onClose={vi.fn()} />);

    screen.getByRole("tab", { name: "History" }).focus();
    await userEvent.keyboard("{ArrowRight}");

    expect(screen.getByRole("tab", { name: /Upcoming/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("list", { name: "Upcoming Sundays" })).toBeInTheDocument();
  });

  it("MoonDrawer_error_showsMessage", () => {
    render(<MoonDrawer state={{ status: "error", message: "Moon stats are unavailable right now." }} onClose={vi.fn()} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Moon stats are unavailable right now.");
  });

  it("MoonDrawer_escapePressed_closes", async () => {
    const onClose = vi.fn();
    render(<MoonDrawer state={READY} onClose={onClose} />);

    await userEvent.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalled();
  });
});
