// __tests__/pages/ReportingContent.test.tsx
import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import ReportingContent from "@/components/Admin/dashboardContent/ReportingContent";

const mockFetch = (response: any, ok = true, status = 500) => {
  (global as any).fetch = jest.fn().mockResolvedValue({
    ok,
    status,
    json: () => Promise.resolve(response),
  });
};

describe("ReportingContent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("displays an error when the fetch fails", async () => {
    mockFetch({ message: "Oops" }, false, 500);
    await act(async () => {
      render(<ReportingContent />);
    });
    await waitFor(() =>
      expect(screen.getByText("Error Loading Reports")).toBeInTheDocument()
    );
    expect(
      screen.getByText("HTTP error! status: 500")
    ).toBeInTheDocument();
  });
});
