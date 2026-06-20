// ─────────────────────────────────────────────────────────────────────────────
// File: app/api/hardware/route.ts
// Architecture: Next.js 14 App Router
// Description: Endpoint GET Infrastruktur dengan Auto-Seeding Prisma
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Coba tarik data dari database riil
    let assets = await prisma.hardwareAsset.findMany({
      orderBy: { criticality: 'asc' }
    });

    // 2. Jika database kosong (pertama kali deploy), lakukan Auto-Seeding
    if (assets.length === 0) {
      const initialSeedData = [
        {
          assetCode: 'BMN-AWLR-WGG01-001',
          componentName: 'Hydrostatic Pressure Transducer',
          modelNumber: 'QDY30A (0-3.3V Analog)',
          installationDate: new Date('2025-03-12'),
          operatingHours: 10680,
          healthIndex: 82,
          calibrationDueDays: 14,
          technician: 'Faisal Fardani',
          nodeId: 'WGG-01',
          criticality: 'HIGH'
        },
        {
          assetCode: 'BMN-AWLR-WGG01-002',
          componentName: 'Waterproof Ultrasonic Distance',
          modelNumber: 'A02YYUW (Serial UART)',
          installationDate: new Date('2025-03-12'),
          operatingHours: 10680,
          healthIndex: 91,
          calibrationDueDays: 102,
          technician: 'Faisal Fardani',
          nodeId: 'WGG-01',
          criticality: 'HIGH'
        },
        {
          assetCode: 'BMN-AWLR-WGG01-003',
          componentName: 'Tipping Bucket Ombrometer',
          modelNumber: 'RG-3M Stainless Steel Pulse',
          installationDate: new Date('2025-05-05'),
          operatingHours: 9430,
          healthIndex: 74,
          calibrationDueDays: 45,
          technician: 'Munirkhan Genius',
          nodeId: 'WGG-01',
          criticality: 'MEDIUM'
        },
        {
          assetCode: 'BMN-AWLR-WGG01-004',
          componentName: 'Turbine Water Flow Sensor',
          modelNumber: 'DN50 2 Inch (Pulse Output)',
          installationDate: new Date('2026-06-15'),
          operatingHours: 96,
          healthIndex: 100,
          calibrationDueDays: 360,
          technician: 'Faisal Fardani',
          nodeId: 'WGG-01',
          criticality: 'HIGH'
        },
        {
          assetCode: 'BMN-AWLR-CORE-001',
          componentName: 'Main Processing Unit MCU',
          modelNumber: 'ESP32-WROOM-32E Dev Carrier',
          installationDate: new Date('2025-03-12'),
          operatingHours: 10680,
          healthIndex: 98,
          calibrationDueDays: 365,
          technician: 'Faisal Fardani',
          nodeId: 'WGG-01',
          criticality: 'HIGH'
        },
        {
          assetCode: 'BMN-AWLR-COM-001',
          componentName: 'Long Range Transceiver',
          modelNumber: 'LoRa SPI SX1276 915MHz',
          installationDate: new Date('2025-03-12'),
          operatingHours: 10680,
          healthIndex: 95,
          calibrationDueDays: 365,
          technician: 'Munirkhan Genius',
          nodeId: 'WGG-01',
          criticality: 'MEDIUM'
        },
        {
          assetCode: 'BMN-AWLR-ACT-001',
          componentName: 'Sirine & Alarm Actuator',
          modelNumber: 'Dual Channel Relay 5V',
          installationDate: new Date('2025-03-12'),
          operatingHours: 10680,
          healthIndex: 88,
          calibrationDueDays: 120,
          technician: 'Faisal Fardani',
          nodeId: 'WGG-01',
          criticality: 'MEDIUM'
        }
      ];

      // Pastikan StationNode 'WGG-01' ada untuk memenuhi Foreign Key
      await prisma.stationNode.upsert({
        where: { id: 'WGG-01' },
        update: {},
        create: {
          id: 'WGG-01',
          name: 'Pos AWLR Jembatan Wanggu',
          latitude: -4.0175,
          longitude: 122.5152,
          location: 'Jembatan Wanggu'
        }
      });

      // Insert ke database menggunakan Prisma
      await prisma.hardwareAsset.createMany({
        data: initialSeedData as any,
      });

      // Tarik ulang setelah seeding
      assets = await prisma.hardwareAsset.findMany({
        orderBy: { criticality: 'asc' }
      });
    }

    return NextResponse.json({ success: true, data: assets }, { status: 200 });
  } catch (error: any) {
    console.error('[INFRA REGISTRY ERROR]:', error.message);
    return NextResponse.json(
      { success: false, error: 'Gagal mengekstrak data dari database infrastruktur.' },
      { status: 500 }
    );
  }
}