/**
 * Normalize @handle or full URL to canonical URL for storage.
 * Display helpers extract @handle or domain for compact display.
 */

function trim(s: string): string {
  return s.trim();
}
function hasProtocol(s: string): boolean {
  return /^https?:\/\//i.test(s);
}

export function normalizeInstagram(input: string): string | null {
  const s = trim(input);
  if (!s || /^[\s\-_]+$/.test(s)) return null;
  if (hasProtocol(s)) {
    const match = s.match(/instagram\.com\/([^/?]+)/i);
    return match ? `https://instagram.com/${match[1]}` : s;
  }
  const handle = s.replace(/^@/, "").replace(/[^a-zA-Z0-9._]/g, "");
  return handle ? `https://instagram.com/${handle}` : null;
}

export function normalizeTiktok(input: string): string | null {
  const s = trim(input);
  if (!s || /^[\s\-_]+$/.test(s)) return null;
  if (hasProtocol(s)) {
    const match = s.match(/tiktok\.com\/@?([^/?]+)/i);
    return match ? `https://tiktok.com/@${match[1]}` : s;
  }
  const handle = s.replace(/^@/, "").replace(/[^a-zA-Z0-9._]/g, "");
  return handle ? `https://tiktok.com/@${handle}` : null;
}

export function normalizeYoutube(input: string): string | null {
  const s = trim(input);
  if (!s || /^[\s\-_]+$/.test(s)) return null;
  if (hasProtocol(s)) {
    const url = s.toLowerCase().startsWith("http") ? s : `https://${s}`;
    return url;
  }
  const handle = s.replace(/^@/, "").replace(/[^a-zA-Z0-9._-]/g, "");
  return handle ? `https://youtube.com/@${handle}` : null;
}

export function normalizeWebsite(input: string): string | null {
  const s = trim(input);
  if (!s || /^[\s\-_]+$/.test(s)) return null;
  if (hasProtocol(s)) return s;
  const clean = s.replace(/^https?:\/\//i, "").split("/")[0] || "";
  return clean ? `https://${clean}` : null;
}

export function displayInstagram(url: string | null | undefined): string {
  if (!url) return "";
  const match = url.match(/instagram\.com\/([^/?]+)/i);
  return match ? `@${match[1]}` : url;
}

export function displayTiktok(url: string | null | undefined): string {
  if (!url) return "";
  const match = url.match(/tiktok\.com\/@?([^/?]+)/i);
  return match ? `@${match[1]}` : url;
}

export function displayYoutube(url: string | null | undefined): string {
  if (!url) return "";
  const match = url.match(/youtube\.com\/@?([^/?]+)/i) || url.match(/youtube\.com\/channel\/([^/?]+)/i);
  return match ? `@${match[1]}` : url;
}

export function displayWebsite(url: string | null | undefined): string {
  if (!url) return "";
  try {
    const u = url.startsWith("http") ? url : `https://${url}`;
    const host = new URL(u).hostname.replace(/^www\./, "");
    return host || url;
  } catch {
    return url;
  }
}
