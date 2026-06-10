// ─────────────────────────────────────────────────────────────────────────────
// File: app/api/telemetry/route.ts
// Description: API Production Handler untuk Telemetri AWLR DAS Wanggu (Relational DB)
// Method: POST
// ─────────────────────────────────────────────────────────────────────────────
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// 1. FORCE DYNAMIC: Sangat krusial! Mencegah Next.js meng-cache route ini. 
// Data telemetri IoT harus selalu real-time.
export const dynamic = 'force-dynamic';

// 2. SKEMA VALIDASI ZOD (Disesuaikan dengan Postgres Enum)
const telemetrySchema = z.object({
  nodeId: z.string().min(1, 'nodeId tidak boleh kosong'),
  parameter: z.string().min(1, 'parameter tidak boleh kosong'),
  // Transformasi otomatis: Jika string "12.5", ubah ke float 12.5. Tolak jika NaN.
  rawValue: z.union([z.string(), z.number()]).transform((val) => {
    const parsed = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(parsed)) throw new Error('rawValue gagal di-parsing menjadi angka');
    return parsed;
  }),
  unit: z.string().default('-'),
  // MENGGUNAKAN ENUM: Harus persis sesuai dengan tipe WaterStatus di schema.prisma
  status: z.enum(['AMAN', 'WASPADA', 'SIAGA', 'AWAS']).default('AMAN'),
});

export async function POST(request: Request) {
  try {
    // 3. SECURITY: Autentikasi Webhook (Opsional tapi WAJIB di Produksi)
    const authHeader = request.headers.get('authorization');
    if (process.env.WEBHOOK_SECRET && authHeader !== `Bearer ${process.env.WEBHOOK_SECRET}`) {
      console.warn('[SECURITY WARNING] Akses Webhook Ditolak: Token Tidak Valid');
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // 4. VALIDASI CEPAT: Gunakan safeParse agar server tidak crash jika data salah
    const validation = telemetrySchema.safeParse(body);
    
    if (!validation.success) {
      console.warn('[VALIDATION ERROR] Payload Ditolak:', validation.error.flatten().fieldErrors);
      return NextResponse.json(
        { success: false, error: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const validData = validation.data;

    // 5. DATABASE INSERT DENGAN OPTIMASI SELECT & RELASI
    const newLog = await prisma.telemetryLog.create({
      data: {
        nodeId: validData.nodeId,     // Pastikan ID ini sudah ada di tabel StationNode
        parameter: validData.parameter,
        rawValue: validData.rawValue,
        unit: validData.unit,
        // TypeScript akan menganggap validData.status sesuai dengan Enum WaterStatus
        status: validData.status as any, 
      },
      // OPTIMASI NETWORK: Cukup kembalikan ID saja agar respons API sangat ringan.
      select: {
        id: true, 
      }
    });

    return NextResponse.json({ success: true, insertedId: newLog.id }, { status: 201 });

  } catch (error: any) {
    // 6. PROTEKSI FOREIGN KEY (P2003): Menangani kasus jika nodeId dari ESP32 belum terdaftar
    if (error.code === 'P2003') {
      console.error('[DATABASE ERROR] nodeId tidak ditemukan di master StationNode. Payload ditolak.');
      return NextResponse.json(
        { success: false, error: 'Unregistered Station Node ID (Foreign Key Constraint)' },
        { status: 400 }
      );
    }

    console.error('[DATABASE CRITICAL ERROR] Gagal menyimpan telemetri:', error.message);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}