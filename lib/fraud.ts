import { prisma } from '@/lib/prisma';

const RAPID_CLICKS_THRESHOLD = 10;
const RAPID_CLICKS_WINDOW_MS = 60 * 60 * 1000;
const HIGH_CLICK_RATIO_MIN_CLICKS = 100;
const DUPLICATE_IP_RATIO = 0.5;

/** After a click is recorded: check rapid-clicks (same IP, same affiliate, >10 in last hour). */
export async function checkFraudOnClick(affiliateId: string, ip: string): Promise<void> {
  if (!ip?.trim()) return;

  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - RAPID_CLICKS_WINDOW_MS);

  const count = await prisma.click.count({
    where: {
      affiliateId,
      ip: ip.trim().slice(0, 255),
      createdAt: { gte: oneHourAgo },
    },
  });

  if (count > RAPID_CLICKS_THRESHOLD) {
    const existing = await prisma.fraudFlag.findFirst({
      where: {
        affiliateId,
        type: 'rapid-clicks',
        resolved: false,
        createdAt: { gte: oneHourAgo },
      },
    });
    if (!existing) {
      await prisma.fraudFlag.create({
        data: {
          affiliateId,
          type: 'rapid-clicks',
          description: `Same IP (${ip.slice(0, 20)}…) generated ${count} clicks in the last hour.`,
          severity: count > 30 ? 'high' : 'medium',
        },
      });
    }
  }
}

/** Periodic scan: high-click-ratio (clicks > 100, 0 sales), duplicate-ip (>50% from one IP). */
export async function runFraudScan(): Promise<{ flagged: number }> {
  const affiliates = await prisma.affiliate.findMany({
    where: { deletedAt: null },
    include: {
      clicks: { select: { ip: true, createdAt: true } },
      conversions: { select: { id: true } },
    },
  });

  let flagged = 0;
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  for (const aff of affiliates) {
    const totalClicks = aff.clicks.length;
    const salesCount = aff.conversions.length;

    if (totalClicks >= HIGH_CLICK_RATIO_MIN_CLICKS && salesCount === 0) {
      const existing = await prisma.fraudFlag.findFirst({
        where: { affiliateId: aff.id, type: 'high-click-ratio', resolved: false },
      });
      if (!existing) {
        await prisma.fraudFlag.create({
          data: {
            affiliateId: aff.id,
            type: 'high-click-ratio',
            description: `${aff.name} has ${totalClicks} clicks and 0 sales.`,
            severity: 'medium',
          },
        });
        flagged++;
      }
    }

    if (totalClicks >= 20) {
      const ipCounts = new Map<string, number>();
      for (const c of aff.clicks) {
        const ip = c.ip?.trim() || 'unknown';
        ipCounts.set(ip, (ipCounts.get(ip) || 0) + 1);
      }
      const maxIpCount = Math.max(...ipCounts.values(), 0);
      if (maxIpCount / totalClicks >= DUPLICATE_IP_RATIO) {
        const existing = await prisma.fraudFlag.findFirst({
          where: { affiliateId: aff.id, type: 'duplicate-ip', resolved: false },
        });
        if (!existing) {
          const pct = Math.round((maxIpCount / totalClicks) * 100);
          await prisma.fraudFlag.create({
            data: {
              affiliateId: aff.id,
              type: 'duplicate-ip',
              description: `${pct}% of ${aff.name}'s clicks (${maxIpCount}/${totalClicks}) come from a single IP.`,
              severity: pct >= 80 ? 'high' : 'medium',
            },
          });
          flagged++;
        }
      }
    }
  }

  return { flagged };
}
