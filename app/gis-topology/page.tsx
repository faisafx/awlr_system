// ─────────────────────────────────────────────────────────────────────────────
// File: app/gis-topology/page.tsx
// Architecture: Next.js 14 Client Component
// Project: Full-Stack AWLR Command Center - Sungai Wanggu, Kendari
// Description: Enterprise Cloud Style Geospatial & Network Topology Console.
//              Features LIVE MQTT integration, LoRaWAN mesh visualizer, and 
//              dynamic SVG river cross-sections.
// ─────────────────────────────────────────────────────────────────────────────

'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import mqtt, { MqttClient } from 'mqtt';
import { 
  Crosshair, Radio, Database, Cpu, Activity, ShieldAlert,
  TerminalSquare, WifiOff, Zap, Server, Layers, ShieldCheck, CheckCircle2, Wifi, Network
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── DYNAMIC IMPORT MAP ────────────────────────────────────────────────────────
const GISMap = dynamic(() => import('@/components/map/GISMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex flex-col items-center justify-center bg-[var(--surface-inset)] rounded-[inherit]">
      <div className="w-8 h-8 border-2 border-[var(--border-default)] border-t-[var(--brand-500)] rounded-full animate-spin"></div>
      <p className="mt-3 text-[10px] font-[family-name:var(--font-jetbrains)] text-[var(--text-muted)] animate-pulse uppercase tracking-widest">
        Memuat Modul Spasial...
      </p>
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

// ── MAIN DASHBOARD COMPONENT ──────────────────────────────────────────────────
export default function GisTopologyPage() {
  // States
  const [telemetry, setTelemetry] = useState<TelemetryPayload>({ hydro: 0, ultra: 0, rssi: 0, snr: 0, vbat: 0 });
  const [mqttStatus, setMqttStatus] = useState<'CONNECTING' | 'ONLINE' | 'OFFLINE'>('CONNECTING');
  const [logs, setLogs] = useState<{time: string, msg: string, type: 'info' | 'success' | 'warn' | 'error'}[]>([]);
  const clientRef = useRef<MqttClient | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString('id-ID'), msg, type }].slice(-20));
  };

  // ── 1. MQTT ENGINE SETUP ────────────────────────────────────────────────────
  useEffect(() => {
    const clientId = `awlr-topo-${Math.random().toString(16).substring(2, 10)}`;
    addLog('INITIALIZING SYSTEM KERNEL...', 'info');
    
    clientRef.current = mqtt.connect(MQTT_BROKER, {
      clientId,
      clean: true,
      connectTimeout: 5000,
      reconnectPeriod: 2000,
    });

    clientRef.current.on('connect', () => {
      setMqttStatus('ONLINE');
      addLog('SECURE SOCKET ESTABLISHED.', 'success');
      clientRef.current?.subscribe(MQTT_TOPIC, (err) => {
        if (!err) addLog(`LISTENING ON TOPIC: ${MQTT_TOPIC}`, 'info');
      });
    });

    clientRef.current.on('offline', () => {
      setMqttStatus('OFFLINE');
      addLog('LINK SEVERED. ATTEMPTING RECONNECT...', 'error');
    });
    
    clientRef.current.on('reconnect', () => setMqttStatus('CONNECTING'));

    clientRef.current.on('message', (topic, message) => {
      if (topic === MQTT_TOPIC) {
        try {
          const payload = JSON.parse(message.toString());
          setTelemetry(prev => ({
            hydro: Number(payload.hydro) || prev.hydro,
            ultra: Number(payload.ultra) || prev.ultra,
            rssi: Number(payload.rssi) || prev.rssi,
            snr: Number(payload.snr) || prev.snr,
            vbat: Number(payload.vbat) || prev.vbat,
          }));
        } catch (e) {
          console.error("Payload Parse Error", e);
        }
      }
    });

    return () => {
      if (clientRef.current) clientRef.current.end();
    };
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Derived Values
  const isAwaitingHardware = mqttStatus !== 'ONLINE' || telemetry.hydro === 0;
  const hardwareDisplayStatus = mqttStatus === 'OFFLINE' ? 'OFFLINE' : telemetry.hydro > 3.0 ? 'WARNING' : 'ONLINE';
  const waterLvl = isAwaitingHardware ? 0 : telemetry.hydro; 
  const isCritical = waterLvl >= 3.5;

  return (
    <div className="flex flex-col gap-6">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[var(--border-subtle)] gap-4">
        <div>
          <h1 className="text-[20px] font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-2">
            <Layers className="text-[var(--brand-600)]" size={24} />
            Pemetaan Spasial & Topologi
          </h1>
          <p className="text-[12px] text-[var(--text-muted)] mt-1 font-medium">
            Visualisasi geospasial DAS Wanggu dan arsitektur LoRaWAN secara real-time.
          </p>
        </div>

        {/* Global Connection Status HUD */}
        <div className={cn(
          "flex items-center gap-3 px-4 py-2.5 rounded-xl border shadow-sm",
          mqttStatus === 'ONLINE' ? "bg-[var(--ews-aman-bg)] border-[#BBF7D0] text-[var(--ews-aman)]" :
          mqttStatus === 'CONNECTING' ? "bg-[var(--ews-waspada-bg)] border-[#FDE68A] text-[var(--ews-waspada)]" :
          "bg-[var(--ews-awas-bg)] border-[#FECACA] text-[var(--ews-awas)]"
        )}>
          {mqttStatus === 'ONLINE' ? <Activity size={16} className="animate-pulse" /> : <WifiOff size={16} />}
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-widest opacity-80 font-bold font-[family-name:var(--font-jetbrains)]">Uplink Status</span>
            <span className="text-xs font-bold font-[family-name:var(--font-jetbrains)]">
              {mqttStatus === 'ONLINE' ? 'EMQX SECURE WSS' : 
               mqttStatus === 'CONNECTING' ? 'HANDSHAKE...' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </div>

      {/* ── GRID LAYER UTAMA ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* KOLOM KIRI: SPASIAL & CROSS SECTION (Span 2) */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          
          {/* GIS Map Panel */}
          <div className="card flex flex-col h-[400px] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--surface-card)] shrink-0">
              <span className="text-[11px] font-bold tracking-widest uppercase text-[var(--text-primary)] flex items-center gap-2">
                <Crosshair size={14} className="text-[var(--brand-600)]" /> Geospatial Radar Overlay
              </span>
              <span className="badge neutral">Leaflet.js</span>
            </div>
            <div className="flex-1 relative z-0">
              <GISMap hardwareStatus={hardwareDisplayStatus} />
              
              {/* Warning Overlay if No Hardware */}
              {isAwaitingHardware && (
                <div className="absolute inset-0 z-[1000] flex items-center justify-center pointer-events-none bg-[var(--surface-overlay)] backdrop-blur-sm">
                  <div className="border border-[#FECACA] bg-[var(--ews-awas-bg)] px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-pulse">
                    <ShieldAlert className="text-[var(--ews-awas)]" size={20} />
                    <span className="text-[var(--ews-awas)] font-bold tracking-widest text-xs uppercase font-[family-name:var(--font-jetbrains)]">Menunggu Sinyal Hardware...</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Cross Section Panel */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-[var(--brand-600)]" />
                <span className="text-[11px] font-bold tracking-widest uppercase text-[var(--text-primary)]">
                  Analisis Penampang Melintang Sungai
                </span>
              </div>
            </div>
            
            <div className="relative w-full h-[220px] bg-[var(--surface-inset)] rounded-xl border border-[var(--border-subtle)] overflow-hidden">
              {/* Grid Background */}
              <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(var(--border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)', backgroundSize: '20px 20px', opacity: 0.5 }}></div>
              
              <svg viewBox="0 0 500 200" className="w-full h-full relative z-10" preserveAspectRatio="none">
                {/* Ruler Lines (Y-Axis) */}
                {[0, 1, 2, 3, 4, 5].map((val, idx) => (
                  <g key={idx}>
                    <line x1="40" y1={180 - (val * 30)} x2="480" y2={180 - (val * 30)} stroke="var(--border-default)" strokeWidth="1" strokeDasharray="2,4" />
                    <text x="10" y={183 - (val * 30)} fill="var(--text-muted)" fontSize="10" fontFamily="monospace">{val}.0m</text>
                  </g>
                ))}

                {/* Siaga 1 Red Line */}
                <line x1="40" y1={180 - (3.5 * 30)} x2="480" y2={180 - (3.5 * 30)} stroke="var(--ews-awas)" strokeWidth="1.5" strokeDasharray="4,4" />
                <text x="360" y={180 - (3.5 * 30) - 6} fill="var(--ews-awas)" fontSize="9" fontWeight="bold" className="animate-pulse">Batas Kritis (3.5m)</text>

                {/* Dynamic Water Block */}
                <rect 
                  x="80" 
                  y={180 - (waterLvl * 30)} 
                  width="340" 
                  height={waterLvl * 30} 
                  fill="var(--brand-500)" 
                  fillOpacity="0.2"
                  className="transition-all duration-1000 ease-in-out"
                />
                
                {/* Top of water line */}
                {waterLvl > 0 && (
                  <line 
                    x1="80" y1={180 - (waterLvl * 30)} 
                    x2="420" y2={180 - (waterLvl * 30)} 
                    stroke="var(--brand-500)" strokeWidth="2" 
                  />
                )}

                {/* Retaining Wall Structure (Tanggul) */}
                <polyline points="40,20 80,30 120,180 380,180 420,30 480,20" fill="none" stroke="var(--text-secondary)" strokeWidth="3" strokeLinejoin="round" />
                <circle cx="80" cy="30" r="4" fill="var(--brand-600)" />
                <circle cx="420" cy="30" r="4" fill="var(--brand-600)" />

                {/* Submerged Sensor (QDY30A) */}
                <g transform="translate(130, 175)">
                  <rect x="-6" y="-12" width="12" height="14" fill={isAwaitingHardware ? "var(--text-disabled)" : "var(--brand-600)"} rx="2" />
                  <line x1="0" y1="-12" x2="-20" y2="-50" stroke="var(--brand-600)" strokeWidth="1.5" strokeDasharray="2,2" />
                  <text x="-28" y="-55" fill="var(--text-secondary)" fontSize="9" fontWeight="bold">QDY30A</text>
                </g>

                {/* Ultrasonic Sensor Beam (A02YYUW) */}
                <g transform="translate(250, 10)">
                  <rect x="-10" y="0" width="20" height="8" fill={isAwaitingHardware ? "var(--text-disabled)" : "#8b5cf6"} rx="2" />
                  <line x1="0" y1="8" x2="0" y2={180 - (waterLvl * 30)} stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="4,4" className={isAwaitingHardware ? "hidden" : "animate-pulse"} />
                  <text x="15" y="8" fill="var(--text-secondary)" fontSize="9" fontWeight="bold">A02YYUW BEAM</text>
                </g>
              </svg>

              {/* Data Readout */}
              <div className="absolute top-4 right-6 text-right bg-[var(--surface-card)] px-4 py-2 rounded-xl border border-[var(--border-subtle)] shadow-sm">
                <span className="text-[9px] text-[var(--text-muted)] font-bold tracking-widest uppercase block mb-1">Live Depth</span>
                <span className={cn("text-3xl font-bold font-[family-name:var(--font-jetbrains)]", isCritical ? "text-[var(--ews-awas)]" : "text-[var(--brand-600)]")}>
                  {waterLvl.toFixed(2)}<span className="text-sm text-[var(--text-muted)] ml-1">m</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: LORAWAN NETWORK MESH (Span 1) */}
        <div className="flex flex-col gap-6">
          
          {/* Topology Card */}
          <div className="card p-5 flex-1 flex flex-col">
            <div className="flex items-center gap-2 mb-6 border-b border-[var(--border-subtle)] pb-4">
              <Network size={16} className="text-[var(--brand-600)]" />
              <span className="text-[11px] font-bold tracking-widest uppercase text-[var(--text-primary)]">
                Arsitektur LoRaWAN
              </span>
            </div>

            <div className="relative flex flex-col gap-4 flex-1">
              {/* Connecting Line */}
              <div className="absolute left-[27px] top-8 bottom-8 w-[2px] bg-[var(--border-subtle)] z-0"></div>

              {/* Node 1: Field Node */}
              <div className="relative z-10 flex gap-4 items-start bg-[var(--surface-card)] border border-[var(--border-subtle)] p-3 rounded-xl hover:border-[var(--brand-300)] transition-colors shadow-sm">
                <div className="w-12 h-12 rounded-lg bg-[var(--brand-50)] border border-[var(--brand-100)] flex items-center justify-center shrink-0">
                  <Cpu size={20} className="text-[var(--brand-600)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold text-[var(--text-primary)] mb-2 uppercase tracking-wide">ESP32 Field Node</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-[var(--surface-inset)] rounded px-2 py-1.5 border border-[var(--border-subtle)]">
                      <div className="text-[9px] text-[var(--text-muted)] mb-0.5 font-bold uppercase">VBAT</div>
                      <div className={cn("text-[10px] font-[family-name:var(--font-jetbrains)] font-bold", telemetry.vbat < 11 && !isAwaitingHardware ? "text-[var(--ews-awas)]" : "text-[var(--text-primary)]")}>
                        {isAwaitingHardware ? '--' : `${telemetry.vbat.toFixed(1)} V`}
                      </div>
                    </div>
                    <div className="bg-[var(--surface-inset)] rounded px-2 py-1.5 border border-[var(--border-subtle)]">
                      <div className="text-[9px] text-[var(--text-muted)] mb-0.5 font-bold uppercase">Status</div>
                      <div className={cn("text-[10px] font-[family-name:var(--font-jetbrains)] font-bold", isAwaitingHardware ? "text-[var(--text-disabled)]" : "text-[var(--ews-aman)]")}>
                        {isAwaitingHardware ? 'STANDBY' : 'TX_ACTIVE'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Node 2: Gateway */}
              <div className="relative z-10 flex gap-4 items-start bg-[var(--surface-card)] border border-[var(--border-subtle)] p-3 rounded-xl hover:border-[var(--brand-300)] transition-colors shadow-sm mt-2">
                <div className="w-12 h-12 rounded-lg bg-[var(--surface-inset)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0">
                  <Radio size={20} className="text-[var(--text-secondary)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold text-[var(--text-primary)] mb-2 uppercase tracking-wide flex items-center justify-between">
                    Gateway (BWS IV)
                    <Wifi size={12} className="text-[var(--ews-aman)]" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className="bg-[var(--surface-inset)] rounded px-2 py-1.5 border border-[var(--border-subtle)]">
                      <div className="text-[9px] text-[var(--text-muted)] mb-0.5 font-bold uppercase">RSSI</div>
                      <div className="text-[10px] font-[family-name:var(--font-jetbrains)] font-bold text-[var(--text-primary)]">
                        {isAwaitingHardware ? '--' : `${telemetry.rssi} dBm`}
                      </div>
                    </div>
                    <div className="bg-[var(--surface-inset)] rounded px-2 py-1.5 border border-[var(--border-subtle)]">
                      <div className="text-[9px] text-[var(--text-muted)] mb-0.5 font-bold uppercase">SNR</div>
                      <div className="text-[10px] font-[family-name:var(--font-jetbrains)] font-bold text-[var(--text-primary)]">
                        {isAwaitingHardware ? '--' : `${telemetry.snr} dB`}
                      </div>
                    </div>
                  </div>
                  <div className="text-[9px] font-[family-name:var(--font-jetbrains)] text-[var(--text-muted)] flex items-center gap-1 font-semibold">
                    <CheckCircle2 size={10} className="text-[var(--ews-aman)]"/> Freq: 921.4 MHz (AS923)
                  </div>
                </div>
              </div>

              {/* Node 3: Cloud Broker */}
              <div className="relative z-10 flex gap-4 items-start bg-[var(--surface-card)] border border-[var(--border-subtle)] p-3 rounded-xl hover:border-[var(--brand-300)] transition-colors shadow-sm mt-2">
                <div className="w-12 h-12 rounded-lg bg-[var(--brand-50)] border border-[var(--brand-100)] flex items-center justify-center shrink-0">
                  <Server size={20} className="text-[var(--brand-600)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold text-[var(--text-primary)] mb-2 uppercase tracking-wide">EMQX Cloud Broker</div>
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center bg-[var(--surface-inset)] px-2 py-1 rounded border border-[var(--border-subtle)]">
                      <span className="text-[9px] text-[var(--text-muted)] font-bold uppercase">Protocol</span>
                      <span className="text-[10px] font-bold text-[var(--text-primary)] font-[family-name:var(--font-jetbrains)]">MQTT WSS</span>
                    </div>
                    <div className="flex justify-between items-center bg-[var(--surface-inset)] px-2 py-1 rounded border border-[var(--border-subtle)]">
                      <span className="text-[9px] text-[var(--text-muted)] font-bold uppercase">Socket</span>
                      <span className={cn("text-[10px] font-bold font-[family-name:var(--font-jetbrains)]", mqttStatus === 'ONLINE' ? "text-[var(--ews-aman)]" : "text-[var(--ews-awas)]")}>
                        {mqttStatus}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* System Logs Console */}
          <div className="card p-0 overflow-hidden flex flex-col h-[180px] bg-[#0A0A0A] border-[var(--border-subtle)]">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#27272A] bg-[#18181B]">
              <TerminalSquare size={14} className="text-gray-400" />
              <span className="text-[10px] font-bold tracking-widest uppercase text-gray-300">
                Diagnostic Console
              </span>
            </div>
            <div className="p-4 flex-1 overflow-y-auto font-[family-name:var(--font-jetbrains)] text-[11px] leading-relaxed flex flex-col gap-1.5 scrollbar-hide">
              {logs.map((log, i) => (
                <div key={i} className="flex gap-2 break-all">
                  <span className="text-gray-500 shrink-0">[{log.time}]</span>
                  <span className={
                    log.type === 'error' ? 'text-red-400' :
                    log.type === 'success' ? 'text-green-400' :
                    log.type === 'warn' ? 'text-amber-400' : 'text-gray-300'
                  }>
                    {log.msg}
                  </span>
                </div>
              ))}
              <div ref={logEndRef} className="h-1 flex items-center">
                <span className="w-2 h-3 bg-gray-400 animate-pulse inline-block"></span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}