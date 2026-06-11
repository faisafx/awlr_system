// ─────────────────────────────────────────────────────────────────────────────
// File: app/api/logs/route.ts
// Description: Endpoint GET untuk mengambil data historis dari Supabase PostgreSQL
// ─────────────────────────────────────────────────────────────────────────────
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const paramFilter = searchParams.get('parameter');
    
    // Siapkan filter untuk query Prisma
    const whereClause: any = {};
    
    // Mapping nilai dropdown UI ke standar parameter database
    if (paramFilter && paramFilter !== 'all') {
      if (paramFilter === 'a02yyuw') whereClause.parameter = 'TMA_ULTRA';
      if (paramFilter === 'ombrometer') whereClause.parameter = 'CURAH_HUJAN';
      if (paramFilter === 'qdy30a') whereClause.parameter = 'TMA_HYDRO';
    }

    // Panggil database Supabase via Prisma (Ambil 500 data terbaru agar browser tidak hang)
    const logs = await prisma.telemetryLog.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
      take: 500, 
    });

    return NextResponse.json({ success: true, data: logs });
  } catch (error: any) {
    console.error('[QUERY ERROR] Gagal mengambil data log:', error.message);
    return NextResponse.json({ success: false, error: 'Database Timeout' }, { status: 500 });
  }
}