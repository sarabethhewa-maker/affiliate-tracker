// Import from the project's generated client (see prisma/schema.prisma output path)
// so Turbopack/workspace always uses this schema, including Affiliate.payouts.
import { PrismaClient } from '../generated/prisma';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: ['query'] });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
