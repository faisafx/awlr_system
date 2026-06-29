// ─────────────────────────────────────────────────────────────────────────────
// File: app/analytics/page.tsx
// Architecture: Next.js 14 App Router (Client Component)
// Project: Full-Stack AWLR Command Center - Sungai Wanggu, Kendari
// Design System: Google Cloud / Calm Light Mode Edition
// Description: LSTM Predictive Analytics Engine — Hidrograf 6-jam ke depan
// ─────────────────────────────────────────────────────────────────────────────

'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  TrendingUp,
  BrainCircuit,
  Database,
  Activity,
  Layers,
  Zap,
  Clock,
  MapPin,
  ChevronRight,
  Droplet,
  Waves,
  AlertTriangle,
  CheckCircle2,
  Info,
  Sparkles,
  Sigma,
  BarChart2,
  Clock4,
  Cpu,
  ShieldCheck
} from 'lucide-react';
import LstmPredictWidget from '@/components/LstmPredictWidget';
import { cn } from '@/lib/utils';

// ── Shared Spinner ────────────────────────────────────────────────────────────
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

// ── Dynamic Import Chart ──────────────────────────────────────────────────────
const PredictionChart = dynamic(() => import('@/components/charts/PredictionChart'), {
  ssr: false,
  loading: () => <Spinner label="MENGINISIALISASI HIDROGRAF LSTM..." />,
});

// ── Types ─────────────────────────────────────────────────────────────────────
interface MetricPrediction {
  metrics: { mae: number; rmse: number; executionTimeMs: number };
  historical: { timestamp: number; value: number }[];
  forecast: { timestamp: number; value: number; upperConfidence: number; lowerConfidence: number }[];
}

interface PredictionData {
  tma: MetricPrediction;
  debit: MetricPrediction;
}

// ── EWS Thresholds (Mapped to Design Tokens) ──────────────────────────────────
const EWS_THRESHOLDS_TMA = [
  { label: 'AWAS',    min: 2.80, color: 'var(--ews-awas)',    bg: 'var(--ews-awas-bg)',    border: '#FECACA' },
  { label: 'SIAGA',   min: 2.20, color: 'var(--ews-siaga)',   bg: 'var(--ews-siaga-bg)',   border: '#FDBA74' },
  { label: 'WASPADA', min: 1.60, color: 'var(--ews-waspada)', bg: 'var(--ews-waspada-bg)', border: '#FDE68A' },
  { label: 'AMAN',    min: 0.00, color: 'var(--ews-aman)',    bg: 'var(--ews-aman-bg)',    border: '#BBF7D0' },
] as const;

const EWS_THRESHOLDS_DEBIT = [
  { label: 'AWAS',    min: 60.0, color: 'var(--ews-awas)',    bg: 'var(--ews-awas-bg)',    border: '#FECACA' },
  { label: 'SIAGA',   min: 50.0, color: 'var(--ews-siaga)',   bg: 'var(--ews-siaga-bg)',   border: '#FDBA74' },
  { label: 'WASPADA', min: 40.0, color: 'var(--ews-waspada)', bg: 'var(--ews-waspada-bg)', border: '#FDE68A' },
  { label: 'AMAN',    min: 0.00, color: 'var(--ews-aman)',    bg: 'var(--ews-aman-bg)',    border: '#BBF7D0' },
] as const;

function getEwsLevel(value: number, type: 'tma' | 'debit') {
  const t = type === 'tma' ? EWS_THRESHOLDS_TMA : EWS_THRESHOLDS_DEBIT;
  return t.find(x => value >= x.min) ?? t[t.length - 1];
}

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

