// ─────────────────────────────────────────────────────────────────────────────
// components/ui/MetricCards.tsx
// Four sensor metric cards with animated value transitions.
// ─────────────────────────────────────────────────────────────────────────────

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Gauge,
  Radio,
  CloudRain,
  Sun,
  Cloud,
  Zap,
  CloudLightning,
  ArrowUp,
  ArrowDown,
  Minus,
} from 'lucide-react';
import type { SensorPayload, WeatherCondition } from '@/types/awlr';
import { cn, fmt } from '@/lib/utils';

interface MetricCardsProps {
  payload: SensorPayload;
  prev:    SensorPayload | null;
}

export function MetricCards({ payload, prev }: MetricCardsProps) {
  const cards = buildCards(payload, prev);

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
      {cards.map((card, i) => (
        <motion.div
          key={card.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, type: 'spring', stiffness: 260, damping: 22 }}
        >
          <MetricCard {...card} />
        </motion.div>
      ))}
    </div>
  );
}

// ── Individual card ───────────────────────────────────────────────────────────
interface CardData {
  id:        string;
  label:     string;
  subLabel:  string;
  value:     string;
  unit:      string;
  icon:      React.ReactNode;
  accentHex: string;
  trend:     'up' | 'down' | 'flat';
  delta:     string;
  badge?:    string;
  badgeOk?:  boolean;
}

function MetricCard({ label, subLabel, value, unit, icon, accentHex, trend, delta, badge, badgeOk }: CardData) {
  const TrendIcon = trend === 'up' ? ArrowUp : trend === 'down' ? ArrowDown : Minus;
  const trendColor =
    trend === 'up'   ? '#EF4444' :
    trend === 'down' ? '#10B981' :
    '#6B7280';

  return (
    <div
      className="metric-card group"
      style={{ '--accent': accentHex } as React.CSSProperties}
    >
      {/* Accent top stripe */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] rounded-t-card"
        style={{ background: `linear-gradient(90deg, ${accentHex}80, ${accentHex}20)` }}
      />

      {/* Subtle radial glow on hover */}
      <div
        className="absolute inset-0 rounded-card opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 0% 0%, ${accentHex}08, transparent 60%)`,
        }}
      />

      <div className="relative z-10">
        {/* Header row */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
              {label}
            </p>
            <p className="text-[10px] text-text-muted/60 mt-0.5 font-mono">
              {subLabel}
            </p>
          </div>
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center"
            style={{
              background: `${accentHex}18`,
              border:     `1px solid ${accentHex}30`,
              color:       accentHex,
            }}
          >
            {icon}
          </div>
        </div>

        {/* Value display */}
        <div className="flex items-end gap-1.5">
          <AnimatePresence mode="popLayout">
            <motion.span
              key={value}
              initial={{ opacity: 0.4, y: -3 }}
              animate={{ opacity: 1,   y: 0   }}
              className="sensor-value"
              style={{ color: accentHex }}
            >
              {value}
            </motion.span>
          </AnimatePresence>
          <span className="text-text-muted text-sm mb-0.5 font-mono">{unit}</span>
        </div>

        {/* Footer: trend + delta or badge */}
        <div className="flex items-center justify-between mt-2">
          {badge ? (
            <span
              className={cn(
                'text-[10px] font-bold px-2 py-0.5 rounded-full font-mono border',
                badgeOk
                  ? 'bg-status-aman/10 text-status-aman border-status-aman/25'
                  : 'bg-status-siaga/10 text-status-siaga border-status-siaga/25',
              )}
            >
              {badge}
            </span>
          ) : (
            <div className="flex items-center gap-1">
              <TrendIcon size={11} style={{ color: trendColor }} strokeWidth={2.5} />
              <span className="text-[10px] font-mono" style={{ color: trendColor }}>
                {delta}
              </span>
            </div>
          )}
          <span className="text-[10px] text-text-muted/50 font-mono">live</span>
        </div>
      </div>
    </div>
  );
}

