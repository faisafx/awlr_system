'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  WifiOff,
  Activity,
  MapPin,
  ChevronRight,
  Sparkles,
  Send,
  Bot,
  X,
  Lightbulb,
  Siren,
  Waves, // Tambahan Icon Debit Air
  Fan,   // Tambahan Icon Flowmeter
} from 'lucide-react';
import { cn } from '@/lib/utils';

// â”€â”€ Dynamic Imports â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const Spinner = ({ label }: { label: string }) => (
  <div className="h-full w-full flex flex-col items-center justify-center gap-3">
    <div
      className="w-7 h-7 rounded-full border-2 animate-spin"
      style={{ borderColor: 'var(--border-default)', borderTopColor: 'var(--brand-500)' }}
    />
    <span style={{ fontSize: '10px', fontFamily: 'var(--font-jetbrains), monospace', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
      {label}
    </span>
  </div>
);

const StationVisualizer = dynamic(() => import('@/components/3d/StationVisualizer'), {
  ssr: false,
  loading: () => <Spinner label="Memuat topografi 3D..." />,
});

const TelemetryChart = dynamic(() => import('@/components/charts/TelemetryChart'), {
  ssr: false,
  loading: () => <Spinner label="Menginisialisasi hidrograf..." />,
});

const GISMap = dynamic(() => import('@/components/map/GISMap'), {
  ssr: false,
  loading: () => <Spinner label="Menghubungkan radar BMKG..." />,
});

// â”€â”€ Types & Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface TelemetryState {
  tmaHydrostatic: number;
  tmaUltrasonic: number;
  deviation: number;
  rainRate: number;
  flowRate1: number; // Tambahan Wide Table
  flowRate2: number; // Tambahan Wide Table
  velocity: number; // Tambahan Wide Table
  discharge: number; // Tambahan Wide Table
  batteryVoltage: number;
  solarCurrent: number;
  loraRssi: number;
  ewsStatus: 'AMAN' | 'WASPADA' | 'SIAGA' | 'AWAS';
  relay1Siren: boolean;
  relay2Alarm: boolean;
}

interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
}

const MQTT_BROKER = 'wss://f06e9090.ala.asia-southeast1.emqxsl.com:8084/mqtt';
const MQTT_TOPIC = 'awlr/wanggu/sensor';

const EWS_CONFIG = {
  AMAN: { label: 'Siaga IV â€” Aman', color: 'var(--ews-aman)', bg: 'var(--ews-aman-bg)', border: '#BBF7D0', dotBg: '#BBF7D0' },
  WASPADA: { label: 'Siaga III â€” Waspada', color: 'var(--ews-waspada)', bg: 'var(--ews-waspada-bg)', border: '#FDE68A', dotBg: '#FDE68A' },
  SIAGA: { label: 'Siaga II â€” Siaga', color: 'var(--ews-siaga)', bg: 'var(--ews-siaga-bg)', border: '#FDBA74', dotBg: '#FDBA74' },
  AWAS: { label: 'Siaga I â€” Awas', color: 'var(--ews-awas)', bg: 'var(--ews-awas-bg)', border: '#FECACA', dotBg: '#FECACA' },
} as const;

const EWS_LEVELS = ['AMAN', 'WASPADA', 'SIAGA', 'AWAS'] as const;

// â”€â”€ Primitive Components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="section-header">
      <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)' }}>
        {children}
      </span>
    </div>
  );
}

function PanelHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-3 md:px-4 py-3 border-b border-[var(--border-subtle)] shrink-0 gap-2">
      <div className="flex flex-col gap-0.5 overflow-hidden">
        <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--text-primary)] truncate">
          {title}
        </span>
        <span className="text-[9px] md:text-[10px] font-[family-name:var(--font-jetbrains)] text-[var(--text-muted)] truncate hidden sm:block">
          {subtitle}
        </span>
      </div>
      <div className="shrink-0">
        {action}
      </div>
    </div>
  );
}

// â”€â”€ EWS Flood Gauge â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function FloodGaugeBar({ status }: { status: keyof typeof EWS_CONFIG }) {
  const activeIdx = EWS_LEVELS.indexOf(status);
  const colorMap: Record<string, string> = {
    AMAN: 'var(--ews-aman)', WASPADA: 'var(--ews-waspada)',
    SIAGA: 'var(--ews-siaga)', AWAS: 'var(--ews-awas)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ height: '6px', borderRadius: '99px', background: 'var(--surface-inset)', overflow: 'hidden', display: 'flex', gap: '2px' }}>
        {EWS_LEVELS.map((lvl, i) => (
          <div
            key={lvl}
            style={{
              flex: 1,
              height: '100%',
              borderRadius: '99px',
              background: i <= activeIdx ? colorMap[lvl] : 'transparent',
              opacity: i <= activeIdx ? 1 : 0.2,
              transition: 'all 0.6s var(--ease-standard)',
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {EWS_LEVELS.map((lvl, i) => (
          <span
            key={lvl}
            style={{
              fontSize: '9px',
              fontFamily: 'var(--font-jetbrains), monospace',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: i <= activeIdx ? colorMap[lvl] : 'var(--text-disabled)',
              transition: 'color 0.5s',
            }}
          >
            {lvl}
          </span>
        ))}
      </div>
    </div>
  );
}

// â”€â”€ KPI Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function KpiCard({
  label, value, unit, icon: Icon, accentColor,
  statusDot, statusLabel, statusColor, children,
}: {
  label: string; value: string; unit: string;
  icon: React.ElementType; accentColor: string;
  statusDot: 'ok' | 'warn' | 'error' | 'idle';
  statusLabel: string; statusColor: string;
  children?: React.ReactNode;
}) {
  const dotColors = { ok: 'var(--ews-aman)', warn: 'var(--ews-waspada)', error: 'var(--ews-awas)', idle: 'var(--text-disabled)' };

  return (
    <div className="metric-card group" style={{ cursor: 'default' }}>
      <div
        style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: '3px', borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
          background: `linear-gradient(90deg, ${accentColor}, transparent)`,
          opacity: 0, transition: 'opacity var(--duration-base)',
        }}
        className="group-hover:!opacity-100"
      />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', lineHeight: 1.4, paddingRight: '8px' }}>
          {label}
        </span>
        <div
          style={{
            width: '30px', height: '30px', borderRadius: 'var(--radius-md)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            background: `${accentColor}14`, border: `1px solid ${accentColor}28`,
          }}
        >
          <Icon size={14} style={{ color: accentColor }} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '10px' }}>
        <span className="sensor-value">{value}</span>
        <span style={{ fontSize: '11px', fontFamily: 'var(--font-jetbrains), monospace', color: 'var(--text-muted)', paddingBottom: '2px' }}>
          {unit}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: dotColors[statusDot], flexShrink: 0, display: 'inline-block' }} />
        <span style={{ fontSize: '10px', fontFamily: 'var(--font-jetbrains), monospace', color: statusColor }}>
          {statusLabel}
        </span>
      </div>

      {children && (
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
          {children}
        </div>
      )}
    </div>
  );
}

