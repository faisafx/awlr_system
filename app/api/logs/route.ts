// ─────────────────────────────────────────────────────────────────────────────
// File: app/api/logs/route.ts
// Description: Endpoint GET dengan Algoritma Downsampling (1 Data per Menit)
// ─────────────────────────────────────────────────────────────────────────────
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const paramFilter = searchParams.get('parameter');
    
    // 1. Siapkan filter untuk query Prisma
    const whereClause: any = {};
    if (paramFilter && paramFilter !== 'all') {
      if (paramFilter === 'a02yyuw') whereClause.parameter = 'TMA_ULTRA';
      if (paramFilter === 'ombrometer') whereClause.parameter = 'CURAH_HUJAN';
      if (paramFilter === 'qdy30a') whereClause.parameter = 'TMA_HYDRO';
    }

    // 2. Ambil data mentah yang banyak dari database (Max 3000 data terakhir)
    const rawLogs = await prisma.telemetryLog.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
      take: 3000, 
    });

    // 3. ALGORITMA FILTERING: Hanya izinkan 1 data lolos per menit untuk setiap parameter
    const filteredLogs = [];
    const seenMinutes = new Set();

    for (const log of rawLogs) {
      const date = new Date(log.timestamp);
      
      // Buat kunci unik: "Tahun-Bulan-Tanggal Jam:Menit - Parameter"
      // Contoh: "2026-5-11 20:15 - TMA_ULTRA"
      const minuteKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}_${log.parameter}`;

      // Jika kunci menit ini belum pernah kita lihat, masukkan datanya!
      if (!seenMinutes.has(minuteKey)) {
        seenMinutes.add(minuteKey);
        filteredLogs.push(log);
      }

      // Batasi hasil akhir maksimal 500 baris agar browser (UI) tetap ringan dan anti-lag
      if (filteredLogs.length >= 500) break;
    }

    return NextResponse.json({ success: true, data: filteredLogs });
  } catch (error: any) {
    console.error('[QUERY ERROR] Gagal mengambil data log:', error.message);
    return NextResponse.json({ success: false, error: 'Database Timeout' }, { status: 500 });
  }
}