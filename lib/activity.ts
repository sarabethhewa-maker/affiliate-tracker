import { prisma } from '@/lib/prisma';

export type ActivityType = 'conversion' | 'affiliate_approved' | 'tier_upgrade' | 'payout';

export async function logActivity(params: {
  type: ActivityType;
  message: string;
  affiliateId?: string | null;
}): Promise<void> {
  await prisma.activityLog.create({
    data: {
      type: params.type,
      message: params.message,
      affiliateId: params.affiliateId ?? null,
    },
  });
}
