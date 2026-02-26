import { prisma } from '@/lib/prisma';

const CLICKS_PER_HOUR_THRESHOLD = 50;
const CLICKS_PER_IP_24H_THRESHOLD = 10;

/** Check for anomaly after a click. Creates Alert if threshold exceeded. Returns the created alert or null. */
export async function checkClickAnomaly(affiliateId: string, ip: string): Promise<{ id: string; type: string; message: string } | null> {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [affiliateClicksLastHour, ipClicksLast24h] = await Promise.all([
    prisma.click.count({
      where: {
        affiliateId,
        createdAt: { gte: oneHourAgo },
      },
    }),
    ip
      ? prisma.click.count({
          where: {
            ip: ip.trim(),
            createdAt: { gte: oneDayAgo },
          },
        })
      : 0,
  ]);

  const affiliate = await prisma.affiliate.findUnique({ where: { id: affiliateId }, select: { name: true } });
  const name = affiliate?.name ?? 'Unknown';

  if (affiliateClicksLastHour > CLICKS_PER_HOUR_THRESHOLD) {
    const existing = await prisma.alert.findFirst({
      where: {
        affiliateId,
        type: 'click_spike',
        dismissed: false,
        createdAt: { gte: oneHourAgo },
      },
    });
    if (!existing) {
      const alert = await prisma.alert.create({
        data: {
          affiliateId,
          type: 'click_spike',
          message: `${name} had ${affiliateClicksLastHour} clicks in the last hour (threshold: ${CLICKS_PER_HOUR_THRESHOLD})`,
        },
      });
      return { id: alert.id, type: alert.type, message: alert.message };
    }
  }

  if (ip && ipClicksLast24h > CLICKS_PER_IP_24H_THRESHOLD) {
    const existing = await prisma.alert.findFirst({
      where: {
        affiliateId,
        type: 'ip_abuse',
        dismissed: false,
        createdAt: { gte: oneDayAgo },
      },
    });
    if (!existing) {
      const alert = await prisma.alert.create({
        data: {
          affiliateId,
          type: 'ip_abuse',
          message: `IP ${ip} has ${ipClicksLast24h} clicks in 24h (affiliate: ${name}). Possible abuse.`,
        },
      });
      return { id: alert.id, type: alert.type, message: alert.message };
    }
  }

  return null;
}
