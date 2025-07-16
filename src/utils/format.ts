// src/utils/format.ts

export function formatName(firstName?: string, lastName?: string): string {
  if (!firstName && !lastName) return "(Unknown)";
  return [firstName, lastName].filter(Boolean).join(" ");
}

export function formatStatus(status?: string): string {
  if (!status) return "Unknown";
  switch (status) {
    case "pending": return "Pending";
    case "under_review": return "Under Review";
    case "resolved": return "Resolved";
    default: return status[0].toUpperCase() + status.slice(1);
  }
}

export function formatDate(date?: string): string {
  if (!date) return "";
  return new Date(date).toLocaleString();
}

export function formatReason(reason?: string): string {
  if (!reason) return "N/A";
  return reason[0].toUpperCase() + reason.slice(1);
}
