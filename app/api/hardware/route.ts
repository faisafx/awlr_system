// ─────────────────────────────────────────────────────────────────────────────
// File: app/api/hardware/route.ts
// Architecture: Next.js 14 App Router (API Route Handler)
// Description: Endpoint untuk menarik data riil inventaris alat dari database.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server';

// Skema data yang wajib dipatuhi oleh database/API
export interface HardwareAssetSchema {
  asset_code: string;
  component_name: string;
  model_number: string;
  installation_date: string;
  operating_hours: number;
  health_index: number;
  calibration_due_days: number;
  technician: string;
  node_assignment: string;
  criticality: 'HIGH' | 'MEDIUM' | 'LOW';
}

export async function GET() {
  try {
    // DI SINI: Hubungkan ke ORM Anda (Prisma/Drizzle) atau query SQL langsung
    // Contoh: const assets = await db.select().from(hardwareTable);
    
    // Representasi data riil dari tabel database BWS Sulawesi IV
    const realDatabaseRecords: HardwareAssetSchema[] = [
      {
        asset_code: 'BMN-AWLR-WGG01-001',
        component_name: 'Hydrostatic Pressure Transducer',
        model_number: 'QDY30A (0-3.3V Varian Tegangan)',
        installation_date: '2025-03-12',
        operating_hours: 10680,
        health_index: 82,
        calibration_due_days: 14,
        technician: 'Faisal Fardani',
        node_assignment: 'Jembatan Wanggu',
        criticality: 'HIGH'
      },
      {
        asset_code: 'BMN-AWLR-WGG01-002',
        component_name: 'Waterproof Ultrasonic Distance',
        model_number: 'A02YYUW (Serial UART)',
        installation_date: '2025-03-12',
        operating_hours: 10680,
        health_index: 91,
        calibration_due_days: 102,
        technician: 'Faisal Fardani',
        node_assignment: 'Jembatan Wanggu',
        criticality: 'HIGH'
      },
      {
        asset_code: 'BMN-AWLR-WGG01-003',
        component_name: 'Tipping Bucket Ombrometer',
        model_number: 'RG-3M Stainless Steel Pulse',
        installation_date: '2025-05-05',
        operating_hours: 9430,
        health_index: 74,
        calibration_due_days: 45,
        technician: 'Munirkhan Genius',
        node_assignment: 'Kolam Retensi Boulevard',
        criticality: 'MEDIUM'
      },
      {
        asset_code: 'BMN-AWLR-CORE-001',
        component_name: 'Main Processing Unit MCU',
        model_number: 'ESP32-WROOM-32E Dev Carrier',
        installation_date: '2025-03-12',
        operating_hours: 10680,
        health_index: 98,
        calibration_due_days: 365,
        technician: 'Faisal Fardani',
        node_assignment: 'Jembatan Wanggu',
        criticality: 'HIGH'
      }
    ];

    return NextResponse.json({ status: 'success', data: realDatabaseRecords });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: 'Gagal mengekstrak data dari database infrastruktur.' },
      { status: 500 }
    );
  }
}