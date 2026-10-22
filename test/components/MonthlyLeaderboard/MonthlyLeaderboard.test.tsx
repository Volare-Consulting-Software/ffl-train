// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { MonthlyLeaderboard } from "@/components/MonthlyLeaderboard/MonthlyLeaderboard";
import type { MonthlyLeaderboardReport } from "@/types/monthlyLeaderboardReport";

const REPORT: MonthlyLeaderboardReport = {
  season: 2026,
  current: {
    month: "2026-10",
    weeks: [4, 5, 6, 7],
    liveWeek: 7,
    remainingWeeks: [8, 9],
    standings: [
      { teamId: 3, ownerName: "Ryan McCoy", points: 699, behind: 0 },
      { teamId: 1, ownerName: "Sam Longietti", points: 685, behind: 14 },
    ],
  },
  winners: [
    {
      month: "2026-09",
      points: 612.4,
      teams: [
        { teamId: 1, ownerName: "Sam Longietti" },
        { teamId: 5, ownerName: "Ty Houle" },
      ],
    },
  ],
};

describe("MonthlyLeaderboard", () => {
  it("MonthlyLeaderboard_currentMonth_showsLeaderPointsAndDeficits", () => {
    render(<MonthlyLeaderboard report={REPORT} />);

    expect(screen.getByRole("heading", { name: "October leaderboard" })).toBeInTheDocument();
    expect(screen.getByText("Week 7 live")).toBeInTheDocument();
    expect(screen.getByText("2 weeks left")).toBeInTheDocument();
    const rows = within(screen.getByRole("list", { name: "Standings" })).getAllByRole("listitem");
    expect(rows[0]).toHaveTextContent("Ryan McCoy");
    expect(rows[0]).toHaveTextContent("699.0");
    expect(rows[1]).toHaveTextContent("Sam Longietti");
    expect(rows[1]).toHaveTextContent("−14.0");
    expect(within(rows[1]!).getByText("14.0 behind")).toBeInTheDocument();
  });

  it("MonthlyLeaderboard_moreThanFiveTeams_showsTopFiveAndExpandsForTheRest", async () => {
    const standings = Array.from({ length: 7 }, (_, index) => ({
      teamId: index + 1,
      ownerName: `Person ${index + 1}`,
      points: 700 - index * 10,
      behind: index * 10,
    }));
    render(<MonthlyLeaderboard report={{ ...REPORT, current: { ...REPORT.current!, standings } }} />);

    expect(within(screen.getByRole("list", { name: "Standings" })).getAllByRole("listitem")).toHaveLength(5);
    const details = screen.getByText("Show all 7").closest("details")!;
    expect(details).not.toHaveAttribute("open");

    await userEvent.click(screen.getByText("Show all 7"));

    expect(details).toHaveAttribute("open");
    const more = within(screen.getByRole("list", { name: "More standings" })).getAllByRole("listitem");
    expect(more.map((row) => row.textContent)).toEqual([expect.stringContaining("Person 6"), expect.stringContaining("Person 7")]);
  });

  it.each([
    [[9], 8, "1 week left"],
    [[], 9, "Final week"],
    [[], null, "Final"],
  ])("MonthlyLeaderboard_remainingWeeks%j_labels%s", (remainingWeeks, liveWeek, label) => {
    render(<MonthlyLeaderboard report={{ ...REPORT, current: { ...REPORT.current!, remainingWeeks, liveWeek } }} />);

    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("MonthlyLeaderboard_fiveOrFewerTeams_hasNoExpand", () => {
    render(<MonthlyLeaderboard report={REPORT} />);

    expect(screen.queryByText(/Show all/)).not.toBeInTheDocument();
  });

  it("MonthlyLeaderboard_finishedMonths_listsWinnersIncludingTies", () => {
    render(<MonthlyLeaderboard report={REPORT} />);

    const winners = within(screen.getByRole("list", { name: "Past winners" })).getAllByRole("listitem");
    expect(winners).toHaveLength(1);
    expect(winners[0]).toHaveTextContent("September");
    expect(winners[0]).toHaveTextContent("Sam Longietti & Ty Houle");
    expect(winners[0]).toHaveTextContent("612.4");
  });

  it("MonthlyLeaderboard_noPointsYet_showsEmptyState", () => {
    const report: MonthlyLeaderboardReport = {
      season: 2026,
      current: { month: "2026-09", weeks: [1], liveWeek: 1, remainingWeeks: [], standings: [{ teamId: 1, ownerName: "Sam Longietti", points: 0, behind: 0 }] },
      winners: [],
    };

    render(<MonthlyLeaderboard report={report} />);

    expect(screen.getByText("No games played yet this month.")).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "Past winners" })).not.toBeInTheDocument();
  });
});
