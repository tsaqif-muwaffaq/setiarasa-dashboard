// Prisma Singleton untuk Environment Serverless (Vercel)
// Mencegah kebocoran koneksi karena setiap request di Vercel bisa membuat instance baru.
// Dengan pattern globalThis, instance PrismaClient di-cache dan di-reuse antar request.

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
