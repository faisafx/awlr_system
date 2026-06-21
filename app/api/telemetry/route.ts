// ─────────────────────────────────────────────────────────────────────────────
// File: app/api/telemetry/route.ts
// Description: API Production Handler untuk Telemetri AWLR DAS Wanggu (Relational DB)
// Method: POST
// ─────────────────────────────────────────────────────────────────────────────
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// SKEMA VALIDASI ZOD (Wide Table sesuai payload ESP32)
const telemetrySchema = z.object({
  nodeId: z.string().min(1).default('WGG-01'),
  ewsStatus: z.enum(['AMAN', 'WASPADA', 'SIAGA', 'AWAS']).default('AMAN'),
  tmaUltrasonic: z.number().optional(),
  tmaHydrostatic: z.number().optional(),
  curahHujan: z.number().optional(),
  flowRate1: z.number().optional(),
  flowRate2: z.number().optional(),
  velocity: z.number().optional(),
  discharge: z.number().optional(),
});

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (process.env.WEBHOOK_SECRET && authHeader !== `Bearer ${process.env.WEBHOOK_SECRET}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = telemetrySchema.safeParse(body);
    
    if (!validation.success) {
      console.warn('[VALIDATION ERROR] Payload Ditolak:', validation.error.flatten().fieldErrors);
      return NextResponse.json({ success: false, error: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const validData = validation.data;

    // DATABASE INSERT (Langsung masukkan semua nilai Wide Table)
    const newLog = await prisma.telemetryLog.create({
      data: {
        nodeId: validData.nodeId,
        ewsStatus: validData.ewsStatus as any,
        tmaUltrasonic: validData.tmaUltrasonic,
        tmaHydrostatic: validData.tmaHydrostatic,
        curahHujan: validData.curahHujan,
        flowRate1: validData.flowRate1,
        flowRate2: validData.flowRate2,
        velocity: validData.velocity,
        discharge: validData.discharge,
      },
      select: { id: true }
    });

    return NextResponse.json({ success: true, insertedId: newLog.id }, { status: 201 });

  } catch (error: any) {
    if (error.code === 'P2003') {
      return NextResponse.json({ success: false, error: 'Unregistered Station Node ID' }, { status: 400 });
    }
    console.error('[DATABASE CRITICAL ERROR]', error.message);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}