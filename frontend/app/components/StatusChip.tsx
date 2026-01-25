"use client";

const STATUS_COLORS: Record<string, string> = {
  draft: "chip-yellow",
  sent: "chip-blue",
  approved: "chip-green",
  rejected: "chip-red",
  scheduled: "chip-blue",
  in_progress: "chip-yellow",
  completed: "chip-green",
  blocked: "chip-red",
  canceled: "chip-gray",
  unpaid: "chip-red",
  partial: "chip-yellow",
  paid: "chip-green",
  available: "chip-green",
  in_use: "chip-blue",
  maintenance: "chip-red",
  new: "chip-blue",
  contacted: "chip-yellow",
  qualified: "chip-green",
  lost: "chip-gray",
};

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}

export default function StatusChip({ status }: { status: string }) {
  const colorClass = STATUS_COLORS[status] || "chip-gray";
  return <span className={`chip ${colorClass}`}>{formatStatus(status)}</span>;
}
