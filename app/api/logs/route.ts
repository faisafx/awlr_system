// ─────────────────────────────────────────────────────────────────────────────
// File: app/api/logs/route.ts
// Description: Endpoint GET dengan Filter Waktu (Start/End) dan Downsampling
// ─────────────────────────────────────────────────────────────────────────────
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const paramFilter = searchParams.get('parameter');
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');
    
    // 1. Siapkan filter query Prisma
    const whereClause: any = {};
    
    if (paramFilter && paramFilter !== 'all') {
      if (paramFilter === 'a02yyuw') whereClause.parameter = 'TMA_ULTRA';
      if (paramFilter === 'ombrometer') whereClause.parameter = 'CURAH_HUJAN';
      if (paramFilter === 'qdy30a') whereClause.parameter = 'TMA_HYDRO';
    }

    // Filter Rentang Waktu (Jika user memilih tanggal)
    if (startDate || endDate) {
      whereClause.timestamp = {};
      if (startDate) whereClause.timestamp.gte = new Date(startDate);
      if (endDate) whereClause.timestamp.lte = new Date(endDate);
    }

    // 2. Ambil data dari database (Max 3000 data untuk di-filter per menit)
    const rawLogs = await prisma.telemetryLog.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
      take: 3000, 
    });

    // 3. ALGORITMA DOWNSAMPLING (1 Data per Menit)
    const filteredLogs = [];
    const seenMinutes = new Set();

    for (const log of rawLogs) {
      const date = new Date(log.timestamp);
      const minuteKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}_${log.parameter}`;

      if (!seenMinutes.has(minuteKey)) {
        seenMinutes.add(minuteKey);
        filteredLogs.push(log);
      }

      if (filteredLogs.length >= 500) break; // Batas aman untuk UI browser
    }

    return NextResponse.json({ success: true, data: filteredLogs });
  } catch (error: any) {
    console.error('[QUERY ERROR] Gagal mengambil data log:', error.message);
    return NextResponse.json({ success: false, error: 'Database Timeout' }, { status: 500 });
  }
}