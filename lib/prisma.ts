// ─────────────────────────────────────────────────────────────────────────────
// File: lib/prisma.ts
// Description: Global Prisma Client Instance (Optimasi Memori & Logging)
// ─────────────────────────────────────────────────────────────────────────────
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Aktifkan log query HANYA di environment development untuk debugging performa
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;