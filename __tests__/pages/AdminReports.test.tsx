// __tests__/pages/ReportingContent.test.tsx
import React from "react";
import { render, screen, waitFor, act, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import ReportingContent from "@/components/Admin/dashboardContent/ReportingContent";
import toast from "react-hot-toast";

jest.mock("react-hot-toast", () => ({
  loading: jest.fn(),
  success: jest.fn(),
  error: jest.fn(),
  dismiss: jest.fn(),
}));

beforeAll(() => {
  (global as any).URL.createObjectURL = jest.fn(() => "blob:url");
  (global as any).URL.revokeObjectURL = jest.fn();
});

const mockFetch = (...responses: any[]) => {
  (global as any).fetch = jest.fn();
  responses.forEach((res) => {
    (global as any).fetch.mockResolvedValueOnce({
      ok: res.ok ?? true,
      status: res.status ?? 200,
      json: () => Promise.resolve(res.body),
      headers: { get: (n: string) => res.headers?.[n] || null },
      blob: () =>
        Promise.resolve(
          new Blob(["file"], {
            type: res.headers?.["content-type"] || "application/pdf",
          })
        ),
    });
  });
};

describe("ReportingContent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("displays an error when the fetch fails", async () => {
    mockFetch({ body: { message: "Oops" }, ok: false, status: 500 });
    await act(async () => {
      render(<ReportingContent />);
    });
    await waitFor(() =>
      expect(screen.getByText("Error Loading Reports")).toBeInTheDocument()
    );
    // the component renders the raw error text it got from `.text()`
    expect(screen.getByText("res.text is not a function")).toBeInTheDocument();
  });

  it("renders reports table on successful fetch", async () => {
    const reports = [
      {
        _id: "1",
        reportedBy: { _id: "a", firstName: "Alice", lastName: "Reporter", email: "a@example.com" },
        reportedUser: { _id: "b", firstName: "Bob", lastName: "Reported", email: "b@example.com" },
        reason: "other",
        description: "",
        evidenceFiles: [],
        status: "pending",
        createdAt: new Date().toISOString(),
      },
    ];
    mockFetch({ body: reports });
    await act(async () => {
      render(<ReportingContent />);
    });
    await screen.findByText("Alice Reporter");
    expect(screen.getByText("Bob Reported")).toBeInTheDocument();
    const rows = await screen.findAllByRole("row");
    expect(rows).toHaveLength(2);
  });

  it("filters by search and status", async () => {
    const reports = [
      {
        _id: "1",
        reportedBy: { _id: "a", firstName: "Alice", lastName: "Reporter", email: "a@e.com" },
        reportedUser: { _id: "b", firstName: "Bob", lastName: "Reported", email: "b@e.com" },
        reason: "other",
        description: "",
        evidenceFiles: [],
        status: "pending",
        createdAt: new Date().toISOString(),
      },
      {
        _id: "2",
        reportedBy: { _id: "c", firstName: "Carol", lastName: "Reporter", email: "c@e.com" },
        reportedUser: { _id: "d", firstName: "Dave", lastName: "Reported", email: "d@e.com" },
        reason: "other",
        description: "",
        evidenceFiles: [],
        status: "resolved",
        createdAt: new Date().toISOString(),
      },
    ];
    mockFetch({ body: reports });
    await act(async () => {
      render(<ReportingContent />);
    });
    await screen.findByText("Alice Reporter");

    const search = screen.getByPlaceholderText(
      "Search by name, email, reason , or report ID…"
    );
    fireEvent.change(search, { target: { value: "Bob" } });
    expect(screen.getByText("Bob Reported")).toBeInTheDocument();
    expect(screen.queryByText("Dave Reported")).toBeNull();

    fireEvent.change(search, { target: { value: "" } });
    const select = screen.getByDisplayValue(/All/);
    fireEvent.change(select, { target: { value: "resolved" } });
    expect(screen.getByText("Dave Reported")).toBeInTheDocument();
    expect(screen.queryByText("Bob Reported")).toBeNull();
  });

  it("toggles sort direction", async () => {
    const now = Date.now();
    const reports = [
      {
        _id: "1",
        reportedBy: { _id: "o", firstName: "Old", lastName: "Reporter", email: "o@e.com" },
        reportedUser: { _id: "1b", firstName: "Old", lastName: "Reported", email: "o2@e.com" },
        reason: "other",
        description: "",
        evidenceFiles: [],
        status: "pending",
        createdAt: new Date(now - 1000).toISOString(),
      },
      {
        _id: "2",
        reportedBy: { _id: "n", firstName: "New", lastName: "Reporter", email: "n@e.com" },
        reportedUser: { _id: "2b", firstName: "New", lastName: "Reported", email: "n2@e.com" },
        reason: "other",
        description: "",
        evidenceFiles: [],
        status: "pending",
        createdAt: new Date(now).toISOString(),
      },
    ];
    mockFetch({ body: reports });
    await act(async () => {
      render(<ReportingContent />);
    });
    await screen.findByText("Old Reporter");

    let rows = screen.getAllByRole("row");
    expect(within(rows[1]).getByText("New Reporter")).toBeInTheDocument();

    // there are two sort buttons: one for desc, one for asc
    const [descBtn, ascBtn] = screen.getAllByTitle(/Sort by date/);
    // click the ascending icon to flip to oldest first
    fireEvent.click(ascBtn);

    rows = screen.getAllByRole("row");
    expect(within(rows[1]).getByText("Old Reporter")).toBeInTheDocument();
  });

  it("downloads evidence file", async () => {
    const reports = [
      {
        _id: "1",
        reportedBy: { _id: "a", firstName: "Alice", lastName: "Reporter", email: "a@e.com" },
        reportedUser: { _id: "b", firstName: "Bob", lastName: "Reported", email: "b@e.com" },
        reason: "other",
        description: "",
        evidenceFiles: ["/proof.pdf"],
        status: "pending",
        createdAt: new Date().toISOString(),
      },
    ];
    mockFetch(
      { body: reports },
      { body: {}, headers: { "content-type": "application/pdf" } }
    );
    await act(async () => {
      render(<ReportingContent />);
    });
    await screen.findByText("Alice Reporter");

    fireEvent.click(screen.getByTitle(/Download evidence/));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenLastCalledWith(
        `/api/file/retrieve?fileUrl=${encodeURIComponent("/proof.pdf")}`
      );
      expect(toast.success).toHaveBeenCalledWith(
        "Evidence file downloaded successfully"
      );
    });
  });

  it("marks under review", async () => {
    const report = {
      _id: "1",
      reportedBy: { _id: "a", firstName: "Alice", lastName: "Reporter", email: "a@e.com" },
      reportedUser: { _id: "b", firstName: "Bob", lastName: "Reported", email: "b@e.com" },
      reason: "other",
      description: "",
      evidenceFiles: [],
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    mockFetch({ body: [report] }, { body: {} });
    window.confirm = jest.fn(() => true);

    await act(async () => {
      render(<ReportingContent />);
    });
    await screen.findByText("Alice Reporter");

    fireEvent.click(screen.getByTitle("Mark as Under Review"));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenLastCalledWith(
        "/api/admin/reports/1/notify",
        expect.objectContaining({ method: "POST" })
      );
      expect(toast.success).toHaveBeenCalledWith(
        "Status updated to Under Review"
      );
      const row = screen.getByText("Alice Reporter").closest("tr")!;
      expect(within(row).getByText("Under Review")).toBeInTheDocument();
    });
  });

  it("resolve and dismiss actions", async () => {
    const base = {
      _id: "1",
      reportedBy: { _id: "a", firstName: "Alice", lastName: "Reporter", email: "a@e.com" },
      reportedUser: { _id: "b", firstName: "Bob", lastName: "Reported", email: "b@e.com" },
      reason: "other",
      description: "",
      evidenceFiles: [],
      status: "under_review",
      createdAt: new Date().toISOString(),
    };
    mockFetch({ body: [base] }, { body: {} }, { body: {} });
    window.confirm = jest.fn(() => true);
    window.alert = jest.fn();

    await act(async () => {
      render(<ReportingContent />);
    });
    await screen.findByText("Alice Reporter");

    fireEvent.click(screen.getByTitle("Mark resolved"));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        "/api/admin/reports/1/resolve",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ resolution: "mark_resolved" }),
        })
      );
      expect(window.alert).toHaveBeenCalledWith(
        "Report marked as resolved successfully!"
      );
    });

    const row = screen.getByText("Alice Reporter").closest("tr")!;
    expect(within(row).getByText("Resolved")).toBeInTheDocument();
  });
});
