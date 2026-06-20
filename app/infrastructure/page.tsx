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
  TerminalSquare,
  Activity,
  Send,
  Server,
  DatabaseZap
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
    type: 'ESP32-S3 WROOM',
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
    <div className="flex flex-col gap-6 h-full">
      
      {/* ── Header Section ────────────────────────────────────────────────── */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <h1 className="text-[20px] font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-2">
            <Server className="text-[var(--brand-600)]" size={24} />
            Perangkat & Jaringan
          </h1>
          <p className="text-[12px] text-[var(--text-muted)] mt-1 font-medium flex items-center gap-2">
            Operator: Faisal F. <span className="text-[var(--border-default)]">|</span> Node: Sungai Wanggu 
            <span className="flex items-center gap-1.5 ml-2 bg-[var(--ews-aman-bg)] text-[var(--ews-aman)] border border-[#BBF7D0] px-2 py-0.5 rounded-full text-[10px] font-bold font-[family-name:var(--font-jetbrains)] uppercase tracking-wider">
              <span className="w-1.5 h-1.5 bg-[var(--ews-aman)] rounded-full animate-pulse"></span>
              Online
            </span>
          </p>
        </div>

        {/* Enterprise Tabs */}
        <div className="flex bg-[var(--surface-inset)] p-1.5 rounded-xl border border-[var(--border-subtle)]">
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
      <div className="flex-1 relative">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: HARDWARE REGISTRY */}
          {activeTab === 'registry' && (
            <motion.div
              key="registry"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 xl:grid-cols-2 gap-4"
            >
              {ASSETS.map((asset) => (
                <div key={asset.id} className="card p-5 group hover:border-[var(--brand-300)] transition-colors">
                  
                  <div className="flex justify-between items-start mb-5">
                    <div>
                      <h3 className="font-bold text-[14px] text-[var(--text-primary)]">{asset.name}</h3>
                      <p className="text-[11px] font-[family-name:var(--font-jetbrains)] font-medium text-[var(--brand-600)] mt-1">{asset.id}</p>
                    </div>
                    <div className={cn(
                      "p-2 rounded-lg border",
                      asset.status === 'optimal' ? "bg-[var(--ews-aman-bg)] border-[#BBF7D0]" : "bg-[var(--ews-waspada-bg)] border-[#FDE68A]"
                    )}>
                      {asset.status === 'optimal' ? (
                        <CheckCircle2 size={18} className="text-[var(--ews-aman)]" />
                      ) : (
                        <AlertTriangle size={18} className="text-[var(--ews-waspada)]" />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="bg-[var(--surface-inset)] p-3 rounded-lg border border-[var(--border-subtle)]">
                      <span className="text-[9px] text-[var(--text-muted)] uppercase font-bold tracking-widest block mb-1">Spesifikasi</span>
                      <span className="text-[11px] font-[family-name:var(--font-jetbrains)] text-[var(--text-primary)] font-medium">{asset.type}</span>
                    </div>
                    <div className="bg-[var(--surface-inset)] p-3 rounded-lg border border-[var(--border-subtle)]">
                      <span className="text-[9px] text-[var(--text-muted)] uppercase font-bold tracking-widest block mb-1">Durasi Aktif</span>
                      <span className="text-[11px] font-[family-name:var(--font-jetbrains)] text-[var(--text-primary)] font-medium">{asset.uptime}</span>
                    </div>
                  </div>

                  {/* Health Bar */}
                  <div className="space-y-2 pt-4 border-t border-[var(--border-subtle)]">
                    <div className="flex justify-between text-[10px] font-[family-name:var(--font-jetbrains)] font-bold uppercase">
                      <span className="text-[var(--text-muted)]">Health Index</span>
                      <span className={asset.health > 80 ? 'text-[var(--ews-aman)]' : 'text-[var(--ews-waspada)]'}>{asset.health}%</span>
                    </div>
                    <div className="w-full h-2 bg-[var(--surface-inset)] rounded-full overflow-hidden border border-[var(--border-subtle)]">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${asset.health}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className={cn("h-full", asset.health > 80 ? "bg-[var(--ews-aman)]" : "bg-[var(--ews-waspada)]")}
                      />
                    </div>
                    <p className="text-[10px] font-medium text-right text-[var(--text-secondary)] mt-2">
                      Jatuh Tempo Kalibrasi: <span className={cn("font-bold font-[family-name:var(--font-jetbrains)]", asset.calibrationDue < 30 ? 'text-[var(--ews-awas)]' : 'text-[var(--text-primary)]')}>{asset.calibrationDue} Hari</span>
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
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Telemetry Stats */}
              <div className="lg:col-span-1 flex flex-col gap-4">
                <div className="card p-5">
                  <h3 className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-widest mb-5 flex items-center gap-2 border-b border-[var(--border-subtle)] pb-3">
                    <Activity size={16} className="text-[var(--brand-600)]" />
                    RF Diagnostics
                  </h3>
                  <div className="space-y-4">
                    <MetricRow label="RSSI (Signal Strength)" value="-85 dBm" status="good" />
                    <MetricRow label="SNR (Signal to Noise)" value="7.2 dB" status="good" />
                    <MetricRow label="Spreading Factor" value="SF9" status="neutral" />
                    <MetricRow label="Packet Loss" value="0.02%" status="good" />
                  </div>
                </div>
                
                <div className="bg-[var(--brand-50)] border border-[var(--brand-100)] rounded-xl p-4 flex items-center gap-4 shadow-sm">
                  <div className="w-10 h-10 rounded-lg bg-[var(--surface-card)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0 shadow-sm">
                    <DatabaseZap size={20} className="text-[var(--brand-600)]" />
                  </div>
                  <div>
                    <h4 className="text-[12px] font-bold text-[var(--brand-700)]">MQTT Broker: EMQX</h4>
                    <p className="text-[10px] font-mono text-[var(--brand-600)] mt-0.5">WSS:// port 8084 • Connected</p>
                  </div>
                </div>
              </div>

              {/* Terminal Raw Hex */}
              <div className="lg:col-span-2 card p-0 overflow-hidden flex flex-col h-[320px] bg-[#0A0A0A] border-[var(--border-subtle)]">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#27272A] bg-[#18181B]">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-gray-300 flex items-center gap-2">
                    <TerminalSquare size={14} className="text-gray-400" /> LIVE PAYLOAD STREAM (HEX)
                  </span>
                  <span className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/80"></span>
                  </span>
                </div>
                <div className="flex-1 p-5 font-[family-name:var(--font-jetbrains)] text-[12px] leading-loose text-gray-400 overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0A0A0A] z-10 pointer-events-none" />
                  {/* Mock scrolling text */}
                  <div className="space-y-1.5 animate-[pulse_4s_ease-in-out_infinite]">
                    <p><span className="text-cyan-600">[{new Date().toLocaleTimeString()}]</span> RX: 0A 14 00 5A 33 01 F4 ... <span className="text-green-500 font-bold">ACK</span></p>
                    <p><span className="text-cyan-600">[{new Date().toLocaleTimeString()}]</span> RX: 0A 14 00 5A 33 01 F5 ... <span className="text-green-500 font-bold">ACK</span></p>
                    <p><span className="text-cyan-600">[{new Date().toLocaleTimeString()}]</span> RX: 0B 12 01 4B 22 00 E1 ... <span className="text-amber-500 font-bold">RETRY</span></p>
                    <p><span className="text-cyan-600">[{new Date().toLocaleTimeString()}]</span> RX: 0A 14 00 5A 33 01 F6 ... <span className="text-green-500 font-bold">ACK</span></p>
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
              transition={{ duration: 0.2 }}
              className="max-w-2xl mx-auto pt-4"
            >
              <div className="card p-8 relative overflow-hidden">
                {/* Clean geometric accent */}
                <div className="absolute right-0 top-0 w-32 h-32 bg-[var(--brand-50)] rounded-bl-full pointer-events-none opacity-50" />

                <div className="mb-8 relative z-10">
                  <h2 className="text-[18px] font-bold text-[var(--text-primary)]">Remote Parameter Injection</h2>
                  <p className="text-[12px] text-[var(--text-secondary)] mt-1.5 font-medium leading-relaxed">
                    Suntikkan variabel kalibrasi secara real-time ke memori ESP32 via MQTT. <br/>Perubahan ini akan langsung mempengaruhi algoritma pembacaan sensor lapangan.
                  </p>
                </div>

                <div className="space-y-6 relative z-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <InputGroup label="ADC Offset (QDY30A)" defaultValue="0.045" unit="V" />
                    <InputGroup label="Voltage Multiplier" defaultValue="3.3" unit="x" />
                  </div>
                  
                  <InputGroup label="Water Density (Massa Jenis)" defaultValue="1000" unit="kg/m³" />
                  
                  <div className="pt-6 mt-2 border-t border-[var(--border-subtle)] flex justify-end">
                    <button className="flex items-center gap-2 bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white px-6 py-2.5 rounded-lg font-bold text-[12px] tracking-wide transition-all shadow-md focus:ring-2 focus:ring-offset-2 focus:ring-[var(--brand-500)] focus:outline-none">
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
        "flex items-center gap-2 px-5 py-2.5 rounded-lg text-[11px] font-bold tracking-widest uppercase transition-all",
        active 
          ? "bg-[var(--surface-card)] text-[var(--brand-700)] shadow-sm border border-[var(--border-subtle)]" 
          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-bg)] border border-transparent"
      )}
    >
      <Icon size={14} />
      <span className="hidden sm:inline-block">{label}</span>
    </button>
  );
}

