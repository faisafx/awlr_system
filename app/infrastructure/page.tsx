// ─────────────────────────────────────────────────────────────────────────────
// File: app/infrastructure/page.tsx
// Description: Unified Infrastructure & Telemetry Hub
// Features: Hardware Registry (BMN), LoRaWAN/NOC Metrics, Remote Calibration.
// ─────────────────────────────────────────────────────────────────────────────

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cpu, 
  Radio, 
  SlidersHorizontal, 
  AlertTriangle, 
  CheckCircle2, 
  Terminal,
  Activity,
  Send
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── 1. Mock Data (Siap diganti dengan fetch dari PostgreSQL/API) ─────────────

const ASSETS = [
  {
    id: 'BMN-AWLR-WGG01-001',
    name: 'Hydrostatic Pressure Transducer',
    type: 'QDY30A (0-3.3V)',
    health: 82,
    uptime: '10,680 Jam',
    calibrationDue: 14,
    status: 'warning',
  },
  {
    id: 'BMN-AWLR-WGG01-002',
    name: 'Waterproof Ultrasonic',
    type: 'A02YYUW (Serial UART)',
    health: 95,
    uptime: '10,680 Jam',
    calibrationDue: 182,
    status: 'optimal',
  },
  {
    id: 'BMN-AWLR-WGG01-003',
    name: 'Tipping Bucket Ombrometer',
    type: 'RG-3M Stainless',
    health: 74,
    uptime: '10,680 Jam',
    calibrationDue: 45,
    status: 'warning',
  },
  {
    id: 'BMN-AWLR-CORE-001',
    name: 'Main Processing Unit MCU',
    type: 'ESP32-WROOM-32E Dev Carrier',
    health: 98,
    uptime: '2,140 Jam',
    calibrationDue: 365,
    status: 'optimal',
  },
];

// ── 2. Komponen Utama Halaman ────────────────────────────────────────────────

