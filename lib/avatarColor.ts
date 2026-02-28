/** Palette of soft/muted avatar colors for non-Master affiliates. */
const AVATAR_PALETTE = [
  { bg: "#d4e6dc", text: "#2d5a3e" },  // sage green
  { bg: "#f0d4d8", text: "#7a2e3a" },  // dusty rose
  { bg: "#fde0c8", text: "#7a4420" },  // warm orange
  { bg: "#d4dff0", text: "#2e4470" },  // slate blue
  { bg: "#e4d8f0", text: "#4a2e7a" },  // lavender
  { bg: "#c8e8e4", text: "#1e5a52" },  // teal
  { bg: "#f8d0c8", text: "#8a3a2e" },  // coral
  { bg: "#f6e8c4", text: "#7a5a1e" },  // amber
  { bg: "#d8e4c8", text: "#3e5a2e" },  // moss
  { bg: "#e0d4e8", text: "#5a3a6e" },  // mauve
  { bg: "#c8dce8", text: "#2a4a5e" },  // steel blue
  { bg: "#f0dcc8", text: "#6a4a2e" },  // warm taupe
];

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = ((h << 5) - h + name.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Returns avatar bg, text, and border colors for an affiliate.
 * Master tier (highest tier) always gets gold/amber.
 * Silver/Gold affiliates get a consistent color based on name hash.
 */
export function getAvatarColor(
  name: string,
  tierKey: string,
  tierCount: number
): { bg: string; text: string; border: string } {
  const masterKey = String(Math.max(0, tierCount - 1));
  if (tierKey === masterKey && tierCount > 1) {
    return { bg: "#fef3c7", text: "#b45309", border: "#b4530950" };
  }
  const c = AVATAR_PALETTE[hashName(name) % AVATAR_PALETTE.length];
  return { bg: c.bg, text: c.text, border: `${c.text}50` };
}
