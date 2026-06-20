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

// ── Dynamic Imports ───────────────────────────────────────────────────────────

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

// ── Types & Constants ─────────────────────────────────────────────────────────

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
  AMAN: { label: 'Siaga IV — Aman', color: 'var(--ews-aman)', bg: 'var(--ews-aman-bg)', border: '#BBF7D0', dotBg: '#BBF7D0' },
  WASPADA: { label: 'Siaga III — Waspada', color: 'var(--ews-waspada)', bg: 'var(--ews-waspada-bg)', border: '#FDE68A', dotBg: '#FDE68A' },
  SIAGA: { label: 'Siaga II — Siaga', color: 'var(--ews-siaga)', bg: 'var(--ews-siaga-bg)', border: '#FDBA74', dotBg: '#FDBA74' },
  AWAS: { label: 'Siaga I — Awas', color: 'var(--ews-awas)', bg: 'var(--ews-awas-bg)', border: '#FECACA', dotBg: '#FECACA' },
} as const;

const EWS_LEVELS = ['AMAN', 'WASPADA', 'SIAGA', 'AWAS'] as const;

// ── Primitive Components ──────────────────────────────────────────────────────

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
    <div
      style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-primary)' }}>
          {title}
        </span>
        <span style={{ fontSize: '10px', fontFamily: 'var(--font-jetbrains), monospace', color: 'var(--text-muted)' }}>
          {subtitle}
        </span>
      </div>
      {action}
    </div>
  );
}

// ── EWS Flood Gauge ───────────────────────────────────────────────────────────

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

// ── KPI Card ──────────────────────────────────────────────────────────────────

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

// ── AI Assist Panel ───────────────────────────────────────────────────────────

