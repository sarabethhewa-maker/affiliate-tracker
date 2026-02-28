/**
 * Shared client-safe parser for historical stats stored in the `notes` field.
 * Duplicated logic previously existed in dashboard/page.tsx and portal/dashboard/page.tsx.
 */
export function parseHistoricalStats(notes: string | null): {
  grossConversions: number;
  approvedConversions: number;
  rejectedConversions: number;
  pendingConversions: number;
  revenue: number;
  payout: number;
} | null {
  if (!notes || !notes.includes("CSV Stats Update")) return null;
  const gross = notes.match(/Gross Conversions: (\d+)/);
  const approved = notes.match(/Approved: (\d+)/);
  const rejected = notes.match(/Rejected: (\d+)/);
  const pending = notes.match(/Pending: (\d+)/);
  const revenue = notes.match(/Revenue: \$([0-9,.]+)/);
  const payout = notes.match(/Payout: \$([0-9,.]+)/);
  return {
    grossConversions: gross ? parseInt(gross[1], 10) : 0,
    approvedConversions: approved ? parseInt(approved[1], 10) : 0,
    rejectedConversions: rejected ? parseInt(rejected[1], 10) : 0,
    pendingConversions: pending ? parseInt(pending[1], 10) : 0,
    revenue: revenue ? parseFloat(revenue[1].replace(/,/g, "")) : 0,
    payout: payout ? parseFloat(payout[1].replace(/,/g, "")) : 0,
  };
}