// ── Model Health Strip ────────────────────────────────────────────────────────
function ModelHealthStrip({ mae, rmse, execMs }: { mae: number; rmse: number; execMs: number }) {
  const maeScore   = Math.max(0, 1 - mae / 0.5);
  const rmseScore  = Math.max(0, 1 - rmse / 0.5);
  const speedScore = Math.min(1, 1000 / Math.max(execMs, 1));

  const metrics = [
    { label: 'MAE',             value: `${mae.toFixed(3)} m`,  score: maeScore,   color: '#8B5CF6', icon: Sigma },
    { label: 'RMSE',            value: `${rmse.toFixed(3)} m`, score: rmseScore,  color: '#3B82F6', icon: BarChart2 },
    { label: 'Waktu Inferensi', value: `${execMs} ms`,         score: speedScore, color: '#10B981', icon: Clock4 },
  ];

  return (
    <div className="card" style={{ padding: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px', height: '36px', borderRadius: 'var(--radius-md)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#F3E8FF', border: '1px solid #E9D5FF', // Purple tint for AI
            }}
          >
            <Cpu size={16} style={{ color: '#9333EA' }} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>Kualitas Model LSTM</div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Evaluasi performa inferensi aktif</div>
          </div>
        </div>
        <span className="badge" style={{ background: '#F3E8FF', color: '#7E22CE', border: '1px solid #E9D5FF' }}>
          VERTEX AI · LSTM v2
        </span>
      </div>

      {/* Metrics */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {metrics.map(({ label, value, score, color, icon: Icon }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '6px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-inset)', border: '1px solid var(--border-subtle)' }}>
              <Icon size={12} color={color} />
            </div>
            <div style={{ width: '100px', flexShrink: 0 }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</span>
            </div>
            {/* Bar track */}
            <div style={{ flex: 1, height: '6px', borderRadius: '99px', background: 'var(--surface-inset)', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%', borderRadius: '99px', background: color,
                  width: `${score * 100}%`, transition: 'width 0.7s var(--ease-standard)',
                }}
              />
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-jetbrains), monospace', color: 'var(--text-primary)', width: '64px', textAlign: 'right' }}>
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Architecture footnote */}
      <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {['Input(1)', 'LSTM(64)', 'LSTM(32)', 'Dense(16)', 'Output(1)'].map((layer, i, arr) => (
          <div key={layer} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '9px', fontFamily: 'var(--font-jetbrains), monospace', fontWeight: 600,
                padding: '3px 6px', borderRadius: 'var(--radius-sm)',
                background: 'var(--surface-inset)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)',
              }}
            >
              {layer}
            </span>
            {i < arr.length - 1 && <ChevronRight size={10} style={{ color: 'var(--text-disabled)' }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Confidence Horizon Card ───────────────────────────────────────────────────
function ConfidenceHorizonCard({
  forecast,
  type,
  unit,
}: {
  forecast: { timestamp: number; value: number; upperConfidence: number; lowerConfidence: number }[];
  type: 'tma' | 'debit';
  unit: string;
}) {
  const horizons = [1, 2, 3, 6];
  const msPerHour = 3_600_000;
  const now = Date.now();

  return (
    <div className="card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div
          className="icon-container brand"
          style={{ width: '36px', height: '36px' }}
        >
          <Layers size={16} />
        </div>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>Horizon Prediksi</div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Proyeksi {type.toUpperCase()} per jam ke depan</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '12px' }}>
        {horizons.map((h) => {
          const targetMs = now + h * msPerHour;
          const closest = forecast.reduce((prev, cur) =>
            Math.abs(cur.timestamp - targetMs) < Math.abs(prev.timestamp - targetMs) ? cur : prev,
            forecast[0] ?? { value: 0, upperConfidence: 0, lowerConfidence: 0, timestamp: 0 }
          );
          const ews = getEwsLevel(closest?.value ?? 0, type);
          const bandWidth = ((closest?.upperConfidence ?? 0) - (closest?.lowerConfidence ?? 0)).toFixed(2);

          return (
            <div
              key={h}
              style={{
                background: 'var(--surface-inset)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '12px',
                transition: 'all var(--duration-base) var(--ease-standard)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--brand-200)'; e.currentTarget.style.background = 'var(--brand-50)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.background = 'var(--surface-inset)'; }}
            >
              {/* Horizon label */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)' }}>+{h} JAM</span>
                <span
                  style={{
                    fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                    padding: '2px 6px', borderRadius: '99px',
                    background: ews.bg, color: ews.color, border: `1px solid ${ews.border}`,
                  }}
                >
                  {ews.label}
                </span>
              </div>

              {/* Value */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '6px' }}>
                <span className="sensor-value" style={{ fontSize: '24px' }}>
                  {(closest?.value ?? 0).toFixed(2)}
                </span>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-jetbrains), monospace', color: 'var(--text-muted)' }}>{unit}</span>
              </div>

              {/* Confidence band */}
              <div
                style={{
                  fontSize: '9px', fontFamily: 'var(--font-jetbrains), monospace',
                  padding: '2px 6px', borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)',
                  display: 'inline-block',
                }}
              >
                ±{bandWidth}{unit} CI
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── AI Decision Banner ────────────────────────────────────────────────────────
function AiDecisionBanner({ peakForecast, type, unit }: { peakForecast: number, type: 'tma' | 'debit', unit: string }) {
  const t = type === 'tma' ? EWS_THRESHOLDS_TMA : EWS_THRESHOLDS_DEBIT;
  const isAlert  = peakForecast >= t[0].min; // AWAS
  const isSiaga  = peakForecast >= t[1].min && peakForecast < t[0].min; // SIAGA
  const ews      = getEwsLevel(peakForecast, type);

  const messagesTma = {
    alert: 'Model LSTM mendeteksi akumulasi tinggi muka air yang berpotensi melampaui ambang Awas dalam 4 jam ke depan. Segera koordinasi evakuasi dan pembukaan pintu air.',
    siaga: 'Trajektori prediksi muka air mendekati zona Siaga. Pantau intensitas hujan secara berkala.',
    aman:  'Fluktuasi Tinggi Muka Air (TMA) terdeteksi dalam batas toleransi aman.',
  };
  
  const messagesDebit = {
    alert: 'Model LSTM memprediksi lonjakan debit sungai ekstrem. Waspada luapan bandang akibat kecepatan aliran air yang melampaui kapasitas tanggul.',
    siaga: 'Debit air menunjukkan anomali peningkatan. Kurangi aktivitas warga di bantaran sungai.',
    aman:  'Siklus debit air dan kapasitas pembuangan sungai berjalan normal tanpa ada lonjakan berarti.',
  };

  const messages = type === 'tma' ? messagesTma : messagesDebit;
  const message = isAlert ? messages.alert : isSiaga ? messages.siaga : messages.aman;
  const Icon    = isAlert || isSiaga ? AlertTriangle : ShieldCheck;

  return (
    <div
      style={{
        borderRadius: 'var(--radius-xl)',
        padding: '16px 20px',
        display: 'flex',
        gap: '16px',
        alignItems: 'flex-start',
        background: ews.bg,
        border: `1px solid ${ews.border}`,
      }}
    >
      <div
        style={{
          width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--surface-card)', border: `1px solid ${ews.border}`,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <Icon size={20} color={ews.color} />
      </div>

      <div style={{ flex: 1, minWidth: 0, paddingTop: '2px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: ews.color, letterSpacing: '-0.01em' }}>
            {isAlert ? 'Rekomendasi Kedaruratan' : isSiaga ? 'Peringatan Dini — Pantau Kondisi' : 'Sistem Terkendali Aman'}
          </span>
          <span
            style={{
              fontSize: '9px', fontWeight: 600, fontFamily: 'var(--font-jetbrains), monospace',
              padding: '2px 8px', borderRadius: '99px',
              background: 'var(--surface-overlay)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)',
              display: 'flex', alignItems: 'center', gap: '4px'
            }}
          >
            <Sparkles size={9} /> AI GENERATED
          </span>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, maxWidth: '800px' }}>
          {message}
        </p>

        <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Puncak prediksi {type.toUpperCase()}:</span>
          <span style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-jetbrains), monospace', color: ews.color }}>
            {peakForecast.toFixed(2)} {unit}
          </span>
        </div>
      </div>
    </div>
  );
}

function PredictionDashboardBlock({ 
  data, type, unit, label, color, max 
}: { 
  data: MetricPrediction, type: 'tma' | 'debit', unit: string, label: string, color: string, max: number 
}) {
  const peakForecast = Math.max(...data.forecast.map(o => o.value));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '48px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
        <div style={{ padding: '8px', background: 'var(--brand-50)', borderRadius: '8px', border: '1px solid var(--brand-100)' }}>
          {type === 'tma' ? <Droplet size={20} color="var(--brand-600)" /> : <Waves size={20} color="var(--brand-600)" />}
        </div>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            Pemodelan {label}
          </h2>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Proyeksi Jaringan Saraf Tiruan (LSTM)</span>
        </div>
      </div>

      <div>
        <SectionHeader>Diagnostik Model & Proyeksi Horizon ({label})</SectionHeader>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '16px' }}>
          <ModelHealthStrip mae={data.metrics.mae} rmse={data.metrics.rmse} execMs={data.metrics.executionTimeMs} />
          <ConfidenceHorizonCard forecast={data.forecast} type={type} unit={unit} />
        </div>
      </div>

      <div>
        <SectionHeader>Visualisasi Historis & Proyeksi ({label})</SectionHeader>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '500px', overflow: 'hidden' }}>
          <PanelHeader
            title={`Garis Waktu Prediksi ${label}`}
            subtitle="Data historis IoT + proyeksi LSTM interval 1 jam"
            action={
              <span className="badge brand" style={{ padding: '4px 10px', gap: '6px' }}>
                <BrainCircuit size={12} />
                6H FORECAST
              </span>
            }
          />
          <div style={{ flex: 1, padding: '16px' }}>
            <PredictionChart historical={data.historical} forecast={data.forecast} metricLabel={label} unit={unit} baseColor={color} max={max} />
          </div>
        </div>
      </div>

      <div>
        <SectionHeader>Rekomendasi Taktis AI ({label})</SectionHeader>
        <AiDecisionBanner peakForecast={peakForecast} type={type} unit={unit} />
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [data, setData]       = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPredictions() {
      try {
        const res  = await fetch('/api/predictions');
        const json = await res.json();
        if (json.status === 'success') setData(json.data);
      } catch (err) {
        console.error('Gagal memuat data prediksi:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPredictions();
  }, []);

  // ── Loading State ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ height: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
        <div
          className="icon-container brand"
          style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)' }}
        >
          <BrainCircuit size={28} style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Menyinkronkan Data Model...
          </p>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Mengambil referensi IoT (LoRaWAN) & melakukan komputasi matriks LSTM
          </p>
        </div>
        <div style={{ width: '200px', height: '6px', borderRadius: '99px', background: 'var(--surface-inset)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
          <div style={{ height: '100%', background: 'var(--brand-500)', borderRadius: '99px', width: '60%', animation: 'pulse 1.5s ease-in-out infinite' }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* ── PAGE HEADER ── */}
      <div className="card" style={{ padding: '20px 24px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              className="icon-container brand"
              style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-xl)' }}
            >
              <TrendingUp size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-muted)' }}>
                  Analytics Engine
                </span>
                <ChevronRight size={12} style={{ color: 'var(--text-disabled)' }} />
                <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--brand-600)' }}>
                  Model Aktif
                </span>
              </div>
              <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
                Prediksi Hidrograf Ganda{' '}
                <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '18px' }}>— Sungai Wanggu</span>
              </h1>
            </div>
          </div>

          <div
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 16px', borderRadius: 'var(--radius-lg)',
              background: 'var(--ews-aman-bg)', border: '1px solid #BBF7D0',
              color: 'var(--ews-aman)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
            }}
          >
            <Activity size={14} />
            Sistem Inferensi Online
          </div>
        </div>
      </div>

      {/* ── AI FORECAST WIDGET ── */}
      {data && (
        <LstmPredictWidget 
          currentDischarge={data.debit.historical.length > 0 ? data.debit.historical[data.debit.historical.length - 1].value : 0} 
          currentRain={0} // Mocked or get from somewhere if available
        />
      )}

      {/* ── PREDICTION BLOCKS ── */}
      {data && (
        <>
          <PredictionDashboardBlock data={data.tma} type="tma" unit="m" label="Tinggi Muka Air" color="#14b8a6" max={5} />
          <PredictionDashboardBlock data={data.debit} type="debit" unit="m³/s" label="Debit Air Sungai" color="#3b82f6" max={100} />
        </>
      )}

    </div>
  );
}