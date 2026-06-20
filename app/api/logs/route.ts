// ─────────────────────────────────────────────────────────────────────────────
// File: app/api/logs/route.ts
// Description: Endpoint GET - Wide Table Pattern dengan Downsampling Presisi
// ─────────────────────────────────────────────────────────────────────────────
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Sesuaikan path ini dengan struktur Anda

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');
    const nodeId = searchParams.get('nodeId') || 'WGG-01'; 

    const whereClause: any = {
      nodeId: nodeId,
    };
    
    // PENERAPAN MUTLAK RENTANG WAKTU DATABASE
    if (startDate || endDate) {
      whereClause.timestamp = {};
      if (startDate) whereClause.timestamp.gte = new Date(startDate);
      if (endDate) whereClause.timestamp.lte = new Date(endDate);
    }

    // Ambil data langsung, tidak perlu filter parameter karena sudah Wide Table
    const rawLogs = await prisma.telemetryLog.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
      take: 3000, 
    });

    // Jika database benar-benar kosong di jam tersebut
    if (rawLogs.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const filteredLogs: any[] = [];
    const seenMinutes = new Set();
    const paramFilter = searchParams.get('parameter') || 'all';

    for (const log of rawLogs) {
      const date = new Date(log.timestamp);
      const minuteKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}_${log.nodeId}`;

      if (!seenMinutes.has(minuteKey)) {
        seenMinutes.add(minuteKey);
        
        // Fungsi helper untuk menambahkan row EAV (Narrow Table) sesuai format frontend
        const addRow = (param: string, val: string | number | null | undefined, unit: string) => {
          if (val !== null && val !== undefined) {
            filteredLogs.push({
              timestamp: log.timestamp,
              nodeId: log.nodeId,
              parameter: param,
              rawValue: typeof val === 'number' ? val.toFixed(2) : val,
              unit: unit,
              status: log.ewsStatus
            });
          }
        };

        // Mapping Data dari Wide Table ke Narrow Table berdasarkan filter
        if (paramFilter === 'all' || paramFilter === 'qdy30a') {
          addRow('TMA_HYDRO', log.tmaHydrostatic, 'm');
        }
        if (paramFilter === 'all' || paramFilter === 'a02yyuw') {
          addRow('TMA_ULTRA', log.tmaUltrasonic, 'm');
        }
        if (paramFilter === 'all' || paramFilter === 'ombrometer') {
          addRow('CURAH_HUJAN', log.curahHujan, 'mm');
        }
        if (paramFilter === 'all') {
          addRow('DEBIT', log.discharge, 'm³/s');
          addRow('FLOW_RATE', log.flowRate1, 'L/min');
        }
      }

      // Limit data untuk menjaga kinerja browser
      if (filteredLogs.length >= 1000) break; 
    }

    return NextResponse.json({ success: true, data: filteredLogs });
  } catch (error: any) {
    console.error('[QUERY ERROR] Gagal mengambil data log:', error.message);
    return NextResponse.json({ success: false, error: 'Database Timeout' }, { status: 500 });
  }
}