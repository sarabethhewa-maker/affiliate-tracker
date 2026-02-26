import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const err = await requireAdmin();
  if (err) return err;
  const slug = req.nextUrl.searchParams.get('slug')?.trim();
  if (!slug) {
    return NextResponse.json({ ok: false, error: 'Slug required' }, { status: 400 });
  }
  const affiliate =
    (await prisma.affiliate.findUnique({ where: { id: slug }, select: { id: true, name: true, slug: true } })) ??
    (await prisma.affiliate.findUnique({ where: { slug }, select: { id: true, name: true, slug: true } }));
  if (!affiliate) {
    return NextResponse.json({ ok: false, error: 'Affiliate not found' });
  }
  return NextResponse.json({
    ok: true,
    affiliate: { id: affiliate.id, name: affiliate.name, slug: affiliate.slug },
    message: `Affiliate "${affiliate.name}" would be attributed. Use ref="${affiliate.slug ?? affiliate.id}" in links or order meta _bll_affiliate_ref.`,
  });
}