// ── Build card data from payload ──────────────────────────────────────────────
function buildCards(cur: SensorPayload, prev: SensorPayload | null): CardData[] {
  const trend = (cur: number, prev: number | undefined): 'up' | 'down' | 'flat' => {
    if (!prev) return 'flat';
    const diff = cur - prev;
    if (diff > 0.001) return 'up';
    if (diff < -0.001) return 'down';
    return 'flat';
  };

  const delta = (cur: number, prev: number | undefined, unit: string): string => {
    if (!prev) return '—';
    const d = cur - prev;
    return `${d >= 0 ? '+' : ''}${d.toFixed(2)} ${unit}`;
  };

  return [
    {
      id:        'qdy',
      label:     'Hydrostatic Depth',
      subLabel:  'QDY30A Sensor',
      value:     fmt(cur.waterLevelQDY, 3),
      unit:      'm',
      icon:      <Gauge size={16} strokeWidth={1.8} />,
      accentHex: '#3B82F6',
      trend:     trend(cur.waterLevelQDY, prev?.waterLevelQDY),
      delta:     delta(cur.waterLevelQDY, prev?.waterLevelQDY, 'm'),
    },
    {
      id:        'ultrasonic',
      label:     'Ultrasonic Distance',
      subLabel:  'A02YYUW Sensor',
      value:     fmt(cur.waterLevelUltrasonic, 3),
      unit:      'm',
      icon:      <Radio size={16} strokeWidth={1.8} />,
      accentHex: '#8B5CF6',
      trend:     trend(cur.waterLevelUltrasonic, prev?.waterLevelUltrasonic),
      delta:     delta(cur.waterLevelUltrasonic, prev?.waterLevelUltrasonic, 'm'),
    },
    {
      id:        'rainfall',
      label:     'Rainfall Intensity',
      subLabel:  'Ombrometer',
      value:     fmt(cur.rainfall, 1),
      unit:      'mm/hr',
      icon:      <CloudRain size={16} strokeWidth={1.8} />,
      accentHex: cur.rainfall > 50 ? '#EF4444' : cur.rainfall > 20 ? '#F59E0B' : '#10B981',
      trend:     trend(cur.rainfall, prev?.rainfall),
      delta:     delta(cur.rainfall, prev?.rainfall, 'mm/hr'),
    },
    {
      id:        'weather',
      label:     'BMKG Weather',
      subLabel:  'API Integration',
      value:     weatherDisplay(cur.weatherStatus).short,
      unit:      '',
      icon:      weatherDisplay(cur.weatherStatus).icon,
      accentHex: weatherDisplay(cur.weatherStatus).hex,
      trend:     'flat',
      delta:     '',
      badge:     cur.weatherStatus,
      badgeOk:   !cur.weatherStatus.toLowerCase().includes('rain'),
    },
  ];
}

// ── Weather display helpers ───────────────────────────────────────────────────
function weatherDisplay(w: WeatherCondition): {
  short: string;
  icon:  React.ReactNode;
  hex:   string;
} {
  const map: Record<WeatherCondition, { short: string; icon: React.ReactNode; hex: string }> = {
    'Sunny':        { short: '☀',  icon: <Sun size={16} />,           hex: '#F59E0B' },
    'Partly Cloudy':{ short: '⛅',  icon: <Cloud size={16} />,         hex: '#6B7280' },
    'Cloudy':       { short: '☁',  icon: <Cloud size={16} />,         hex: '#9CA3AF' },
    'Rain':         { short: '🌧',  icon: <CloudRain size={16} />,     hex: '#3B82F6' },
    'Heavy Rain':   { short: '⛈',  icon: <CloudRain size={16} />,     hex: '#6366F1' },
    'Thunderstorm': { short: '⚡',  icon: <CloudLightning size={16} />, hex: '#EF4444' },
  };
  return map[w] ?? { short: w, icon: <Zap size={16} />, hex: '#6B7280' };
}