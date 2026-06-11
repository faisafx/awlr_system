// ─────────────────────────────────────────────────────────────────────────────
// File: app/page.tsx
// Architecture: Next.js 14 App Router (Client/Server Orchestrator)
// Project: Full-Stack AWLR Command Center - Sungai Wanggu, Kendari
// Description: Core command center dashboard. Features sensor fusion validation,
//              PUPR-standard EWS threshold indicators, and live EMQX MQTT telemetry.
// ─────────────────────────────────────────────────────────────────────────────

'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import mqtt, { MqttClient } from 'mqtt';
import { 
  AlertTriangle, 
  Droplet, 
  Gauge, 
  CloudRain, 
  Radio, 
  BatteryCharging, 
  ShieldAlert, 
  Zap, 
  RefreshCw,
  Clock,
  Wifi,
  WifiOff
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Dynamic Imports For WebGL/Client-Heavy Widgets ──────────────────────────
const StationVisualizer = dynamic(() => import('@/components/3d/StationVisualizer'), {
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-slate-950/40 text-xs font-mono text-slate-500 animate-pulse">Memuat Topografi 3D...</div>
});

const TelemetryChart = dynamic(() => import('@/components/charts/TelemetryChart'), {
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-slate-950/40 text-xs font-mono text-slate-500 animate-pulse">Menginisialisasi Apache ECharts...</div>
});

const GISMap = dynamic(() => import('@/components/map/GISMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-slate-950/40 text-xs font-mono text-slate-500 animate-pulse">Menghubungkan Radar BMKG & GIS Map...</div>
});

// ── Type Definitions ─────────────────────────────────────────────────────────
interface TelemetryState {
  tmaHydrostatic: number; // QDY30A (meter)
  tmaUltrasonic: number;  // A02YYUW (meter)
  deviation: number;      // Selisih antara kedua sensor (meter)
  rainRate: number;       // Ombrometer (mm)
  batteryVoltage: number; // Status Aki (Volt)
  solarCurrent: number;   // Status Panel Surya (Ampere)
  loraRssi: number;       // Kekuatan Sinyal (dBm)
  ewsStatus: 'AMAN' | 'WASPADA' | 'SIAGA' | 'AWAS';
}

// Konfigurasi MQTT EMQX Serverless Kompatibel dengan Port Aman Web Browser (WSS)
const MQTT_BROKER = 'wss://f06e9090.ala.asia-southeast1.emqxsl.com:8084/mqtt'; 
const MQTT_TOPIC = 'awlr/wanggu/sensor';

export default function CommandCenter() {
  const [data, setData] = useState<TelemetryState>({
    tmaHydrostatic: 0.00, // Sementara 0 karena menunggu sensor tekanan dipasang
    tmaUltrasonic: 0.00,
    deviation: 0.00,
    rainRate: 0.0,
    batteryVoltage: 12.6, // Nilai default indikator infra aki
    solarCurrent: 1.45,   // Nilai default indikator panel surya
    loraRssi: -68,        // Nilai default sinyal lora
    ewsStatus: 'AMAN',
  });

  const [lastUpdated, setLastUpdated] = useState<string>('Menunggu Data...');
  const [connectionStatus, setConnectionStatus] = useState<'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR'>('CONNECTING');
  const clientRef = useRef<MqttClient | null>(null);

  useEffect(() => {
    const clientId = `awlr-web-${Math.random().toString(16).substring(2, 8)}`;
    
    // Koneksi menggunakan Kredensial Baru Anda
    clientRef.current = mqtt.connect(MQTT_BROKER, {
      clientId,
      username: 'faisal',       
      password: 'faisalwibu11', 
      clean: true,
      connectTimeout: 5000,
      reconnectPeriod: 2000,
    });

    clientRef.current.on('connect', () => {
      setConnectionStatus('CONNECTED');
      clientRef.current?.subscribe(MQTT_TOPIC, { qos: 0 });
    });

    clientRef.current.on('reconnect', () => {
      setConnectionStatus('CONNECTING');
    });

    clientRef.current.on('error', (err) => {
      console.error('MQTT Error: ', err);
      setConnectionStatus('ERROR');
    });

    clientRef.current.on('offline', () => {
      setConnectionStatus('DISCONNECTED');
    });

    // Menangani Paket JSON Beruntun dari ESP32 setiap 5 detik
    clientRef.current.on('message', (topic, message) => {
      if (topic === MQTT_TOPIC) {
        try {
          const payload = JSON.parse(message.toString());
          
          setData((prev) => {
            const newData = { ...prev };

            // Penyesuaian filter agar cocok dengan format database relasional Supabase yang baru
            if (payload.parameter === 'TMA_ULTRA' || payload.parameter.includes('Ultrasonik')) {
              // Konversi dari CM (ESP32) ke METER (Standard Web)
              newData.tmaUltrasonic = Number((payload.rawValue / 100).toFixed(2));
              newData.ewsStatus = payload.status || 'AMAN';
            } 
            else if (payload.parameter === 'CURAH_HUJAN' || payload.parameter.includes('Ombrometer')) {
              newData.rainRate = Number(payload.rawValue) || 0;
            }

            // Hitung Deviasi antara sensor dasar (hydro) dan atas (ultrasonik)
            newData.deviation = Number(Math.abs(newData.tmaHydrostatic - newData.tmaUltrasonic).toFixed(2));

            return newData;
          });

          // Set waktu pembaruan terakhir data masuk
          setLastUpdated(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        } catch (e) {
          console.error("Gagal melakukan parsing data JSON dari ESP32:", e);
        }
      }
    });

    return () => {
      if (clientRef.current) {
        clientRef.current.end();
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      
      {/* ── BARIS 1: Dashboard Control Header & EWS Alert Banner ──────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-3 text-xs font-mono uppercase tracking-widest">
            {/* Indikator Status MQTT Real-Time */}
            <div className={cn(
              "flex items-center gap-1.5 px-2 py-0.5 rounded-full border backdrop-blur-sm",
              connectionStatus === 'CONNECTED' ? "bg-teal-500/10 text-teal-400 border-teal-500/20" :
              connectionStatus === 'CONNECTING' ? "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse" :
              "bg-rose-500/10 text-rose-400 border-rose-500/20"
            )}>
              {connectionStatus === 'CONNECTED' ? <Wifi size={12} /> : <WifiOff size={12} />}
              {connectionStatus === 'CONNECTED' ? 'EMQX SECURE WSS' : 
               connectionStatus === 'CONNECTING' ? 'MENGHUBUNGKAN BROKER...' : 'KONEKSI TERPUTUS'}
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 mt-2">
            Command Center Utama <span className="text-slate-500 font-light">| Pos WGG-01</span>
          </h1>
        </div>

        {/* Dynamic EWS Status Badge Standard Government Grade */}
        <div className="flex items-center gap-3 bg-slate-900/40 p-2 rounded-xl border border-white/5 backdrop-blur-md">
          <div className="text-right px-2">
            <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-500">Status Kebencanaan</span>
            <span className="text-[11px] font-mono text-slate-400">Pembaruan: {lastUpdated}</span>
          </div>
          
          <div className={cn(
            "px-6 py-3 rounded-lg font-bold text-sm uppercase tracking-widest shadow-lg border animate-pulse flex items-center gap-2",
            data.ewsStatus === 'AMAN' && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/5",
            data.ewsStatus === 'WASPADA' && "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-amber-500/5",
            data.ewsStatus === 'SIAGA' && "bg-orange-500/10 text-orange-400 border-orange-500/20 shadow-orange-500/5",
            data.ewsStatus === 'AWAS' && "bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-rose-500/5"
          )}>
            <ShieldAlert size={16} />
            {data.ewsStatus === 'AMAN' && 'SIAGA IV / AMAN'}
            {data.ewsStatus === 'WASPADA' && 'SIAGA III / WASPADA'}
            {data.ewsStatus === 'SIAGA' && 'SIAGA II / SIAGA'}
            {data.ewsStatus === 'AWAS' && 'SIAGA I / AWAS'}
          </div>
        </div>
      </div>

      {/* ── BARIS 2: KPI Telemetry High-Density Summary Cards ────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: TMA Hydrostatic (QDY30A) */}
        <div className="p-4 rounded-xl bg-slate-900/20 border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 text-teal-500/20 group-hover:text-teal-500/40 transition-colors">
            <Gauge size={24} />
          </div>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">TMA Hydrostatic (QDY30A)</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono tracking-tight text-slate-100">{data.tmaHydrostatic.toFixed(2)}</span>
            <span className="text-xs font-mono text-slate-500">Meter</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
            <span className={cn("w-1.5 h-1.5 rounded-full", data.tmaHydrostatic > 0 ? "bg-emerald-500" : "bg-slate-600")} /> 
            Sensor Submerged / Tekanan Dasar
          </div>
        </div>

        {/* Card 2: TMA Ultrasonic (A02YYUW) */}
        <div className="p-4 rounded-xl bg-slate-900/20 border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 text-sky-500/20 group-hover:text-sky-500/40 transition-colors">
            <Droplet size={24} />
          </div>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">TMA Ultrasonic (A02YYUW)</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono tracking-tight text-slate-100">{data.tmaUltrasonic.toFixed(2)}</span>
            <span className="text-xs font-mono text-slate-500">Meter</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <span className={cn("w-1.5 h-1.5 rounded-full", data.deviation > 0.05 ? "bg-amber-500" : "bg-emerald-500")} /> 
              Jarak Sensor: {data.tmaUltrasonic.toFixed(2)}m
            </span>
          </div>
        </div>

        {/* Card 3: Curah Hujan (Ombrometer) */}
        <div className="p-4 rounded-xl bg-slate-900/20 border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 text-blue-500/20 group-hover:text-blue-500/40 transition-colors">
            <CloudRain size={24} />
          </div>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">Intensitas Hujan Lokal</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono tracking-tight text-slate-100">{data.rainRate.toFixed(1)}</span>
            <span className="text-xs font-mono text-slate-500">mm</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
            <span className={cn(
              "w-1.5 h-1.5 rounded-full",
              data.rainRate > 50 ? "bg-orange-500 animate-pulse" : data.rainRate > 0 ? "bg-blue-500" : "bg-emerald-500"
            )} /> 
            {data.rainRate > 50 ? 'Hujan Lebat (Tipping Bucket)' : data.rainRate > 0 ? 'Hujan Terdeteksi' : 'Cuaca Cerah'}
          </div>
        </div>

        {/* Card 4: Node Power & Sinyal Transmission */}
        <div className="p-4 rounded-xl bg-slate-900/20 border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 text-orange-500/20 group-hover:text-orange-500/40 transition-colors">
            <Radio size={24} />
          </div>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">Node Infra & Uplink</span>
          <div className="mt-2 grid grid-cols-2 gap-2 border-b border-white/5 pb-1.5">
            <div>
              <span className="text-[10px] text-slate-500 block">Daya Aki</span>
              <span className="text-sm font-bold font-mono text-slate-200 flex items-center gap-1">
                <BatteryCharging size={12} className={data.batteryVoltage < 11.5 ? "text-rose-400" : "text-emerald-400"} /> 
                {data.batteryVoltage.toFixed(1)}V
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Panel Amperage</span>
              <span className="text-sm font-bold font-mono text-slate-200 flex items-center gap-1">
                <Zap size={12} className={data.solarCurrent < 0.5 ? "text-slate-500" : "text-red-400"} /> 
                {data.solarCurrent.toFixed(2)}A
              </span>
            </div>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 flex items-center justify-between font-mono">
            <span>RSSI: {data.loraRssi} dBm</span>
            <span className={cn(
              "text-[10px] font-bold",
              data.loraRssi < -100 ? "text-rose-400" : "text-emerald-400"
            )}>
              {data.loraRssi < -100 ? 'WEAK SIGNAL' : 'SECURE CONNECT'}
            </span>
          </div>
        </div>

      </div>

      {/* ── BARIS 3 & 4: Visualizer, ECharts, GIS Map ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Panel Kiri: 3D Array Viewport (SketchUp Style Priority) */}
        <div className="lg:col-span-4 h-[420px] rounded-xl bg-slate-900/40 border border-white/5 overflow-hidden flex flex-col backdrop-blur-md">
          <div className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-950/20">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">Topografi Sensor Array</h2>
              <p className="text-[10px] text-slate-500 font-mono">Skema Peletakan Elemen Struktur</p>
            </div>
            <span className="text-[9px] font-bold tracking-widest bg-slate-800 text-teal-400 px-2 py-0.5 rounded border border-teal-500/30">
              SKETCHUP / CAD VIEW
            </span>
          </div>
          <div className="flex-1 relative">
            <StationVisualizer />
          </div>
        </div>

        {/* Panel Kanan: Real-Time ECharts Time Series Data */}
        <div className="lg:col-span-8 h-[420px] rounded-xl bg-slate-900/40 border border-white/5 overflow-hidden flex flex-col backdrop-blur-md">
          <div className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-950/20">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">Garis Waktu Telemetri Hidrograf</h2>
              <p className="text-[10px] text-slate-500 font-mono">Input Sinkronisasi Sensor Fusi vs Garis Batas PUPR</p>
            </div>
            <button className="p-1 rounded bg-slate-800 text-slate-400 hover:text-teal-400 hover:bg-slate-700 transition-colors">
              <RefreshCw size={12} className={connectionStatus === 'CONNECTING' ? 'animate-spin' : ''} />
            </button>
          </div>
          <div className="flex-1 p-2">
            <TelemetryChart />
          </div>
        </div>

      </div>

      {/* Panel Bawah: GIS Map */}
      <div className="w-full h-[350px] rounded-xl bg-slate-900/40 border border-white/5 overflow-hidden flex flex-col backdrop-blur-md">
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-950/20">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">Spasial Pemetaan Aliran & Lapisan BMKG</h2>
            <p className="text-[10px] text-slate-500 font-mono">Daerah Tangkapan Air (DTA) DAS Wanggu, Kendari</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-500" /> RADAR CUACA AKTIF
          </div>
        </div>
        <div className="flex-1 relative">
          <GISMap />
        </div>
      </div>

    </div>
  );
}