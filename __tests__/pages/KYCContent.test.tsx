/**
 * KYCContent Component Tests
 */
import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import { act } from "react-dom/test-utils";
import "@testing-library/jest-dom";
import KYCContent from "@/components/Admin/dashboardContent/KYCContent";
import toast from "react-hot-toast";

jest.mock("react-hot-toast", () => ({
  loading: jest.fn(),
  success: jest.fn(),
  error: jest.fn(),
  dismiss: jest.fn(),
}));

beforeAll(() => {
  global.URL.createObjectURL = jest.fn(() => "blob:url");
  global.URL.revokeObjectURL = jest.fn();
});

const mockFetch = (
  response: any,
  ok = true,
  headers: Record<string, string> = {}
) => {
  (global as any).fetch = jest.fn().mockResolvedValue({
    ok,
    json: () => Promise.resolve(response),
    headers: { get: (name: string) => headers[name] || null },
    blob: () =>
      Promise.resolve(
        new Blob(["file-contents"], {
          type: headers["content-type"] || "application/pdf",
        })
      ),
  });
};

describe("KYCContent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders records in table after fetch", async () => {
    const records = [
      {
        _id: "1",
        nic: "1234",
        recipient: "Alice",
        dateSubmitted: new Date().toISOString(),
        status: "Not Reviewed",
        nicUrl: "/nic.pdf",
        nicWithPersonUrl: "/nic-person.jpg",
      },
      {
        _id: "2",
        nic: "5678",
        recipient: "Bob",
        dateSubmitted: new Date().toISOString(),
        status: "Accepted",
      },
    ];
    mockFetch({ data: records });
    await act(async () => {
      render(<KYCContent />);
    });
    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("Bob")).toBeInTheDocument();
    });

    const rows = screen.getAllByRole("row");
    const dataRows = rows.slice(1);
    expect(dataRows).toHaveLength(2);
    expect(
      within(dataRows[0]).getByText("Not Reviewed")
    ).toBeInTheDocument();
    expect(within(dataRows[1]).getByText("Accepted")).toBeInTheDocument();
  });

  it("validates search input and filters results", async () => {
    const records = [
      {
        _id: "1",
        nic: "ABC123",
        recipient: "Charlie",
        dateSubmitted: new Date().toISOString(),
        status: "Not Reviewed",
      },
    ];
    mockFetch({ data: records });
    await act(async () => {
      render(<KYCContent />);
    });
    await waitFor(() => screen.getByText("Charlie"));

    const input = screen.getByPlaceholderText(
      "Search by recipient name"
    );
    fireEvent.change(input, { target: { value: "bad!" } });
    expect(toast.error).toHaveBeenCalledWith(
      "Only letters, numbers, and spaces are allowed"
    );

    fireEvent.change(input, { target: { value: "Charlie" } });
    expect(screen.getByText("Charlie")).toBeInTheDocument();
  });

  it("filters by status dropdown", async () => {
    const records = [
      {
        _id: "1",
        nic: "1",
        recipient: "A",
        dateSubmitted: new Date().toISOString(),
        status: "Accepted",
      },
      {
        _id: "2",
        nic: "2",
        recipient: "B",
        dateSubmitted: new Date().toISOString(),
        status: "Rejected",
      },
    ];
    mockFetch({ data: records });
    await act(async () => {
      render(<KYCContent />);
    });
    await waitFor(() => screen.getByText("A"));

    const statusSelect = screen.getByDisplayValue("All");
    fireEvent.change(statusSelect, { target: { value: "Accepted" } });
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.queryByText("B")).toBeNull();
  });

  it("toggles sort direction", async () => {
    const now = Date.now();
    const records = [
      {
        _id: "1",
        nic: "1",
        recipient: "Old",
        dateSubmitted: new Date(now - 1000).toISOString(),
        status: "Not Reviewed",
      },
      {
        _id: "2",
        nic: "2",
        recipient: "New",
        dateSubmitted: new Date(now).toISOString(),
        status: "Not Reviewed",
      },
    ];
    mockFetch({ data: records });
    await act(async () => {
      render(<KYCContent />);
    });
    await waitFor(() => screen.getByText("Old"));

    const rowsDesc = screen.getAllByRole("row");
    expect(rowsDesc[1]).toHaveTextContent("New");

    fireEvent.click(screen.getByTitle("Showing newest first"));
    const rowsAsc = screen.getAllByRole("row");
    expect(rowsAsc[1]).toHaveTextContent("Old");
  });

  it("downloads NIC file when button clicked", async () => {
    const records = [
      {
        _id: "1",
        nic: "9999",
        recipient: "DownloadTest",
        dateSubmitted: new Date().toISOString(),
        status: "Not Reviewed",
        nicUrl: "/api.pdf",
      },
    ];
    mockFetch({ data: records });
    await act(async () => {
      render(<KYCContent />);
    });
    await waitFor(() => screen.getByText("DownloadTest"));

    fireEvent.click(screen.getByTitle(/Download NIC document/));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/file/retrieve?fileUrl=${encodeURIComponent("/api.pdf")}`
      );
      expect(toast.loading).toHaveBeenCalledWith("Downloading file...");
      expect(toast.success).toHaveBeenCalledWith(
        "File downloaded successfully"
      );
    });
  });

  it("updates status on Accept click", async () => {
    const rec = {
      _id: "42",
      nic: "42",
      recipient: "StatusTest",
      dateSubmitted: new Date().toISOString(),
      status: "Not Reviewed",
    };
    (global as any).fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [rec] }),
      })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });

    await act(async () => {
      render(<KYCContent />);
    });
    await waitFor(() => screen.getByText("StatusTest"));

    fireEvent.click(screen.getByLabelText(/Approve KYC verification/));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenLastCalledWith(
        "/api/kyc/update",
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify({ id: "42", status: "Accepted" }),
        })
      );
      expect(toast.success).toHaveBeenCalledWith(
        "Status updated to Accepted"
      );
    });

    const row = screen.getByText("StatusTest").closest("tr")!;
    expect(within(row).getByText("Accepted")).toBeInTheDocument();
  });

  it("paginates correctly", async () => {
    const many = Array.from({ length: 15 }, (_, i) => ({
      _id: `${i}`,
      nic: `${i}`,
      recipient: `User${i}`,
      dateSubmitted: new Date().toISOString(),
      status: "Not Reviewed",
    }));
    mockFetch({ data: many });
    await act(async () => {
      render(<KYCContent />);
    });
    await waitFor(() => screen.getByText("User0"));

    expect(screen.queryByText("User10")).toBeNull();
    fireEvent.click(screen.getByLabelText("Go to next page"));
    expect(await screen.findByText("User10")).toBeInTheDocument();
  });
});