const WaterLevelWidget = ({ value, max, label, color, unit }: any) => {
  const percentage = Math.min((value / max) * 100, 100);
  return (
    <div className="card group" style={{ display: 'flex', gap: '16px', padding: '20px', background: 'var(--surface-card)', position: 'relative', overflow: 'hidden', alignItems: 'center' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, ${color}, transparent)`, opacity: 0.8, transition: 'opacity var(--duration-base)' }} className="group-hover:opacity-100" />
      <div style={{ width: '32px', height: '80px', borderRadius: '16px', background: 'var(--surface-inset)', border: '1px solid var(--border-subtle)', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${percentage}%`, background: `linear-gradient(180deg, ${color}, ${color}40)`, transition: 'height 1s ease-out' }} />
        <div style={{ position: 'absolute', bottom: `${percentage}%`, left: 0, right: 0, height: '2px', background: '#fff', opacity: 0.5 }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)' }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '6px' }}>
          <span style={{ fontSize: '26px', fontWeight: 800, fontFamily: 'var(--font-jetbrains), monospace', color: 'var(--text-primary)', lineHeight: 1 }}>{value.toFixed(2)}</span>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>{unit}</span>
        </div>
        <span style={{ fontSize: '9px', color: 'var(--text-disabled)', marginTop: '6px', fontFamily: 'var(--font-jetbrains), monospace' }}>{percentage.toFixed(0)}% LEVEL</span>
      </div>
    </div>
  );
};

const WaveCard = ({ value, label, color, unit }: any) => {
  return (
    <div className="card group" style={{ display: 'flex', flexDirection: 'column', padding: '24px 20px', background: 'var(--surface-card)', position: 'relative', overflow: 'hidden', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, ${color}, transparent)`, opacity: 0.8, transition: 'opacity var(--duration-base)' }} className="group-hover:opacity-100" />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, opacity: 0.15, transform: 'scaleY(1.5)', transformOrigin: 'bottom' }}>
        <svg viewBox="0 0 100 25" preserveAspectRatio="none" style={{ width: '100%', height: '40px' }}>
          <path d="M0,25 C20,15 30,5 50,15 C70,25 80,5 100,15 L100,25 Z" fill={color} />
          <path d="M0,25 C30,10 40,20 60,10 C80,0 90,15 100,15 L100,25 Z" fill={color} opacity="0.5" />
        </svg>
      </div>
      <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', position: 'relative', zIndex: 10 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '12px', position: 'relative', zIndex: 10 }}>
        <span style={{ fontSize: '32px', fontWeight: 800, fontFamily: 'var(--font-jetbrains), monospace', color: 'var(--text-primary)', lineHeight: 1 }}>{value.toFixed(2)}</span>
        <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>{unit}</span>
      </div>
    </div>
  );
};

const GaugeWidget = ({ value, max, label, color, unit }: any) => {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(value / max, 1);
  const offset = circumference - percentage * circumference;

  return (
    <div className="card group" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', background: 'var(--surface-card)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, ${color}, transparent)`, opacity: 0.8, transition: 'opacity var(--duration-base)' }} className="group-hover:opacity-100" />
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <svg width="70" height="70" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="35" cy="35" r={radius} stroke="var(--surface-inset)" strokeWidth="6" fill="none" />
          <circle cx="35" cy="35" r={radius} stroke={color} strokeWidth="6" strokeDasharray={circumference} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 1s ease-out', filter: `drop-shadow(0 0 4px ${color}60)` }} fill="none" strokeLinecap="round" />
        </svg>
        <Fan size={18} className={value > 0 ? 'animate-spin' : ''} style={{ position: 'absolute', top: '26px', color: color, opacity: 0.8, animationDuration: '3s' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)' }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '6px' }}>
          <span style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-jetbrains), monospace', color: 'var(--text-primary)', lineHeight: 1 }}>{value.toFixed(1)}</span>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>{unit}</span>
        </div>
      </div>
    </div>
  );
};

// -- AI Assist Panel --

interface AiMessageWithTime extends AiMessage {
  timestamp?: string;
}

