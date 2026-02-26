/**
 * URL-safe slug: lowercase, letters, numbers, hyphens only.
 * Min 3, max 30 characters.
 */
const SLUG_MIN = 3;
const SLUG_MAX = 30;
const SLUG_REGEX = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;

export function sanitizeSlug(raw: string): string {
  const s = raw
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  if (s.length > SLUG_MAX) return s.slice(0, SLUG_MAX);
  return s;
}

export function isValidSlug(slug: string): boolean {
  if (slug.length < SLUG_MIN || slug.length > SLUG_MAX) return false;
  return SLUG_REGEX.test(slug);
}

/** Base slug from first name only (e.g. "Sarabeth Hewa" -> "sarabeth"). */
export function slugFromName(name: string): string {
  const first = name.trim().split(/\s+/)[0] ?? name;
  return sanitizeSlug(first) || sanitizeSlug(name) || 'affiliate';
}

/** Slug from full name hyphenated (e.g. "Sarabeth Hewa" -> "sarabeth-hewa"). */
export function slugFromFullName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const joined = parts.map((p) => p.toLowerCase().replace(/[^a-z0-9]/g, '')).join('-');
  return sanitizeSlug(joined) || 'affiliate';
}

/** Slug from social handle (e.g. "@sarabethewa" -> "sarabethewa"). */
export function slugFromSocialHandle(handle: string): string {
  const s = handle.trim().replace(/^@/, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (s.length < SLUG_MIN) return '';
  return s.slice(0, SLUG_MAX);
}

export type PrismaLike = {
  affiliate: { findUnique: (args: { where: { slug: string } }) => Promise<{ id: string } | null> };
};

/** Generate a unique slug: try base, then base2, base3, ... */
export async function generateUniqueSlug(
  prisma: PrismaLike,
  base: string,
  excludeAffiliateId?: string
): Promise<string> {
  let candidate = sanitizeSlug(base);
  if (candidate.length < SLUG_MIN) candidate = 'affiliate';
  candidate = candidate.slice(0, SLUG_MAX);

  let n = 0;
  while (true) {
    const slug = n === 0 ? candidate : `${candidate}${n}`;
    if (slug.length > SLUG_MAX) {
      n++;
      continue;
    }
    const existing = await prisma.affiliate.findUnique({ where: { slug } });
    if (!existing || (excludeAffiliateId && existing.id === excludeAffiliateId)) return slug;
    n++;
  }
}
