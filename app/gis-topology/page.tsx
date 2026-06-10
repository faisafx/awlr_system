// ─────────────────────────────────────────────────────────────────────────────
// File: app/gis-topology/page.tsx
// Architecture: Next.js 14 Client Component
// Project: Full-Stack AWLR Command Center - Sungai Wanggu, Kendari
// Description: J.A.R.V.I.S / HUD Style Geospatial & Network Topology Console.
//              Features LIVE MQTT integration, LoRaWAN mesh visualizer, and 
//              dynamic SVG river cross-sections.
// ─────────────────────────────────────────────────────────────────────────────

'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import mqtt, { MqttClient } from 'mqtt';
import { 
  Crosshair, Radio, Database, Cpu, Activity, ShieldAlert,
  TerminalSquare, WifiOff, Zap, Server, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── DYNAMIC IMPORT MAP ────────────────────────────────────────────────────────
const JarvisMap = dynamic(() => import('@/components/map/JarvisMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex flex-col items-center justify-center bg-[#020617] border border-cyan-500/20">
      <div className="w-12 h-12 border-4 border-t-cyan-500 border-b-cyan-500 border-l-transparent border-r-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-[10px] font-mono text-cyan-500 tracking-widest animate-pulse">CALIBRATING GEOSPATIAL MATRIX...</p>
    </div>
  )
});

// ── INTERFACES & CONSTANTS ────────────────────────────────────────────────────
interface TelemetryPayload {
  hydro: number;
  ultra: number;
  rssi: number;
  snr: number;
  vbat: number;
}

const MQTT_BROKER = 'wss://broker.emqx.io:8084/mqtt';
const MQTT_TOPIC = 'bbws/wanggu/node01/telemetry';
const TANGGUL_MAX_HEIGHT = 5.0; // Meter

// ── REUSABLE HUD COMPONENTS ───────────────────────────────────────────────────
// Komponen bingkai sudut (Corner Brackets) ala Iron Man HUD
const HudBox = ({ children, className, title, glowing = false }: { children: React.ReactNode, className?: string, title?: string, glowing?: boolean }) => (
  <div className={cn("relative p-5 bg-[#030914]/80 backdrop-blur-md border border-cyan-500/20", className)}>
    {/* Corner Brackets */}
    <div className={cn("absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2", glowing ? "border-cyan-400" : "border-cyan-700")} />
    <div className={cn("absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2", glowing ? "border-cyan-400" : "border-cyan-700")} />
    <div className={cn("absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2", glowing ? "border-cyan-400" : "border-cyan-700")} />
    <div className={cn("absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2", glowing ? "border-cyan-400" : "border-cyan-700")} />
    
    {/* CRT Scanline Overlay */}
    <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] opacity-20 z-0"></div>

    {title && (
      <div className="relative z-10 flex items-center justify-between border-b border-cyan-500/20 pb-2 mb-4">
        <span className="text-[10px] font-mono text-cyan-400 font-bold tracking-[0.2em]">{title}</span>
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-cyan-500/40"></div>
          <div className="w-2 h-2 bg-cyan-500/80"></div>
        </div>
      </div>
    )}
    <div className="relative z-10 h-full">{children}</div>
  </div>
);