function MetricRow({ label, value, status }: { label: string, value: string, status: 'good' | 'warning' | 'neutral' }) {
  return (
    <div className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-2.5">
      <span className="text-[11px] font-medium text-[var(--text-secondary)]">{label}</span>
      <span className={cn(
        "text-[12px] font-bold font-[family-name:var(--font-jetbrains)]",
        status === 'good' ? "text-[var(--ews-aman)]" : status === 'warning' ? "text-[var(--ews-awas)]" : "text-[var(--text-primary)]"
      )}>
        {value}
      </span>
    </div>
  );
}

function InputGroup({ label, defaultValue, unit }: { label: string, defaultValue: string, unit: string }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">{label}</label>
      <div className="relative">
        <input 
          type="text" 
          defaultValue={defaultValue}
          className="w-full bg-[var(--surface-bg)] border border-[var(--border-default)] rounded-lg px-4 py-2.5 text-[13px] text-[var(--text-primary)] font-[family-name:var(--font-jetbrains)] focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-500)] focus:outline-none transition-all"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-bold font-[family-name:var(--font-jetbrains)] text-[var(--text-muted)] bg-[var(--surface-inset)] px-2 py-0.5 rounded border border-[var(--border-subtle)]">{unit}</span>
      </div>
    </div>
  );
}