export default function InfrastructurePage() {
  const [activeTab, setActiveTab] = useState<'registry' | 'network' | 'calibration'>('registry');

  return (
    <div className="flex flex-col gap-6 h-full text-slate-200">
      
      {/* ── Header Section ────────────────────────────────────────────────── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-cyan-900/40 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Cpu className="text-cyan-400" />
            INFRASTRUCTURE <span className="text-slate-500 font-light">| SYS.OP</span>
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1 uppercase tracking-widest">
            Operator: Faisal F. // Node: Sungai Wanggu // Status: <span className="text-teal-400">Online</span>
          </p>
        </div>

        {/* Tactical Tabs */}
        <div className="flex bg-[#020617]/50 p-1 rounded-md border border-cyan-900/30">
          <TabButton 
            active={activeTab === 'registry'} 
            onClick={() => setActiveTab('registry')} 
            icon={Cpu} 
            label="ASSET REGISTRY" 
          />
          <TabButton 
            active={activeTab === 'network'} 
            onClick={() => setActiveTab('network')} 
            icon={Radio} 
            label="NETWORK NOC" 
          />
          <TabButton 
            active={activeTab === 'calibration'} 
            onClick={() => setActiveTab('calibration')} 
            icon={SlidersHorizontal} 
            label="CALIBRATION" 
          />
        </div>
      </header>

      {/* ── Content Area (Animated Transition) ────────────────────────────── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: HARDWARE REGISTRY */}
          {activeTab === 'registry' && (
            <motion.div
              key="registry"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 xl:grid-cols-2 gap-4"
            >
              {ASSETS.map((asset) => (
                <div key={asset.id} className="bg-[#040A18]/60 border border-cyan-900/30 rounded-lg p-5 relative group hover:border-cyan-500/50 transition-colors">
                  {/* Corner Brackets */}
                  <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500/50 rounded-tl pointer-events-none" />
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500/50 rounded-br pointer-events-none" />

                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-cyan-50">{asset.name}</h3>
                      <p className="text-xs font-mono text-cyan-500 mt-0.5">{asset.id}</p>
                    </div>
                    {asset.status === 'optimal' ? (
                      <CheckCircle2 className="text-teal-500 w-5 h-5" />
                    ) : (
                      <AlertTriangle className="text-rose-500 w-5 h-5 animate-pulse" />
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-[#020617] p-2 rounded border border-white/5">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Spesifikasi</span>
                      <span className="text-xs font-mono text-slate-300">{asset.type}</span>
                    </div>
                    <div className="bg-[#020617] p-2 rounded border border-white/5">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Durasi Aktif</span>
                      <span className="text-xs font-mono text-slate-300">{asset.uptime}</span>
                    </div>
                  </div>

                  {/* Health Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-mono font-bold uppercase">
                      <span className="text-slate-400">Health Index</span>
                      <span className={asset.health > 80 ? 'text-teal-400' : 'text-rose-400'}>{asset.health}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${asset.health}%` }}
                        className={cn("h-full", asset.health > 80 ? "bg-teal-500" : "bg-rose-500")}
                      />
                    </div>
                    <p className="text-[10px] font-mono text-right mt-1 text-slate-500">
                      Jatuh Tempo Kalibrasi: <span className={asset.calibrationDue < 30 ? 'text-rose-400' : 'text-slate-300'}>{asset.calibrationDue} Hari</span>
                    </p>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* TAB 2: NETWORK NOC */}
          {activeTab === 'network' && (
            <motion.div
              key="network"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-4"
            >
              {/* Telemetry Stats */}
              <div className="lg:col-span-1 space-y-4">
                <div className="bg-[#040A18]/60 border border-cyan-900/30 rounded-lg p-5">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Activity size={14} className="text-cyan-400" />
                    RF Diagnostics
                  </h3>
                  <div className="space-y-4">
                    <MetricRow label="RSSI (Signal Strength)" value="-85 dBm" status="good" />
                    <MetricRow label="SNR (Signal to Noise)" value="7.2 dB" status="good" />
                    <MetricRow label="Spreading Factor" value="SF9" status="neutral" />
                    <MetricRow label="Packet Loss" value="0.02%" status="good" />
                  </div>
                </div>
                
                <div className="bg-teal-950/20 border border-teal-900/50 rounded-lg p-4 flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-teal-500 animate-ping shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-teal-400">MQTT Broker: EMQX</h4>
                    <p className="text-[10px] font-mono text-teal-500/70">WSS:// port 8084 • Connected</p>
                  </div>
                </div>
              </div>

              {/* Terminal Raw Hex */}
              <div className="lg:col-span-2 bg-[#020617] border border-cyan-900/30 rounded-lg p-1 flex flex-col">
                <div className="bg-[#040A18] px-4 py-2 border-b border-cyan-900/30 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-cyan-500 flex items-center gap-2">
                    <Terminal size={12} /> LIVE PAYLOAD STREAM (HEX)
                  </span>
                  <span className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500/50"></span>
                    <span className="w-2 h-2 rounded-full bg-amber-500/50"></span>
                    <span className="w-2 h-2 rounded-full bg-teal-500/50"></span>
                  </span>
                </div>
                <div className="flex-1 p-4 font-mono text-[11px] text-slate-400 overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#020617] z-10 pointer-events-none" />
                  {/* Mock scrolling text */}
                  <div className="space-y-1 animate-[pulse_4s_ease-in-out_infinite]">
                    <p><span className="text-cyan-700">[14:02:01]</span> RX: 0A 14 00 5A 33 01 F4 ... <span className="text-teal-500">ACK</span></p>
                    <p><span className="text-cyan-700">[14:02:05]</span> RX: 0A 14 00 5A 33 01 F5 ... <span className="text-teal-500">ACK</span></p>
                    <p><span className="text-cyan-700">[14:02:10]</span> RX: 0B 12 01 4B 22 00 E1 ... <span className="text-amber-500">RETRY</span></p>
                    <p><span className="text-cyan-700">[14:02:12]</span> RX: 0A 14 00 5A 33 01 F6 ... <span className="text-teal-500">ACK</span></p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: CALIBRATION */}
          {activeTab === 'calibration' && (
            <motion.div
              key="calibration"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-[#040A18]/80 border border-cyan-900/50 rounded-lg p-6 relative overflow-hidden">
                {/* Background Tech Accent */}
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-cyan-900/10 rounded-full blur-3xl pointer-events-none" />

                <div className="mb-6">
                  <h2 className="text-lg font-bold text-cyan-50">Remote Parameter Injection</h2>
                  <p className="text-xs text-slate-400 mt-1">Suntikkan variabel kalibrasi secara real-time ke memori ESP32 via MQTT.</p>
                </div>

                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <InputGroup label="ADC Offset (QDY30A)" defaultValue="0.045" unit="V" />
                    <InputGroup label="Voltage Multiplier" defaultValue="3.3" unit="x" />
                  </div>
                  
                  <InputGroup label="Water Density (Massa Jenis)" defaultValue="1000" unit="kg/m³" />
                  
                  <div className="pt-4 border-t border-white/5 flex justify-end">
                    <button className="flex items-center gap-2 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/50 px-5 py-2.5 rounded font-mono text-xs uppercase tracking-wider transition-all focus:ring-2 focus:ring-cyan-500 focus:outline-none">
                      <Send size={14} /> Inject Payload
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

// ── 3. Komponen Pendukung (Micro-components) ─────────────────────────────────

function TabButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded text-[10px] font-mono font-bold tracking-widest transition-all",
        active 
          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.2)]" 
          : "text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent"
      )}
    >
      <Icon size={14} />
      <span className="hidden sm:inline-block">{label}</span>
    </button>
  );
}

function MetricRow({ label, value, status }: { label: string, value: string, status: 'good' | 'warning' | 'neutral' }) {
  return (
    <div className="flex justify-between items-center border-b border-white/5 pb-2">
      <span className="text-xs font-mono text-slate-400">{label}</span>
      <span className={cn(
        "text-sm font-mono font-bold",
        status === 'good' ? "text-teal-400" : status === 'warning' ? "text-rose-400" : "text-cyan-400"
      )}>
        {value}
      </span>
    </div>
  );
}

function InputGroup({ label, defaultValue, unit }: { label: string, defaultValue: string, unit: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{label}</label>
      <div className="relative">
        <input 
          type="text" 
          defaultValue={defaultValue}
          className="w-full bg-[#020617] border border-cyan-900/50 rounded px-3 py-2 text-sm text-cyan-50 font-mono focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition-all"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500">{unit}</span>
      </div>
    </div>
  );
}