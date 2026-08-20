import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HintLadder } from "./hint-ladder";
import { MissionMap } from "./mission-map";


describe("MissionMap", () => {
  it("names mastery states and keeps locked missions non-navigable", () => {
    render(
      <MissionMap
        skills={[
          { skill: "sql", cleared: 2, total: 2, mastered: true, personalBest: 1 },
          { skill: "statistics", cleared: 0, total: 2, mastered: false, personalBest: 0 },
        ]}
        drills={[
          { id: "sql-one", title: "SQL Expedition", skill: "sql", concept: "joins", track: "analytics-core", prerequisites: [] },
          { id: "stats-one", title: "Experiment Lab", skill: "statistics", concept: "tests", track: "analytics-core", prerequisites: ["missing-prerequisite"] },
        ]}
      />,
    );
    expect(screen.getByRole("link", { name: /SQL Expedition.*mastered/i })).toBeInTheDocument();
    expect(screen.getByText("Locked", { selector: "span" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Experiment Lab/i })).not.toBeInTheDocument();
  });
});


describe("HintLadder", () => {
  it("shows only unlocked hints and confirms before revealing the solution", () => {
    const reveal = vi.fn();
    const { rerender } = render(
      <HintLadder
        conceptual="Think about the grain."
        pattern="GROUP BY the dimension."
        solutionRevealed={false}
        unlocked={{ conceptual: false, pattern: false, solutionRevealAvailable: false }}
        onRevealSolution={reveal}
      />,
    );
    expect(screen.queryByText("Think about the grain.")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /worked solution/i })).not.toBeInTheDocument();

    rerender(
      <HintLadder
        conceptual="Think about the grain."
        pattern="GROUP BY the dimension."
        solutionRevealed={false}
        unlocked={{ conceptual: true, pattern: true, solutionRevealAvailable: true }}
        onRevealSolution={reveal}
      />,
    );
    expect(screen.getByText("Think about the grain.")).toBeInTheDocument();
    expect(screen.getByText("GROUP BY the dimension.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /worked solution/i }));
    expect(screen.getByText(/cannot earn independent mastery/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /reveal and keep practising/i }));
    expect(reveal).toHaveBeenCalledOnce();
  });
});
