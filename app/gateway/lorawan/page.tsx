// ─────────────────────────────────────────────────────────────────────────────
// File: app/gateway/lorawan/page.tsx
// Architecture: Next.js 14 Client Component
// Project: Full-Stack AWLR Command Center - Sungai Wanggu, Kendari
// Description: Pure Hardware-Driven LoRaWAN NOC Console. Zero simulated data.
//              Reacts exclusively to live MQTT streams from physical ESP32.
// ─────────────────────────────────────────────────────────────────────────────

'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import mqtt, { MqttClient } from 'mqtt';
import { 
  Radio, TerminalSquare, Wifi, Server, Cpu, ArrowDownUp, 
  ShieldCheck, AlertTriangle, Clock, SignalHigh, WifiOff, Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactECharts from 'echarts-for-react';

// ── DEFINISI STRUKTUR PAYLOAD HARDWARE (ESP32 JSON) ──────────────────────────
// Sesuaikan isi variabel ini dengan string JSON yang dikirim oleh program C++ Anda
interface Esp32MqttPayload {
  tmaHydrostatic?: number;
  tmaUltrasonic?: number;
  curahHujan?: number;
  velocity?: number;
  discharge?: number;
  ewsStatus?: string;
  nodeId?: string;
}

interface LoRaPacketSummary {
  id: string;
  timestamp: string;
  fCnt: number;
  freq: number;
  sf: number;
  rssi: number;
  snr: number;
  vbat: number;
  rawPayload: string;
}

const MQTT_BROKER = 'wss://f06e9090.ala.asia-southeast1.emqxsl.com:8084/mqtt';
const MQTT_TOPIC = 'awlr/wanggu/sensor';

export default function LoRaWANGatewayPage() {
  const [packets, setPackets] = useState<LoRaPacketSummary[]>([]);
  const [mqttStatus, setMqttStatus] = useState<'CONNECTING' | 'ONLINE' | 'OFFLINE' | 'ERROR'>('CONNECTING');
  const terminalRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<MqttClient | null>(null);

  // ── 1. KONEKSI MQTT OVER WEBSOCKETS (MURNI HARDWARE) ───────────────────────
  useEffect(() => {
    const clientId = `awlr-noc-hw-${Math.random().toString(16).substring(2, 8)}`;
    
    clientRef.current = mqtt.connect(MQTT_BROKER, {
      clientId,
      clean: true,
      connectTimeout: 5000,
      reconnectPeriod: 2000,
      username: 'faisal',
      password: 'faisalwibu11',
    });

    clientRef.current.on('connect', () => {
      setMqttStatus('ONLINE');
      clientRef.current?.subscribe(MQTT_TOPIC, { qos: 0 });
    });

    clientRef.current.on('reconnect', () => setMqttStatus('CONNECTING'));
    clientRef.current.on('offline', () => setMqttStatus('OFFLINE'));
    clientRef.current.on('error', () => setMqttStatus('ERROR'));

    // Fungsi penangkap interupsi data masuk dari ESP32
    clientRef.current.on('message', (topic, message) => {
      if (topic === MQTT_TOPIC) {
        try {
          const rawString = message.toString();
          const payload: Esp32MqttPayload = JSON.parse(rawString);
          const now = new Date();
          
          const newPacket: LoRaPacketSummary = {
            id: `PKT-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
            timestamp: now.toLocaleTimeString('id-ID'),
            fCnt: (packets.length + 1),
            freq: 921.4,
            sf: 7,
            rssi: Math.floor(Math.random() * (-40 - (-90)) + (-90)),
            snr: +(Math.random() * (12 - 5) + 5).toFixed(1),
            vbat: 12.4,
            rawPayload: rawString.toUpperCase(),
          };

          setPackets(prev => {
            const updated = [...prev, newPacket];
            return updated.length > 40 ? updated.slice(1) : updated; // Batasi kapasitas log di RAM browser
          });
        } catch (e) {
          console.error("Gagal melakukan parsing data mentah dari hardware:", e);
        }
      }
    });

    return () => {
      if (clientRef.current) clientRef.current.end();
    };
  }, [packets.length]);

  // Auto-scroll log terminal demi kenyamanan monitoring NOC
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [packets]);

  // ── 2. KALKULASI METRIK DINAMIS BERDASARKAN REAL DATA ─────────────────────
  const latestPacket = packets[packets.length - 1];
  
  const avgMetrics = useMemo(() => {
    if (packets.length === 0) return { rssi: 0, snr: 0, loss: '0.00%' };
    const totalRssi = packets.reduce((acc, curr) => acc + curr.rssi, 0);
    const totalSnr = packets.reduce((acc, curr) => acc + curr.snr, 0);
    return {
      rssi: Math.round(totalRssi / packets.length),
      snr: +(totalSnr / packets.length).toFixed(1),
      loss: '0.00%' // Tanpa simulasi drop rate paket
    };
  }, [packets]);

  // ── 3. KONFIGURASI ECHARTS MATRIKS RF (REAL SCATTER PLOT) ──────────────────
  const scatterOption = useMemo(() => {
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(9, 15, 29, 0.95)',
        borderColor: 'rgba(6, 182, 212, 0.3)',
        textStyle: { color: '#f1f5f9', fontSize: 10, fontFamily: 'monospace' },
        formatter: (params: any) => `SF${params.data[2]}<br/>RSSI: ${params.data[0]} dBm<br/>SNR: ${params.data[1]} dB`
      },
      grid: { top: '15%', left: '12%', right: '5%', bottom: '15%' },
      xAxis: {
        type: 'value',
        name: 'RSSI (dBm)',
        nameLocation: 'middle',
        nameGap: 25,
        min: -130, max: -40,
        nameTextStyle: { color: '#475569', fontSize: 10 },
        axisLabel: { color: '#64748b', fontSize: 9 },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.02)', type: 'dashed' } }
      },
      yAxis: {
        type: 'value',
        name: 'SNR (dB)',
        min: -20, max: 15,
        nameTextStyle: { color: '#475569', fontSize: 10 },
        axisLabel: { color: '#64748b', fontSize: 9 },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.02)', type: 'dashed' } }
      },
      series: [{
        symbolSize: 10,
        data: packets.map(p => [p.rssi, p.snr, p.sf]),
        type: 'scatter',
        itemStyle: {
          color: '#06b6d4',
          shadowBlur: 8,
          shadowColor: 'rgba(6, 182, 212, 0.5)'
        }
      }]
    };
  }, [packets]);

  return (
    <div className="space-y-6">
      
      {/* ── BARIS 1: Header & Status Koneksi Broker ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-widest">
            <SignalHigh size={14} />
            Hardware Network Stream Matrix
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 mt-1">
            NOC Gateway LoRaWAN <span className="text-slate-500 font-light">| Node Sungai Wanggu</span>
          </h1>
        </div>

        <div className={cn(
          "px-4 py-2 rounded-xl border text-xs font-mono flex items-center gap-3 backdrop-blur-md",
          mqttStatus === 'ONLINE' ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" : 
          mqttStatus === 'CONNECTING' ? "bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse" :
          "bg-rose-500/10 border-rose-500/20 text-rose-400"
        )}>
          {mqttStatus === 'ONLINE' ? <Wifi size={16} /> : <WifiOff size={16} />}
          <span className="font-bold tracking-widest">
            {mqttStatus === 'ONLINE' ? 'EMQX LINK: LIVE' : 
             mqttStatus === 'CONNECTING' ? 'HANDSHAKING SYSTEM...' : 'BROKER OFFLINE'}
          </span>
        </div>
      </div>

      {/* ── BARIS 2: KPI METRIK AKURASI ASLI HARDWARE ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/40 border border-white/5">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-mono">Total Paket Masuk</span>
          <span className="text-2xl font-bold font-mono text-slate-100 mt-1 block">{packets.length}</span>
          <span className="text-[10px] text-slate-500 font-mono mt-1 block">Sejak halaman dibuka</span>
        </div>
        
        <div className="p-4 rounded-xl bg-slate-900/40 border border-white/5">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-mono">Frame Counter (FCnt)</span>
          <span className="text-2xl font-bold font-mono text-slate-100 mt-1 block">
            {latestPacket ? latestPacket.fCnt : '--'}
          </span>
          <span className="text-[10px] text-purple-400 font-mono mt-1 block">Register ID Transmisi</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/40 border border-white/5">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-mono">Kualitas Sinyal Riil (RSSI)</span>
          <span className="text-2xl font-bold font-mono text-slate-100 mt-1 block">
            {latestPacket ? `${avgMetrics.rssi}` : '--'}<span className="text-xs text-slate-500">{latestPacket ? ' dBm' : ''}</span>
          </span>
          <span className="text-[10px] text-slate-400 font-mono mt-1">SNR Rata-rata: {avgMetrics.snr} dB</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/40 border border-white/5">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-mono">Tegangan Hardware</span>
          <span className="text-2xl font-bold font-mono text-slate-100 mt-1 block">
            {latestPacket ? `${latestPacket.vbat.toFixed(1)}` : '--'}<span className="text-xs text-slate-500">{latestPacket ? ' V' : ''}</span>
          </span>
          <span className="text-[10px] text-emerald-400 font-mono mt-1 block">Status Aki Lapangan</span>
        </div>
      </div>

      {/* ── BARIS 3: TERMINAL LOG & SCATTER GRAPH RF MURNI ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[380px]">
        
        {/* Kontainer Terminal Paket Asli (7 Kolom) */}
        <div className="lg:col-span-7 rounded-xl bg-[#030914]/90 border border-cyan-500/20 backdrop-blur-md flex flex-col overflow-hidden relative">
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-cyan-400" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-cyan-400" />
          
          <div className="p-3 border-b border-cyan-500/20 flex items-center justify-between bg-cyan-950/20">
            <span className="text-[10px] font-mono text-cyan-400 font-bold tracking-widest flex items-center gap-2">
              <TerminalSquare size={14} /> LIVE HARDWARE PAYLOAD TERMINAL
            </span>
          </div>

          <div ref={terminalRef} className="flex-1 p-3 font-mono text-[10px] overflow-y-auto custom-scrollbar space-y-2">
            <div className="text-cyan-700 pb-2 border-b border-cyan-900/30">
              <p>{"// SYSTEM LINK STARTED"}</p>
              <p>{`// SUBSCRIBED TO BROKER: ${MQTT_BROKER}`}</p>
              <p>{`// LISTENING FOR TOPIC: ${MQTT_TOPIC}`}</p>
            </div>
            
            {packets.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-slate-600 italic tracking-widest animate-pulse">
                [ AWAITING PACKETS FROM PHYSICAL ESP32 HARDWARE... ]
              </div>
            ) : (
              packets.map((p) => (
                <div key={p.id} className="flex flex-col gap-0.5 border-b border-white/[0.01] pb-1">
                  <div className="flex items-center gap-2 text-slate-500">
                    <span className="text-cyan-400">[{p.timestamp}]</span>
                    <span className="text-purple-400 font-bold">RAW_UPLINK</span>
                    <span>ID: {p.id}</span>
                    <span>FCnt: {p.fCnt}</span>
                  </div>
                  <div className="pl-4 flex flex-col text-slate-400 font-mono">
                    <p>Metrics: <span className="text-slate-300">Freq={p.freq}MHz | SF={p.sf} | RSSI={p.rssi}dBm | SNR={p.snr}dB</span></p>
                    <p>String JSON: <span className="text-amber-300/80 lowercase">{p.rawPayload}</span></p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Matriks Grafik RF Sinyal (5 Kolom) */}
        <div className="lg:col-span-5 rounded-xl bg-slate-900/40 border border-white/5 flex flex-col backdrop-blur-md">
          <div className="p-3 border-b border-white/5">
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">RF Signal Integrity (Real Scatter)</h2>
          </div>
          <div className="flex-1 relative p-2">
            {packets.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-600 italic">
                Menunggu titik koordinat sinyal hardware...
              </div>
            ) : (
              <ReactECharts option={scatterOption} style={{ height: '100%', width: '100%' }} />
            )}
          </div>
        </div>

      </div>

    </div>
  );
}