// ── MAIN DASHBOARD COMPONENT ──────────────────────────────────────────────────
export default function GisTopologyPage() {
  // States
  const [telemetry, setTelemetry] = useState<TelemetryPayload>({ hydro: 0, ultra: 0, rssi: 0, snr: 0, vbat: 0 });
  const [mqttStatus, setMqttStatus] = useState<'CONNECTING' | 'ONLINE' | 'OFFLINE'>('CONNECTING');
  const clientRef = useRef<MqttClient | null>(null);

  // ── 1. MQTT ENGINE SETUP ────────────────────────────────────────────────────
  useEffect(() => {
    const clientId = `jarvis-hud-${Math.random().toString(16).substring(2, 10)}`;
    
    clientRef.current = mqtt.connect(MQTT_BROKER, {
      clientId,
      clean: true,
      connectTimeout: 5000,
      reconnectPeriod: 2000,
    });

    clientRef.current.on('connect', () => {
      setMqttStatus('ONLINE');
      clientRef.current?.subscribe(MQTT_TOPIC);
    });

    clientRef.current.on('offline', () => setMqttStatus('OFFLINE'));
    clientRef.current.on('reconnect', () => setMqttStatus('CONNECTING'));

    clientRef.current.on('message', (topic, message) => {
      if (topic === MQTT_TOPIC) {
        try {
          const payload = JSON.parse(message.toString());
          // Update state jika data ada
          setTelemetry({
            hydro: Number(payload.hydro) || telemetry.hydro,
            ultra: Number(payload.ultra) || telemetry.ultra,
            rssi: Number(payload.rssi) || telemetry.rssi,
            snr: Number(payload.snr) || telemetry.snr,
            vbat: Number(payload.vbat) || telemetry.vbat,
          });
        } catch (e) {
          console.error("Payload Parse Error", e);
        }
      }
    });

    return () => {
      if (clientRef.current) clientRef.current.end();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Derived Values
  const isAwaitingHardware = mqttStatus !== 'ONLINE' || telemetry.hydro === 0;
  const hardwareDisplayStatus = mqttStatus === 'OFFLINE' ? 'OFFLINE' : telemetry.hydro > 3.0 ? 'WARNING' : 'ONLINE';
  const waterLvl = isAwaitingHardware ? 0 : telemetry.hydro; // Air kosong jika tidak ada data

  return (
    <div className="min-h-screen bg-[#020617] text-cyan-500 font-mono p-4 space-y-4">
      
      {/* ── HEADER TELEMETRY STRIP ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-cyan-800 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <Crosshair className="text-cyan-400 animate-[spin_4s_linear_infinite]" size={28} />
          <div>
            <h1 className="text-xl font-bold tracking-[0.2em] text-cyan-50">SYS.TOPOLOGY_MATRIX</h1>
            <p className="text-[10px] text-cyan-600 tracking-widest mt-1">NODE: S.WANGGU_KENDARI | PROTOCOL: LORAWAN</p>
          </div>
        </div>

        {/* Global Connection Status HUD */}
        <div className={cn(
          "px-4 py-2 mt-4 md:mt-0 flex items-center gap-3 border backdrop-blur-md",
          mqttStatus === 'ONLINE' ? "bg-cyan-900/20 border-cyan-500/50 text-cyan-400" :
          mqttStatus === 'CONNECTING' ? "bg-amber-900/20 border-amber-500/50 text-amber-400" :
          "bg-red-900/20 border-red-500/50 text-red-400"
        )}>
          {mqttStatus === 'ONLINE' ? <Activity size={16} className="animate-pulse" /> : <WifiOff size={16} />}
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-widest text-slate-400">Uplink Status</span>
            <span className="text-xs font-bold tracking-widest">
              {mqttStatus === 'ONLINE' ? 'EMQX SECURE WSS' : 
               mqttStatus === 'CONNECTING' ? 'ESTABLISHING HANDSHAKE...' : 'LINK SEVERED'}
            </span>
          </div>
        </div>
      </div>

      {/* ── GRID LAYER UTAMA ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        
        {/* KOLOM KIRI: SPASIAL & CROSS SECTION (8 Kolom) */}
        <div className="xl:col-span-8 flex flex-col gap-4">
          
          {/* Peta J.A.R.V.I.S */}
          <HudBox title="GEO.SPATIAL_RADAR_OVERLAY" className="h-[400px]" glowing={mqttStatus === 'ONLINE'}>
            <JarvisMap hardwareStatus={hardwareDisplayStatus} />
            
            {/* Warning Overlay Text if no hardware */}
            {isAwaitingHardware && (
              <div className="absolute inset-0 z-[1000] flex items-center justify-center pointer-events-none bg-[#020617]/50">
                <div className="border border-red-500 bg-red-950/80 px-6 py-2 flex items-center gap-3 animate-pulse">
                  <ShieldAlert className="text-red-500" size={18} />
                  <span className="text-red-500 font-bold tracking-widest text-xs">AWAITING HARDWARE SIGNAL...</span>
                </div>
              </div>
            )}
          </HudBox>

          {/* Penampang Melintang Sungai (Cross Section) */}
          <HudBox title="HYDRO.CROSS_SECTION_ANALYSIS" className="h-[260px]">
            <div className="w-full h-full relative">
              {/* HUD Grid Background */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.1)_1px,transparent_1px)] bg-[length:20px_20px]"></div>
              
              <svg viewBox="0 0 500 200" className="w-full h-full" preserveAspectRatio="none">
                {/* Ruler Lines (Y-Axis) */}
                {[0, 1, 2, 3, 4, 5].map((val, idx) => (
                  <g key={idx}>
                    <line x1="40" y1={180 - (val * 30)} x2="480" y2={180 - (val * 30)} stroke="rgba(6,182,212,0.2)" strokeWidth="1" strokeDasharray="2,4" />
                    <text x="10" y={183 - (val * 30)} fill="#0891b2" fontSize="9">{val}.0m</text>
                  </g>
                ))}

                {/* Siaga 1 Red Line */}
                <line x1="40" y1={180 - (3.5 * 30)} x2="480" y2={180 - (3.5 * 30)} stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4,4" />
                <text x="400" y={180 - (3.5 * 30) - 5} fill="#ef4444" fontSize="8" className="animate-pulse">CRITICAL THRESHOLD</text>

                {/* Dynamic Water Block */}
                <rect 
                  x="80" 
                  y={180 - (waterLvl * 30)} 
                  width="340" 
                  height={waterLvl * 30} 
                  fill="url(#jarvisWater)" 
                  className="transition-all duration-1000 ease-in-out"
                />
                
                {/* Top of water animated line */}
                {waterLvl > 0 && (
                  <line 
                    x1="80" y1={180 - (waterLvl * 30)} 
                    x2="420" y2={180 - (waterLvl * 30)} 
                    stroke="#06b6d4" strokeWidth="2" 
                    className="animate-pulse"
                  />
                )}

                {/* Retaining Wall Structure (Tanggul) */}
                <polyline points="40,20 80,30 120,180 380,180 420,30 480,20" fill="none" stroke="#0891b2" strokeWidth="2" />
                {/* Tech Nodes on Wall */}
                <circle cx="80" cy="30" r="3" fill="#06b6d4" />
                <circle cx="420" cy="30" r="3" fill="#06b6d4" />

                {/* Submerged Hydrostatic Sensor (QDY30A) */}
                <g transform="translate(130, 175)">
                  <rect x="-4" y="-10" width="8" height="10" fill={isAwaitingHardware ? "#334155" : "#10b981"} />
                  <line x1="0" y1="-10" x2="-20" y2="-40" stroke="#10b981" strokeWidth="1" strokeDasharray="2,2" />
                  <text x="-25" y="-45" fill="#10b981" fontSize="7">QDY30A</text>
                </g>

                {/* Ultrasonic Sensor Beam (A02YYUW) */}
                <g transform="translate(250, 10)">
                  <rect x="-8" y="0" width="16" height="6" fill={isAwaitingHardware ? "#334155" : "#8b5cf6"} />
                  <line x1="0" y1="6" x2="0" y2={180 - (waterLvl * 30)} stroke="#8b5cf6" strokeWidth="1" strokeDasharray="4,4" className={isAwaitingHardware ? "hidden" : "animate-pulse"} />
                  <text x="12" y="5" fill="#8b5cf6" fontSize="7">A02YYUW BEAM</text>
                </g>

                <defs>
                  <linearGradient id="jarvisWater" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(6, 182, 212, 0.4)" />
                    <stop offset="100%" stopColor="rgba(6, 182, 212, 0.05)" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Data Readout */}
              <div className="absolute top-2 right-2 text-right">
                <span className="text-[9px] text-cyan-600 block tracking-widest">LIVE DEPTH</span>
                <span className="text-2xl font-bold text-cyan-300">{waterLvl.toFixed(2)}<span className="text-xs text-cyan-700">m</span></span>
              </div>
            </div>
          </HudBox>
        </div>

        {/* KOLOM KANAN: LORAWAN NETWORK MESH (4 Kolom) */}
        <div className="xl:col-span-4 flex flex-col gap-4">
          <HudBox title="UPLINK.LORA_MESH_TOPOLOGY" className="flex-1">
            
            <div className="flex flex-col h-full justify-between space-y-6 pt-4 relative">
              
              {/* Vertical Data Stream Line */}
              <div className="absolute left-6 top-10 bottom-10 w-px bg-cyan-900">
                <div className="w-full h-10 bg-cyan-400 blur-sm animate-[ping_2s_linear_infinite]"></div>
              </div>

              {/* Node 1: ESP32 Field Hardware */}
              <div className="relative pl-14">
                <div className="absolute left-3.5 top-2 w-5 h-5 bg-[#020617] border-2 border-cyan-500 rounded flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.5)]">
                  <Cpu size={10} className="text-cyan-400" />
                </div>
                <h3 className="text-xs font-bold text-cyan-300 tracking-widest">ESP32 FIELD NODE</h3>
                <div className="mt-2 grid grid-cols-2 gap-2 text-[10px]">
                  <div className="bg-cyan-950/50 p-1.5 border border-cyan-900/50">
                    <span className="text-cyan-700 block">VBAT</span>
                    <span className={telemetry.vbat < 11 ? "text-red-400" : "text-cyan-400"}>
                      {isAwaitingHardware ? '--' : telemetry.vbat.toFixed(1)} V
                    </span>
                  </div>
                  <div className="bg-cyan-950/50 p-1.5 border border-cyan-900/50">
                    <span className="text-cyan-700 block">STATUS</span>
                    <span className={isAwaitingHardware ? "text-slate-500" : "text-emerald-400"}>
                      {isAwaitingHardware ? 'STANDBY' : 'TX_ACTIVE'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Node 2: Gateway */}
              <div className="relative pl-14">
                <div className="absolute left-3.5 top-2 w-5 h-5 bg-[#020617] border-2 border-blue-500 rounded flex items-center justify-center shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                  <Radio size={10} className="text-blue-400" />
                </div>
                <h3 className="text-xs font-bold text-blue-300 tracking-widest">GATEWAY (BWS IV)</h3>
                <div className="mt-2 grid grid-cols-2 gap-2 text-[10px]">
                  <div className="bg-blue-950/30 p-1.5 border border-blue-900/50">
                    <span className="text-blue-700 block">RSSI</span>
                    <span className="text-blue-400 font-mono">
                      {isAwaitingHardware ? '--' : `${telemetry.rssi} dBm`}
                    </span>
                  </div>
                  <div className="bg-blue-950/30 p-1.5 border border-blue-900/50">
                    <span className="text-blue-700 block">SNR</span>
                    <span className="text-blue-400 font-mono">
                      {isAwaitingHardware ? '--' : `${telemetry.snr} dB`}
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-[9px] text-blue-600 tracking-widest flex items-center gap-1">
                  <Zap size={10} /> FREQ: 921.4 MHz (AS923)
                </div>
              </div>

              {/* Node 3: EMQX Cloud */}
              <div className="relative pl-14">
                <div className="absolute left-3.5 top-2 w-5 h-5 bg-[#020617] border-2 border-purple-500 rounded flex items-center justify-center shadow-[0_0_10px_rgba(168,85,247,0.5)]">
                  <Server size={10} className="text-purple-400" />
                </div>
                <h3 className="text-xs font-bold text-purple-300 tracking-widest">EMQX BROKER</h3>
                <div className="mt-2 text-[10px] bg-purple-950/30 p-2 border border-purple-900/50">
                  <div className="flex justify-between border-b border-purple-900/50 pb-1 mb-1">
                    <span className="text-purple-700">PROTOCOL</span>
                    <span className="text-purple-400">MQTT WSS</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-700">SOCKET</span>
                    <span className={mqttStatus === 'ONLINE' ? "text-emerald-400 animate-pulse" : "text-red-400"}>
                      {mqttStatus}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </HudBox>
          
          {/* Diagnostic Console Mini */}
          <HudBox title="SYS.LOG" className="h-[120px]">
            <div className="text-[9px] text-cyan-600 font-mono overflow-hidden h-full flex flex-col justify-end pb-4 space-y-1">
              <p><span className="text-cyan-800">[{new Date().toLocaleTimeString()}]</span> INITIALIZING J.A.R.V.I.S KERNEL...</p>
              <p><span className="text-cyan-800">[{new Date().toLocaleTimeString()}]</span> MAPPING WANGGU RIVER SPATIAL DATA...</p>
              {mqttStatus === 'CONNECTING' && <p className="text-amber-500">ATTEMPTING BROKER HANDSHAKE...</p>}
              {mqttStatus === 'ONLINE' && <p className="text-emerald-500">SECURE SOCKET ESTABLISHED.</p>}
              {isAwaitingHardware && mqttStatus === 'ONLINE' && <p className="text-cyan-400 animate-pulse">LISTENING ON TOPIC: {MQTT_TOPIC}</p>}
              {!isAwaitingHardware && <p className="text-cyan-300">TELEMETRY RECEIVED. DECODING PAYLOAD...</p>}
            </div>
          </HudBox>
        </div>

      </div>
    </div>
  );
}