import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const affiliateId = (await params).id;

  try {
    await prisma.click.create({
      data: {
        affiliateId,
        ip: req.headers.get('x-forwarded-for') ?? '',
        userAgent: req.headers.get('user-agent') ?? '',
      },
    });
  } catch {
    // affiliate not found, still redirect
  }

  return NextResponse.redirect('https://biolongevitylabs.com');
}