function AiAssistPanel({ telemetry, ewsLabel, ewsStatus }: { telemetry: TelemetryState; ewsLabel: string; ewsStatus: string }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<AiMessageWithTime[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-2.0-flash');
  const bottomRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const prevTmaRef = useRef<number>(telemetry.tmaHydrostatic);
  const [tmaTrend, setTmaTrend] = useState<'naik' | 'turun' | 'stabil'>('stabil');

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const prev = prevTmaRef.current;
    const curr = telemetry.tmaHydrostatic;
    const diff = curr - prev;
    if (Math.abs(diff) > 0.005) setTmaTrend(diff > 0 ? 'naik' : 'turun');
    else setTmaTrend('stabil');
    prevTmaRef.current = curr;
  }, [telemetry.tmaHydrostatic]);

  const now = new Date().toLocaleString('id-ID', { weekday: 'long', hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'long', year: 'numeric' });
  const batteryStatus = telemetry.batteryVoltage < 11.5 ? 'KRITIS' : telemetry.batteryVoltage < 12.0 ? 'RENDAH' : 'NORMAL';

  const SYSTEM_PROMPT = `Kamu adalah TERAWANG, asisten hidrologi cerdas milik Balai Wilayah Sungai Sulawesi IV untuk Pos WGG-01 Sungai Wanggu, Kendari.

=== IDENTITAS ===
- Nama: TERAWANG (Telemetri Real-time Analisis Wanggu Nusantara)
- Gaya: Santai dan sedikit humoris saat AMAN, tapi langsung serius saat EWS WASPADA ke atas.
- Bahasa: Indonesia campuran formal dan gaul yang elegan.
- Saat SIAGA/AWAS: TIDAK boleh bercanda. Respons harus SINGKAT, ACTIONABLE.

=== PROFIL STASIUN ===
- Stasiun: Pos WGG-01 Sungai Wanggu | Kode BMN: BMN-AWLR-WGG01
- Koordinat: -4.0175 S, 122.5152 E | DAS Wanggu, Kota Kendari | DTA: ~124 km persegi
- Instansi: BBWS Sulawesi IV / Ditjen SDA PUPR
- Waktu saat ini: ${now}

=== TELEMETRI REAL-TIME ===
- TMA Ultrasonik   : ${telemetry.tmaUltrasonic.toFixed(3)} m
- TMA Hidrostatik  : ${telemetry.tmaHydrostatic.toFixed(3)} m (sensor utama)
- Deviasi Sensor   : ${telemetry.deviation.toFixed(3)} m ${telemetry.deviation > 0.15 ? '-- DEVIASI TINGGI! Kemungkinan sensor kotor/rusak.' : '(Normal)'}
- Trend TMA        : ${tmaTrend.toUpperCase()}
- Debit Sungai     : ${telemetry.discharge.toFixed(3)} m3 per detik
- Kecepatan Arus   : ${telemetry.velocity.toFixed(3)} m/s ${telemetry.velocity > 1.5 ? '-- Arus deras!' : ''}
- Curah Hujan      : ${telemetry.rainRate.toFixed(1)} mm/jam ${telemetry.rainRate > 50 ? '(EKSTREM)' : telemetry.rainRate > 20 ? '(Lebat)' : ''}
- Flowmeter 1/2    : ${telemetry.flowRate1.toFixed(1)} / ${telemetry.flowRate2.toFixed(1)} L/menit
- Baterai          : ${telemetry.batteryVoltage.toFixed(1)} V -- Status: ${batteryStatus}
- Relay Sirene     : ${telemetry.relay1Siren ? 'AKTIF' : 'Standby'}
- Relay Alarm      : ${telemetry.relay2Alarm ? 'AKTIF' : 'Standby'}

=== STATUS EWS: ${ewsStatus} -- ${ewsLabel} ===

=== AMBANG BATAS EWS (STANDAR PUPR) ===
Siaga IV AMAN     : TMA < 2.00 m
Siaga III WASPADA : TMA >= 2.00 m -- Pantau ketat
Siaga II SIAGA    : TMA >= 2.80 m -- Siapkan evakuasi
Siaga I AWAS      : TMA >= 3.50 m -- EVAKUASI SEGERA

=== INSTRUKSI PERILAKU ===
Status saat ini adalah ${ewsStatus}:
${ewsStatus === 'AMAN' ? 'Mode NORMAL: Boleh santai dan sedikit bercanda. Berikan analisis mendalam dan edukatif.' : ewsStatus === 'WASPADA' ? 'Mode WASPADA: Serius tapi tenang. Berikan estimasi kenaikan TMA. Tidak bercanda.' : ewsStatus === 'SIAGA' ? 'Mode SIAGA: Darurat terkendali. Langkah konkret evakuasi. Respons padat dan actionable.' : 'Mode DARURAT TOTAL: Respons singkat dan tegas. Hanya info penting penyelamat jiwa.'}

=== FORMAT ===
- Gunakan bold (**teks**) untuk angka dan istilah penting
- Gunakan bullet list untuk rekomendasi
- Selalu akhiri dengan satu rekomendasi tindakan utama
- Panjang: AMAN=bebas, WASPADA=max 200 kata, SIAGA/AWAS=max 100 kata

=== KEMAMPUAN KHUSUS ===
Jika operator meminta kirim WA, sertakan tag: [KIRIM_WA: isi pesan]`;

  async function send() {
    const q = input.trim();
    if (!q || loading) return;
    setInput('');
    const ts = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const next: AiMessageWithTime[] = [...messages, { role: 'user', content: q, timestamp: ts }];
    setMessages(next);
    setLoading(true);
    try {
      const res = await fetch('/api/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemPrompt: SYSTEM_PROMPT, messages: next, selectedModel }),
      });
      const data = await res.json();
      const aiTs = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      setMessages([...next, { role: 'assistant', content: data.content ?? 'Gagal mendapat respons.', timestamp: aiTs }]);
    } catch {
      setMessages([...next, { role: 'assistant', content: 'Koneksi ke AI gagal. Periksa koneksi internet.', timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) }]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const quickPrompts: { label: string; q: string }[] = ewsStatus === 'AWAS' ? [
    { label: 'Kirim WA Darurat Sekarang', q: 'Buat dan kirim pesan peringatan darurat banjir ke WhatsApp warga sekarang!' },
    { label: 'Berapa Waktu Tersisa?', q: 'Berapa lama lagi sebelum air masuk ke permukiman berdasarkan data saat ini?' },
    { label: 'Protokol Evakuasi Darurat', q: 'Apa langkah evakuasi darurat yang harus diambil sekarang?' },
  ] : ewsStatus === 'SIAGA' ? [
    { label: 'Analisis Risiko Banjir', q: 'Analisis risiko banjir saat ini, apakah kemungkinan naik ke status AWAS?' },
    { label: 'Buat Notifikasi Warga', q: 'Bantu buat pesan peringatan untuk dikirim ke warga sekitar sungai.' },
    { label: 'Proyeksi Level TMA', q: 'Berdasarkan curah hujan dan trend TMA, kapan bisa capai ambang AWAS?' },
  ] : ewsStatus === 'WASPADA' ? [
    { label: 'Analisis Trend TMA', q: 'Apakah air cenderung terus naik? Estimasi waktu ke level SIAGA?' },
    { label: 'Dampak Curah Hujan', q: 'Berapa besar dampak curah hujan saat ini terhadap kenaikan TMA?' },
    { label: 'Cek Deviasi Sensor', q: `Deviasi sensor saat ini ${telemetry.deviation.toFixed(3)} m. Apakah ini wajar atau ada masalah?` },
  ] : [
    { label: 'Analisis Kondisi Sungai', q: 'Analisis korelasi debit air dan TMA saat ini. Apakah semua normal?' },
    { label: 'Estimasi Waktu Banjir', q: 'Berdasarkan curah hujan saat ini, estimasi waktu sebelum luapan jika hujan tidak berhenti?' },
    { label: 'Cek Kesehatan Sistem', q: `Baterai ${telemetry.batteryVoltage.toFixed(1)}V, deviasi sensor ${telemetry.deviation.toFixed(3)}m. Apakah sistem dalam kondisi sehat?` },
  ];

  const ewsColors: Record<string, { ring: string; badge: string; bg: string; text: string }> = {
    AMAN:    { ring: 'rgba(74,222,128,0.5)',  badge: '#4ADE80', bg: 'var(--ews-aman-bg)',    text: 'var(--ews-aman)' },
    WASPADA: { ring: 'rgba(251,191,36,0.5)',  badge: '#FBBF24', bg: 'var(--ews-waspada-bg)', text: 'var(--ews-waspada)' },
    SIAGA:   { ring: 'rgba(251,146,60,0.5)',  badge: '#FB923C', bg: 'var(--ews-siaga-bg)',   text: 'var(--ews-siaga)' },
    AWAS:    { ring: 'rgba(248,113,113,0.6)', badge: '#F87171', bg: 'var(--ews-awas-bg)',    text: 'var(--ews-awas)' },
  };
  const ec = ewsColors[ewsStatus] ?? ewsColors.AMAN;

  if (!mounted) return null;

  return createPortal(
    <>
      {/* Floating Button with EWS Pulse */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-[84px] right-4 md:bottom-8 md:right-8 w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center cursor-pointer z-[9999]"
        style={{
          background: 'var(--brand-600)', color: 'white', border: 'none',
          transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          transform: open ? 'scale(0.9) rotate(15deg)' : 'scale(1) rotate(0deg)',
          animation: (ewsStatus === 'AWAS' || ewsStatus === 'SIAGA') && !open ? 'ewsPulse 1.8s ease-out infinite' : 'none',
          boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
        }}
        aria-label="Tanya AI Hidrologi"
      >
        {open ? <ChevronRight size={28} style={{ transform: 'rotate(90deg)' }} /> : <Sparkles size={28} />}
      </button>

      {/* Floating Chat Window */}
      <div
        className="fixed bottom-[148px] right-4 md:bottom-[108px] md:right-8 w-[calc(100vw-32px)] md:w-[400px] h-[calc(100dvh-170px)] md:h-[570px] max-h-[600px] rounded-2xl flex flex-col z-[9998] overflow-hidden"
        style={{
          background: 'var(--surface-card)', border: '1px solid var(--border-subtle)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
          opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none',
          transform: open ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
          transformOrigin: 'bottom right',
          transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '13px 16px', background: 'linear-gradient(135deg, rgba(37,99,235,0.95) 0%, rgba(30,58,138,0.9) 100%)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.2)', flexShrink: 0 }}>
              <Bot size={18} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '-0.01em' }}>TERAWANG AI</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#4ADE80', boxShadow: '0 0 6px rgba(74,222,128,0.7)', animation: 'pulse 2s infinite', flexShrink: 0 }} />
                <span style={{ fontSize: '8px', fontWeight: 700, opacity: 0.85, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Online</span>
                <span style={{ fontSize: '8px', fontWeight: 700, color: ec.badge, background: 'rgba(0,0,0,0.2)', padding: '1px 6px', borderRadius: '99px', border: `1px solid ${ec.badge}40`, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{ewsStatus}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <button onClick={() => setMessages([])} title="Reset chat" style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <RefreshCw size={13} />
            </button>
            <button onClick={() => setOpen(false)} style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <X size={14} />
            </button>
          </div>
        </div>

        {/* EWS Banner */}
        {ewsStatus !== 'AMAN' && (
          <div style={{ padding: '7px 16px', background: ec.bg, borderBottom: `1px solid ${ec.ring}`, display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <ShieldAlert size={12} style={{ color: ec.text, flexShrink: 0 }} />
            <span style={{ fontSize: '10px', fontWeight: 700, color: ec.text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {ewsStatus === 'AWAS' ? 'KONDISI DARURAT — TMA melebihi ambang AWAS!' : ewsStatus === 'SIAGA' ? 'SIAGA AKTIF — TMA mendekati batas kritis!' : 'STATUS WASPADA — Pantau perkembangan TMA!'}
            </span>
          </div>
        )}

        {/* Chat Body */}
        <div className="scrollbar-hide" style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', background: 'var(--surface-bg)' }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '8px 0', marginTop: 'auto', marginBottom: 'auto' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'var(--surface-inset)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', border: '1px solid var(--border-subtle)' }}>
                <Sparkles size={24} style={{ color: 'var(--brand-500)' }} />
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: '16px' }}>
                Halo! Saya <strong style={{ color: 'var(--text-primary)' }}>TERAWANG</strong> — Asisten Hidrologi Pos WGG-01.<br/>
                Saya memahami konteks telemetri dan EWS secara real-time!
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                {quickPrompts.map(({ label, q }) => (
                  <button key={label} onClick={() => setInput(q)} style={{ fontSize: '11px', padding: '9px 14px', borderRadius: '12px', cursor: 'pointer', background: 'var(--surface-card)', color: 'var(--brand-500)', border: '1px solid var(--border-subtle)', fontFamily: 'inherit', textAlign: 'left', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-inset)'; e.currentTarget.style.borderColor = 'var(--brand-300)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-card)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: m.role === 'user' ? 'row-reverse' : 'row', gap: '10px', alignItems: 'flex-end' }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: m.role === 'user' ? 'var(--brand-600)' : 'var(--surface-inset)', border: '1px solid var(--border-subtle)', marginBottom: '16px' }}>
                {m.role === 'user' ? <span style={{ fontSize: '9px', color: 'white', fontWeight: 800 }}>OP</span> : <Bot size={13} style={{ color: 'var(--text-secondary)' }} />}
              </div>
              <div style={{ maxWidth: '78%' }}>
                <div style={{ padding: '10px 14px', borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: m.role === 'user' ? 'var(--brand-600)' : 'var(--surface-card)', border: '1px solid', borderColor: m.role === 'user' ? 'transparent' : 'var(--border-subtle)', fontSize: '12px', lineHeight: 1.65, color: m.role === 'user' ? 'white' : 'var(--text-primary)', whiteSpace: 'pre-wrap', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  {m.content}
                </div>
                {m.timestamp && <div style={{ fontSize: '9px', color: 'var(--text-disabled)', marginTop: '3px', textAlign: m.role === 'user' ? 'right' : 'left', fontFamily: 'var(--font-jetbrains), monospace' }}>{m.timestamp}</div>}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-inset)', border: '1px solid var(--border-subtle)', marginBottom: '16px' }}>
                <Bot size={13} style={{ color: 'var(--text-secondary)' }} />
              </div>
              <div style={{ padding: '10px 16px', background: 'var(--surface-card)', borderRadius: '16px 16px 16px 4px', border: '1px solid var(--border-subtle)', display: 'flex', gap: '5px' }}>
                {[0, 1, 2].map(i => <div key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--text-disabled)', animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />)}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input Area */}
        <div style={{ padding: '10px 14px 12px', background: 'var(--surface-card)', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
          {/* Model Selector (Kiri Bawah) */}
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)} style={{ background: 'var(--surface-inset)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontSize: '10px', fontWeight: 600, padding: '4px 22px 4px 10px', borderRadius: '8px', outline: 'none', cursor: 'pointer', fontFamily: 'var(--font-jetbrains), monospace', appearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23888888\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', backgroundSize: '10px' }}>
              <option value="gemini-2.0-flash">⚡ Gemini Flash 2.0</option>
              <option value="gemini-flash-latest">🚀 Gemini Flash</option>
              <option value="gemini-1.5-pro">🧠 Gemini Pro</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder={ewsStatus !== 'AMAN' ? `Status ${ewsStatus} — Tanya TERAWANG...` : 'Tulis pesan ke TERAWANG AI...'} rows={1} style={{ flex: 1, resize: 'none', border: `1px solid ${ewsStatus !== 'AMAN' ? ec.ring : 'var(--border-default)'}`, borderRadius: '18px', padding: '9px 14px', fontSize: '12px', lineHeight: 1.5, fontFamily: 'inherit', color: 'var(--text-primary)', background: 'var(--surface-inset)', outline: 'none', overflowY: 'hidden', minHeight: '38px', maxHeight: '110px' }} onFocus={e => { e.target.style.borderColor = 'var(--brand-500)'; e.target.style.background = 'var(--surface-bg)'; }} onBlur={e => { e.target.style.borderColor = ewsStatus !== 'AMAN' ? ec.ring : 'var(--border-default)'; e.target.style.background = 'var(--surface-inset)'; }} />
            <button onClick={send} disabled={loading || !input.trim()} style={{ width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: loading || !input.trim() ? 'var(--surface-inset)' : 'var(--brand-600)', border: 'none', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', flexShrink: 0, transition: 'all 0.2s', boxShadow: loading || !input.trim() ? 'none' : '0 4px 12px rgba(37,99,235,0.35)' }}>
              <Send size={15} style={{ color: loading || !input.trim() ? 'var(--text-disabled)' : 'white', marginLeft: '2px' }} />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-4px); opacity: 1; }
        }
        @keyframes ewsPulse {
          0%   { box-shadow: 0 8px 32px rgba(0,0,0,0.35), 0 0 0 0 rgba(248,113,113,0.6); }
          60%  { box-shadow: 0 8px 32px rgba(0,0,0,0.35), 0 0 0 14px rgba(0,0,0,0); }
          100% { box-shadow: 0 8px 32px rgba(0,0,0,0.35), 0 0 0 0 rgba(0,0,0,0); }
        }
      `}</style>
    </>,
    document.body
  );
}

// â”€â”€ Main Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function CommandCenter() {
  const [data, setData] = useState<TelemetryState>({
    tmaHydrostatic: 0.00,
    tmaUltrasonic: 0.00,
    deviation: 0.00,
    rainRate: 0.0,
    flowRate1: 0.0,
    flowRate2: 0.0,
    velocity: 0.0,
    discharge: 0.0,
    batteryVoltage: 12.6,
    solarCurrent: 1.45,
    loraRssi: -68,
    ewsStatus: 'AMAN',
    relay1Siren: false,
    relay2Alarm: false,
  });

  const [lastUpdated, setLastUpdated] = useState<string>('Menunggu data...');
  const [connectionStatus, setConnectionStatus] = useState<'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR'>('CONNECTING');
  const clientRef = useRef<MqttClient | null>(null);

  useEffect(() => {
    const storedBroker = localStorage.getItem('mqtt_broker') || MQTT_BROKER;
    const storedTopic = localStorage.getItem('mqtt_topic') || MQTT_TOPIC;
    const storedUser = localStorage.getItem('mqtt_user') || 'faisal';
    const storedPass = localStorage.getItem('mqtt_pass') || 'faisalwibu11';

    const clientId = `awlr-web-${Math.random().toString(16).substring(2, 8)}`;
    clientRef.current = mqtt.connect(storedBroker, {
      clientId,
      username: storedUser,
      password: storedPass,
      clean: true,
      connectTimeout: 5000,
      reconnectPeriod: 2000,
    });

    clientRef.current.on('connect', () => { setConnectionStatus('CONNECTED'); clientRef.current?.subscribe(storedTopic, { qos: 0 }); });
    clientRef.current.on('reconnect', () => setConnectionStatus('CONNECTING'));
    clientRef.current.on('error', () => setConnectionStatus('ERROR'));
    clientRef.current.on('offline', () => setConnectionStatus('DISCONNECTED'));

    clientRef.current.on('message', (topic, message) => {
      if (topic !== storedTopic) return;
      try {
        const payload = JSON.parse(message.toString());
        setData(prev => {
          const next = { ...prev };

          // PENYESUAIAN WIDE TABLE PATTERN
          // Semua properti dari ESP32 langsung di-mapping tanpa filter 'parameter'
          if (payload.tmaUltrasonic !== undefined) next.tmaUltrasonic = Number(payload.tmaUltrasonic);
          if (payload.tmaHydrostatic !== undefined) next.tmaHydrostatic = Number(payload.tmaHydrostatic);
          if (payload.curahHujan !== undefined) next.rainRate = Number(payload.curahHujan);
          if (payload.flowRate1 !== undefined) next.flowRate1 = Number(payload.flowRate1);
          if (payload.flowRate2 !== undefined) next.flowRate2 = Number(payload.flowRate2);
          if (payload.velocity !== undefined) next.velocity = Number(payload.velocity);
          if (payload.discharge !== undefined) next.discharge = Number(payload.discharge);
          if (payload.ewsStatus) next.ewsStatus = payload.ewsStatus;

          if (payload.relay1Siren !== undefined) next.relay1Siren = Boolean(payload.relay1Siren);
          if (payload.relay2Alarm !== undefined) next.relay2Alarm = Boolean(payload.relay2Alarm);

          next.deviation = Number(Math.abs(next.tmaHydrostatic - next.tmaUltrasonic).toFixed(2));
          return next;
        });
        setLastUpdated(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      } catch (e) {
        console.error('Gagal parsing JSON dari ESP32:', e);
      }
    });

    return () => { clientRef.current?.end(); };
  }, []);

  // â”€â”€ WHATSAPP INTEGRATION â”€â”€
  const dataRef = useRef(data);
  const lastEwsRef = useRef(data.ewsStatus);

  // Update ref to avoid stale closure in setInterval
  useEffect(() => { dataRef.current = data; }, [data]);

  // 1. Instant Trigger for SIAGA / AWAS
  useEffect(() => {
    if ((data.ewsStatus === 'SIAGA' || data.ewsStatus === 'AWAS') && data.ewsStatus !== lastEwsRef.current) {
      lastEwsRef.current = data.ewsStatus;
      fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `ðŸš¨ *PERINGATAN DINI BANJIR: ${data.ewsStatus}* ðŸš¨\n\nLokasi: Pos WGG-01 Sungai Wanggu\nTinggi Air: ${data.tmaHydrostatic.toFixed(2)} m\nDebit: ${data.discharge.toFixed(2)} mÂ³/s\nCurah Hujan: ${data.rainRate.toFixed(1)} mm/jam\n\nâš ï¸ Harap warga di sekitar segera waspada dan mengambil tindakan pengamanan!`
        })
      }).catch(err => console.error("Gagal kirim darurat WA", err));
    } else if (data.ewsStatus !== lastEwsRef.current) {
      lastEwsRef.current = data.ewsStatus; // Update ref when status drops back to AMAN
    }
  }, [data.ewsStatus, data.tmaHydrostatic, data.discharge, data.rainRate]);

  // 2. Periodic Broadcast (Every 30 Minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      const current = dataRef.current;
      fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `ðŸ“Š *UPDATE TELEMETRI TERAWANG*\nPos WGG-01 Sungai Wanggu\nðŸ•’ Waktu: ${new Date().toLocaleString('id-ID')}\n\nðŸŒŠ TMA: ${current.tmaHydrostatic.toFixed(2)} m\nðŸ’§ Debit: ${current.discharge.toFixed(2)} mÂ³/s\nðŸŒ§ï¸ Hujan: ${current.rainRate.toFixed(1)} mm/jam\nâ„¹ï¸ Status EWS: *${current.ewsStatus}*\n\n_Pesan otomatis dikirim setiap 30 menit dari Command Center._`
        })
      }).catch(err => console.error("Gagal kirim rutin WA", err));
    }, 30 * 60 * 1000); // 30 Menit = 1.800.000 ms

    return () => clearInterval(interval);
  }, []);


  const ews = EWS_CONFIG[data.ewsStatus];
  const connOk = connectionStatus === 'CONNECTED';
  const connWait = connectionStatus === 'CONNECTING';

  const connStyle = {
    CONNECTED: { bg: 'var(--ews-aman-bg)', color: 'var(--ews-aman)', border: '#BBF7D0' },
    CONNECTING: { bg: 'var(--ews-waspada-bg)', color: 'var(--ews-waspada)', border: '#FDE68A' },
    DISCONNECTED: { bg: 'var(--ews-awas-bg)', color: 'var(--ews-awas)', border: '#FECACA' },
    ERROR: { bg: 'var(--ews-awas-bg)', color: 'var(--ews-awas)', border: '#FECACA' },
  }[connectionStatus];

  const relayActive = data.relay1Siren || data.relay2Alarm;

  return (
    <div className="flex flex-col gap-4 md:gap-5">

      {/* â”€â”€ COMMAND BAR â”€â”€ */}
      <div className="card p-3 md:p-4 lg:px-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 md:gap-4">

          <div className="flex items-center gap-3">
            <div
              className="icon-container brand"
              style={{ width: '40px', height: '40px' }}
            >
              <Activity size={18} style={{ color: 'var(--brand-600)' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-jetbrains), monospace', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-muted)' }}>
                  Pos WGG-01
                </span>
                <ChevronRight size={10} style={{ color: 'var(--text-disabled)' }} />
                <span className="truncate" style={{ fontSize: '10px', fontFamily: 'var(--font-jetbrains), monospace', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-muted)' }}>
                  Sungai Wanggu
                </span>
              </div>
              <h1 className="text-lg md:text-[18px] font-bold text-[var(--text-primary)] tracking-[-0.02em] m-0">
                TERAWANG{' '}
                <span className="block md:inline text-[13px] md:text-[15px] mt-0.5 md:mt-0 font-normal text-[var(--text-muted)]">â€” Sistem Pemantauan Dini</span>
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full lg:w-auto mt-2 lg:mt-0">

            <div
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '5px 10px', borderRadius: '99px',
                background: connStyle.bg, border: `1px solid ${connStyle.border}`,
                fontSize: '10px', fontFamily: 'var(--font-jetbrains), monospace',
                fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em',
                color: connStyle.color,
                animation: connWait ? 'pulse 1.5s ease-in-out infinite' : 'none',
              }}
            >
              {connOk ? <Wifi size={11} /> : <WifiOff size={11} />}
              {connOk ? 'EMQX Â· WSS Aktif' : connWait ? 'Menghubungkan...' : 'Terputus'}
            </div>

            <div
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '5px 10px', borderRadius: '99px',
                background: 'var(--surface-inset)', border: '1px solid var(--border-subtle)',
                fontSize: '10px', fontFamily: 'var(--font-jetbrains), monospace', color: 'var(--text-muted)',
              }}
            >
              <Clock size={10} />
              {lastUpdated}
            </div>

            <div
              className="w-full sm:w-auto mt-1 sm:mt-0"
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '8px 14px', borderRadius: 'var(--radius-lg)',
                background: ews.bg, border: `1px solid ${ews.border}`,
                position: 'relative', overflow: 'hidden',
              }}
            >
              {data.ewsStatus !== 'AMAN' && (
                <div
                  style={{
                    position: 'absolute', inset: 0, borderRadius: 'var(--radius-lg)',
                    border: `1px solid ${ews.border}`,
                    animation: 'ping 2s ease-in-out infinite',
                    opacity: 0.4,
                  }}
                />
              )}
              <ShieldAlert size={15} style={{ color: ews.color }} />
              <div>
                <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: '1px' }}>
                  Status Kebencanaan
                </div>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-jetbrains), monospace', color: ews.color }}>
                  {ews.label}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* â”€â”€ AI ASSIST â”€â”€ */}
      <AiAssistPanel telemetry={data} ewsLabel={ews.label} ewsStatus={data.ewsStatus} />

      {/* â”€â”€ EWS GAUGE â”€â”€ */}
      <div
        className="card"
        style={{ padding: '16px 20px' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <span className="text-[9px] md:text-[10px] font-semibold tracking-[0.1em] text-[var(--text-muted)] uppercase">
            Ambang Batas EWS â€” Standar PUPR
          </span>
          <span className="text-[9px] md:text-[10px] font-[family-name:var(--font-jetbrains)] text-[var(--text-disabled)]">
            TMA ref: {data.tmaUltrasonic.toFixed(2)} m
          </span>
        </div>
        <FloodGaugeBar status={data.ewsStatus} />
      </div>

      {/* â”€â”€ KPI CARDS â”€â”€ */}
      <div>
        <SectionHeader>Pemantauan Hidrologi & Fusi Sensor</SectionHeader>

        {/* Custom Bespoke Widgets Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-5 md:mb-6">
          <WaterLevelWidget value={data.tmaHydrostatic} max={3.5} label="TMA Hidrostatis" color="#38bdf8" unit="M" />
          <WaterLevelWidget value={data.tmaUltrasonic} max={3.5} label="TMA Ultrasonik" color="#818cf8" unit="M" />
          <WaveCard value={data.discharge} label="Debit Air" color="#2dd4bf" unit="mÂ³/s" />
          <GaugeWidget value={data.flowRate1} max={50} label="Laju Aliran Turbin" color="#a78bfa" unit="L/min" />
        </div>

        <SectionHeader>Parameter Lingkungan & Infrastruktur</SectionHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">

          <KpiCard
            label="Intensitas Hujan (Ombrometer)"
            value={data.rainRate.toFixed(1)}
            unit="mm"
            icon={CloudRain}
            accentColor="#6366F1"
            statusDot={data.rainRate > 50 ? 'error' : data.rainRate > 0 ? 'warn' : 'ok'}
            statusLabel={data.rainRate > 50 ? 'Hujan lebat Â· tipping bucket' : data.rainRate > 0 ? 'Hujan terdeteksi' : 'Cuaca cerah'}
            statusColor={data.rainRate > 50 ? 'var(--ews-awas)' : data.rainRate > 0 ? 'var(--ews-waspada)' : 'var(--ews-aman)'}
          />

          <KpiCard
            label="Node Infra & Uplink LoRa"
            value={`${data.loraRssi}`}
            unit="dBm"
            icon={Radio}
            accentColor="#D97706"
            statusDot={data.loraRssi < -100 ? 'error' : 'ok'}
            statusLabel={data.loraRssi < -100 ? 'Sinyal lemah' : 'Uplink stabil'}
            statusColor={data.loraRssi < -100 ? 'var(--ews-awas)' : 'var(--ews-aman)'}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-disabled)', marginBottom: '4px' }}>
                  Daya Aki
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <BatteryCharging size={11} style={{ color: data.batteryVoltage < 11.5 ? 'var(--ews-awas)' : 'var(--ews-aman)' }} />
                  <span style={{ fontSize: '12px', fontFamily: 'var(--font-jetbrains), monospace', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {data.batteryVoltage.toFixed(1)}V
                  </span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-disabled)', marginBottom: '4px' }}>
                  Panel Surya
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Zap size={11} style={{ color: data.solarCurrent < 0.5 ? 'var(--text-disabled)' : 'var(--ews-waspada)' }} />
                  <span style={{ fontSize: '12px', fontFamily: 'var(--font-jetbrains), monospace', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {data.solarCurrent.toFixed(2)}A
                  </span>
                </div>
              </div>
            </div>
          </KpiCard>

          <KpiCard
            label="Aktuator Peringatan Lokal"
            value={relayActive ? 'AKTIF' : 'STANDBY'}
            unit=""
            icon={Siren}
            accentColor={relayActive ? '#EF4444' : '#10B981'}
            statusDot={relayActive ? 'error' : 'ok'}
            statusLabel={relayActive ? 'Peringatan warga menyala' : 'Sistem standby aman'}
            statusColor={relayActive ? 'var(--ews-awas)' : 'var(--ews-aman)'}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-disabled)', marginBottom: '4px' }}>
                  Lampu Sirine (IN1)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Lightbulb
                    size={13}
                    style={{
                      color: data.relay1Siren ? '#F59E0B' : 'var(--text-disabled)',
                      fill: data.relay1Siren ? '#F59E0B' : 'transparent',
                      transition: 'all 0.3s'
                    }}
                  />
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-jetbrains), monospace', fontWeight: 700, color: data.relay1Siren ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {data.relay1Siren ? 'MENYALA' : 'MATI'}
                  </span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-disabled)', marginBottom: '4px' }}>
                  Alarm Suara (IN2)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Siren
                    size={13}
                    style={{
                      color: data.relay2Alarm ? '#EF4444' : 'var(--text-disabled)',
                      animation: data.relay2Alarm ? 'pulse 1s infinite' : 'none',
                      transition: 'color 0.3s'
                    }}
                  />
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-jetbrains), monospace', fontWeight: 700, color: data.relay2Alarm ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {data.relay2Alarm ? 'MENYALA' : 'MATI'}
                  </span>
                </div>
              </div>
            </div>
          </KpiCard>

        </div>
      </div>

      {/* â”€â”€ VISUALIZER + CHART â”€â”€ */}
      <div>
        <SectionHeader>Visualisasi & Hidrograf Waktu Nyata</SectionHeader>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">

          <div className="card lg:col-span-1 flex flex-col overflow-hidden h-[360px] md:h-[420px]">
            <PanelHeader
              title="Topografi Sensor Array"
              subtitle="Skema peletakan elemen struktur"
              action={<span className="badge neutral text-[9px] md:text-[10px]">CAD View</span>}
            />
            <div className="flex-1 relative">
              <StationVisualizer />
            </div>
          </div>

          <div className="card lg:col-span-2 flex flex-col overflow-hidden h-[400px] md:h-[420px]">
            <PanelHeader
              title="Hidrograf Telemetri"
              subtitle="Sensor fusi vs garis batas PUPR"
              action={
                <button
                  className="w-7 h-7 rounded-md flex items-center justify-center border border-[var(--border-subtle)] bg-transparent cursor-pointer hover:bg-[var(--surface-inset)] transition-colors"
                  onClick={() => window.location.reload()}
                  title="Refresh chart"
                >
                  <RefreshCw size={12} style={{ color: 'var(--brand-600)', animation: connWait ? 'spin 1s linear infinite' : 'none' }} />
                </button>
              }
            />
            <div className="flex-1 p-2 md:p-3 relative">
              <TelemetryChart />
            </div>
          </div>

        </div>
      </div>

      {/* â”€â”€ GIS MAP â”€â”€ */}
      <div>
        <SectionHeader>Peta Spasial & Lapisan Radar BMKG</SectionHeader>
        <div className="card h-[360px] md:h-[420px] overflow-hidden flex flex-col">
          <PanelHeader
            title="Spasial DAS Wanggu"
            subtitle="Daerah tangkapan air (DTA) â€” Kendari, Sulawesi Tenggara"
            action={
              <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                <div className="flex items-center gap-1 md:gap-1.5 px-2 py-1 md:px-2.5 md:py-1 rounded-full bg-[var(--brand-50)] border border-[var(--brand-100)] text-[8px] md:text-[9px] font-[family-name:var(--font-jetbrains)] font-semibold uppercase tracking-widest text-[var(--brand-700)] whitespace-nowrap">
                  <span className="status-dot live w-1 h-1 md:w-1.5 md:h-1.5" />
                  Radar
                </div>
                <div className="flex items-center gap-1 md:gap-1.5 px-2 py-1 md:px-2.5 md:py-1 rounded-full bg-[var(--ews-aman-bg)] border border-[#BBF7D0] text-[8px] md:text-[9px] font-[family-name:var(--font-jetbrains)] font-semibold uppercase tracking-widest text-[var(--ews-aman)] whitespace-nowrap">
                  <MapPin size={8} />
                  WGG-01
                </div>
              </div>
            }
          />
          <div className="flex-1 relative">
            <GISMap />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ping {
          0% { transform: scale(1); opacity: 0.4; }
          70% { transform: scale(1.4); opacity: 0; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
}