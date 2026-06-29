import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Sesuaikan path ini dengan export prisma client Anda

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { discharge, rainRate } = body;

    // Fetch 14 hari terakhir (14 data terbaru dari TelemetryLog)
    // Dalam kasus nyata jika data harian, kita ambil 14 data harian. Di sini kita ambil 14 log terakhir.
    const dbLogs = await prisma.telemetryLog.findMany({
      take: 14,
      orderBy: { timestamp: 'desc' },
      where: { nodeId: 'WGG-01' } // Atur sesuai nodeId stasiun
    });

    // Pastikan berurutan dari yang terlama ke terbaru (secara kronologis)
    const sortedLogs = dbLogs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    const history = [];
    // Jika database kosong, buat array default
    if (sortedLogs.length === 0) {
      for (let i = 0; i < 14; i++) history.push([0, 0]);
    } else {
      for (const log of sortedLogs) {
        // Karakteristik dataset debit air sungai (Q) menggunakan rumus HYMOS 2016-2020: Q = 4.8 * (H + 0.05)^1.9
        // Agar pembacaan flowmeter sesuai dengan dataset dan AI tidak "ngaco", 
        // kita ambil data flowmeter (discharge), tapi jika flowmeter mati/null, kita fallback ke rumus teoritis menggunakan tmaUltrasonic
        let realDebit = log.discharge;
        if (realDebit === null || realDebit === undefined) {
           const H = log.tmaUltrasonic || 0;
           realDebit = 4.8 * Math.pow((H + 0.05), 1.9); // Fallback cerdas agar dataset konsisten
        }
        
        const realHujan = log.curahHujan || 0;
        history.push([realDebit, realHujan]);
      }
      
      // Jika data kurang dari 14, pad dengan data terakhir agar bentuk array LSTM pas
      while (history.length < 14) {
        history.unshift(history[0]); 
      }
    }

    // Panggil server Python FastAPI
    // Gunakan environment variable AI_SERVER_URL di Vercel (misal: https://ai-server.onrender.com)
    // Jika tidak ada, fallback ke localhost untuk pengembangan lokal
    const pyServer = process.env.AI_SERVER_URL || 'http://127.0.0.1:5000';
    
    const pyResponse = await fetch(`${pyServer}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ history_14_days: history })
    });

    if (!pyResponse.ok) {
      throw new Error('Gagal menghubungi Python AI Server');
    }

    const aiData = await pyResponse.json();
    
    return NextResponse.json({
      success: true,
      prediction: aiData.prediksi_debit_air,
      status: aiData.status_peringatan
    });

  } catch (error: any) {
    console.error("AI Proxy Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || 'Terjadi kesalahan internal AI' },
      { status: 500 }
    );
  }
}