function AiAssistPanel({ telemetry, ewsLabel }: { telemetry: TelemetryState; ewsLabel: string }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const SYSTEM_PROMPT = `Kamu adalah asisten hidrologi AWLR Command Center untuk Pos WGG-01 Sungai Wanggu, Kendari, Sulawesi Tenggara.
Proyek ini milik BBWS Sulawesi IV / Ditjen SDA Kementerian PUPR.
Jawab dalam Bahasa Indonesia yang lugas dan teknis. Fokus pada analisis banjir, interpretasi data sensor, dan rekomendasi operasional.
Konteks telemetri saat ini:
- TMA Ultrasonik: ${telemetry.tmaUltrasonic.toFixed(2)} m
- TMA Hidrostatik: ${telemetry.tmaHydrostatic.toFixed(2)} m
- Debit Sungai: ${telemetry.discharge.toFixed(2)} m³/s
- Kecepatan Arus: ${telemetry.velocity.toFixed(2)} m/s
- Intensitas hujan: ${telemetry.rainRate.toFixed(1)} mm/jam
- Status EWS: ${ewsLabel}
- Tegangan baterai: ${telemetry.batteryVoltage.toFixed(1)} V
- Arus panel surya: ${telemetry.solarCurrent.toFixed(2)} A
- RSSI LoRa: ${telemetry.loraRssi} dBm

Jika operator menyuruh Anda untuk mengirim pesan peringatan atau informasi ke WhatsApp, Anda WAJIB membalas dengan menyertakan tag khusus ini di awal atau akhir jawaban Anda:
[KIRIM_WA: isi pesan yang akan dikirim ke WhatsApp]

Berikan jawaban singkat, akurat, dan langsung dapat ditindaklanjuti oleh operator lapangan.`;

  async function send() {
    const q = input.trim();
    if (!q || loading) return;
    setInput('');
    const next: AiMessage[] = [...messages, { role: 'user', content: q }];
    setMessages(next);
    setLoading(true);

    try {
      const res = await fetch('/api/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemPrompt: SYSTEM_PROMPT, messages: next }),
      });
      const data = await res.json();
      setMessages([...next, { role: 'assistant', content: data.content ?? 'Gagal mendapat respons.' }]);
    } catch {
      setMessages([...next, { role: 'assistant', content: 'Koneksi ke AI gagal. Periksa koneksi internet.' }]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const quickPrompts = [
    'Berdasarkan curah hujan saat ini, estimasi waktu sebelum luapan?',
    'Analisis korelasi debit air dan TMA saat ini.',
    'Apakah kecepatan arus sungai melampaui batas aman?',
  ];

  if (!mounted) return null;

  return createPortal(
    <>
      {/* Floating Action Button (Bubble) */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed',
          bottom: '32px',
          right: '32px',
          width: '64px',
          height: '64px',
          borderRadius: '32px',
          background: 'var(--brand-600)',
          color: 'white',
          border: 'none',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 9999,
          transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          transform: open ? 'scale(0.9) rotate(15deg)' : 'scale(1) rotate(0deg)',
        }}
        aria-label="Tanya AI Hidrologi"
      >
        {open ? <ChevronRight size={28} style={{ transform: 'rotate(90deg)' }} /> : <Sparkles size={28} />}
      </button>

      {/* Floating Chat Window */}
      <div
        style={{
          position: 'fixed',
          bottom: '112px',
          right: '32px',
          width: '380px',
          height: '540px',
          maxHeight: 'calc(100vh - 140px)',
          background: 'var(--surface-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '24px',
          boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 9998,
          overflow: 'hidden',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transform: open ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
          transformOrigin: 'bottom right',
          transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px', background: 'linear-gradient(135deg, var(--brand-600) 0%, var(--brand-700) 100%)', color: 'white', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '20px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={22} />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-0.01em', lineHeight: 1.2 }}>TERAWANG Assistant</div>
            <div style={{ fontSize: '11px', fontWeight: 600, opacity: 0.8, letterSpacing: '0.04em', textTransform: 'uppercase', marginTop: '2px' }}>
              • Online (Gemini 2.0 Flash)
            </div>
          </div>
        </div>

        {/* Chat Body */}
        <div className="scrollbar-hide" style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--surface-bg)' }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px 0', marginTop: 'auto', marginBottom: 'auto' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '32px', background: 'var(--surface-inset)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Sparkles size={32} style={{ color: 'var(--brand-500)' }} />
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '20px' }}>
                Halo! Saya adalah Asisten Hidrologi Pos WGG-01. Ada yang bisa saya bantu terkait analisis kondisi sungai saat ini?
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {quickPrompts.map(q => (
                  <button
                    key={q}
                    onClick={() => { setInput(q); }}
                    style={{
                      fontSize: '11px', padding: '10px 16px', borderRadius: '12px', cursor: 'pointer',
                      background: 'var(--surface-card)', color: 'var(--brand-500)',
                      border: '1px solid var(--border-subtle)', fontFamily: 'inherit',
                      textAlign: 'left', transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-inset)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-card)'; }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: m.role === 'user' ? 'row-reverse' : 'row', gap: '12px', alignItems: 'flex-end' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '14px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: m.role === 'user' ? 'var(--brand-600)' : 'var(--surface-inset)', border: '1px solid var(--border-subtle)', marginBottom: '4px' }}>
                {m.role === 'user' ? <span style={{ fontSize: '10px', color: 'white', fontWeight: 800 }}>OP</span> : <Bot size={14} style={{ color: 'var(--text-secondary)' }} />}
              </div>
              <div style={{ maxWidth: '75%', padding: '12px 16px', borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: m.role === 'user' ? 'var(--brand-600)' : 'var(--surface-card)', border: '1px solid', borderColor: m.role === 'user' ? 'transparent' : 'var(--border-subtle)', fontSize: '13px', lineHeight: 1.6, color: m.role === 'user' ? 'white' : 'var(--text-primary)', whiteSpace: 'pre-wrap', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '14px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-inset)', border: '1px solid var(--border-subtle)', marginBottom: '4px' }}>
                <Bot size={14} style={{ color: 'var(--text-secondary)' }} />
              </div>
              <div style={{ padding: '12px 16px', background: 'var(--surface-card)', borderRadius: '16px 16px 16px 4px', border: '1px solid var(--border-subtle)', display: 'flex', gap: '6px' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: '6px', height: '6px', borderRadius: '3px', background: 'var(--text-disabled)', animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input Area */}
        <div style={{ padding: '16px', background: 'var(--surface-card)', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Tulis pesan ke AI..."
            rows={1}
            style={{
              flex: 1, resize: 'none', border: '1px solid var(--border-default)',
              borderRadius: '20px', padding: '10px 16px',
              fontSize: '13px', lineHeight: 1.5, fontFamily: 'inherit',
              color: 'var(--text-primary)', background: 'var(--surface-inset)',
              outline: 'none', overflowY: 'hidden', minHeight: '40px', maxHeight: '120px'
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--brand-500)'; e.target.style.background = 'var(--surface-bg)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--border-default)'; e.target.style.background = 'var(--surface-inset)'; }}
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            style={{
              width: '40px', height: '40px', borderRadius: '20px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: loading || !input.trim() ? 'var(--surface-inset)' : 'var(--brand-600)',
              border: 'none',
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              flexShrink: 0, transition: 'all 0.2s',
              boxShadow: loading || !input.trim() ? 'none' : '0 4px 12px rgba(37,99,235,0.3)',
            }}
          >
            <Send size={16} style={{ color: loading || !input.trim() ? 'var(--text-disabled)' : 'white', marginLeft: '2px' }} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </>,
    document.body
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

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
    const clientId = `awlr-web-${Math.random().toString(16).substring(2, 8)}`;
    clientRef.current = mqtt.connect(MQTT_BROKER, {
      clientId,
      username: 'faisal',
      password: 'faisalwibu11',
      clean: true,
      connectTimeout: 5000,
      reconnectPeriod: 2000,
    });

    clientRef.current.on('connect', () => { setConnectionStatus('CONNECTED'); clientRef.current?.subscribe(MQTT_TOPIC, { qos: 0 }); });
    clientRef.current.on('reconnect', () => setConnectionStatus('CONNECTING'));
    clientRef.current.on('error', () => setConnectionStatus('ERROR'));
    clientRef.current.on('offline', () => setConnectionStatus('DISCONNECTED'));

    clientRef.current.on('message', (topic, message) => {
      if (topic !== MQTT_TOPIC) return;
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

  // ── WHATSAPP INTEGRATION ──
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
          message: `🚨 *PERINGATAN DINI BANJIR: ${data.ewsStatus}* 🚨\n\nLokasi: Pos WGG-01 Sungai Wanggu\nTinggi Air: ${data.tmaHydrostatic.toFixed(2)} m\nDebit: ${data.discharge.toFixed(2)} m³/s\nCurah Hujan: ${data.rainRate.toFixed(1)} mm/jam\n\n⚠️ Harap warga di sekitar segera waspada dan mengambil tindakan pengamanan!`
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
          message: `📊 *UPDATE TELEMETRI TERAWANG*\nPos WGG-01 Sungai Wanggu\n🕒 Waktu: ${new Date().toLocaleString('id-ID')}\n\n🌊 TMA: ${current.tmaHydrostatic.toFixed(2)} m\n💧 Debit: ${current.discharge.toFixed(2)} m³/s\n🌧️ Hujan: ${current.rainRate.toFixed(1)} mm/jam\nℹ️ Status EWS: *${current.ewsStatus}*\n\n_Pesan otomatis dikirim setiap 30 menit dari Command Center._`
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── COMMAND BAR ── */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
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
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-jetbrains), monospace', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-muted)' }}>
                  Sungai Wanggu
                </span>
              </div>
              <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
                TERAWANG{' '}
                <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '15px' }}>— Sistem Pemantauan Dini</span>
              </h1>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>

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
              {connOk ? 'EMQX · WSS Aktif' : connWait ? 'Menghubungkan...' : 'Terputus'}
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

      {/* ── AI ASSIST ── */}
      <AiAssistPanel telemetry={data} ewsLabel={ews.label} />

      {/* ── EWS GAUGE ── */}
      <div
        className="card"
        style={{ padding: '12px 20px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
            Ambang Batas EWS — Standar PUPR
          </span>
          <span style={{ fontSize: '10px', fontFamily: 'var(--font-jetbrains), monospace', color: 'var(--text-disabled)' }}>
            TMA ref: {data.tmaUltrasonic.toFixed(2)} m
          </span>
        </div>
        <FloodGaugeBar status={data.ewsStatus} />
      </div>

      {/* ── KPI CARDS ── */}
      <div>
        <SectionHeader>Pemantauan Hidrologi & Fusi Sensor</SectionHeader>

        {/* Custom Bespoke Widgets Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <WaterLevelWidget value={data.tmaHydrostatic} max={3.5} label="TMA Hidrostatis" color="#38bdf8" unit="M" />
          <WaterLevelWidget value={data.tmaUltrasonic} max={3.5} label="TMA Ultrasonik" color="#818cf8" unit="M" />
          <WaveCard value={data.discharge} label="Debit Air" color="#2dd4bf" unit="m³/s" />
          <GaugeWidget value={data.flowRate1} max={50} label="Laju Aliran Turbin" color="#a78bfa" unit="L/min" />
        </div>

        <SectionHeader>Parameter Lingkungan & Infrastruktur</SectionHeader>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>

          <KpiCard
            label="Intensitas Hujan (Ombrometer)"
            value={data.rainRate.toFixed(1)}
            unit="mm"
            icon={CloudRain}
            accentColor="#6366F1"
            statusDot={data.rainRate > 50 ? 'error' : data.rainRate > 0 ? 'warn' : 'ok'}
            statusLabel={data.rainRate > 50 ? 'Hujan lebat · tipping bucket' : data.rainRate > 0 ? 'Hujan terdeteksi' : 'Cuaca cerah'}
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

      {/* ── VISUALIZER + CHART ── */}
      <div>
        <SectionHeader>Visualisasi & Hidrograf Waktu Nyata</SectionHeader>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>

          <div className="card" style={{ height: '420px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <PanelHeader
              title="Topografi Sensor Array"
              subtitle="Skema peletakan elemen struktur"
              action={<span className="badge neutral">CAD View</span>}
            />
            <div style={{ flex: 1, position: 'relative' }}>
              <StationVisualizer />
            </div>
          </div>

          <div className="card" style={{ height: '420px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <PanelHeader
              title="Hidrograf Telemetri"
              subtitle="Sensor fusi vs garis batas PUPR — resolusi 1 menit"
              action={
                <button
                  style={{
                    width: '28px', height: '28px', borderRadius: 'var(--radius-md)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid var(--border-subtle)', background: 'none', cursor: 'pointer',
                  }}
                  onClick={() => window.location.reload()}
                  title="Refresh chart"
                >
                  <RefreshCw size={12} style={{ color: 'var(--brand-600)', animation: connWait ? 'spin 1s linear infinite' : 'none' }} />
                </button>
              }
            />
            <div style={{ flex: 1, padding: '12px' }}>
              <TelemetryChart />
            </div>
          </div>

        </div>
      </div>

      {/* ── GIS MAP ── */}
      <div>
        <SectionHeader>Peta Spasial & Lapisan Radar BMKG</SectionHeader>
        <div className="card" style={{ height: '360px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <PanelHeader
            title="Spasial DAS Wanggu"
            subtitle="Daerah tangkapan air (DTA) — Kendari, Sulawesi Tenggara"
            action={
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    padding: '3px 8px', borderRadius: '99px',
                    background: 'var(--brand-50)', border: '1px solid var(--brand-100)',
                    fontSize: '9px', fontFamily: 'var(--font-jetbrains), monospace',
                    fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--brand-700)',
                  }}
                >
                  <span className="status-dot live" style={{ width: '5px', height: '5px' }} />
                  Radar Aktif
                </div>
                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    padding: '3px 8px', borderRadius: '99px',
                    background: 'var(--ews-aman-bg)', border: '1px solid #BBF7D0',
                    fontSize: '9px', fontFamily: 'var(--font-jetbrains), monospace',
                    fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ews-aman)',
                  }}
                >
                  <MapPin size={8} />
                  WGG-01
                </div>
              </div>
            }
          />
          <div style={{ flex: 1, position: 'relative' }}>
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