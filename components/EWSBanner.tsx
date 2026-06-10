// ─────────────────────────────────────────────────────────────────────────────
// components/ui/EWSBanner.tsx
// Header banner displaying node name, timestamp, and EWS status.
// Pulses with Framer Motion when status is SIAGA or AWAS.
// ─────────────────────────────────────────────────────────────────────────────

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Wifi, Clock, ShieldAlert, ShieldCheck } from 'lucide-react';
import type { EWSStatus, SensorPayload } from '@/types/awlr';
import { EWS_CONFIG, formatBattery, formatRSSI } from '@/lib/ews-engine';
import { cn, formatDateTime } from '@/lib/utils';

interface EWSBannerProps {
  payload:   SensorPayload;
  connected: boolean;
}

export function EWSBanner({ payload, connected }: EWSBannerProps) {
  const cfg    = EWS_CONFIG[payload.ewsStatus];
  const isCrit = payload.ewsStatus === 'SIAGA' || payload.ewsStatus === 'AWAS';

  return (
    <div className="relative overflow-hidden">
      {/* Dynamic tinted top border based on EWS status */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] transition-colors duration-700"
        style={{ background: `linear-gradient(90deg, transparent, ${cfg.hex}, transparent)` }}
      />

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between px-6 py-4">
        {/* ── Left: Node identity ───────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-card flex items-center justify-center border',
            cfg.bg, cfg.border,
          )}>
            {isCrit
              ? <ShieldAlert size={20} className={cfg.color} />
              : <ShieldCheck size={20} className="text-status-aman" />
            }
          </div>
          <div>
            <h1 className="text-base font-bold text-text-primary leading-none">
              {payload.nodeName}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <MapPin size={11} className="text-text-muted" />
              <span className="text-xs text-text-muted font-mono">
                {payload.nodeId}
              </span>
              <span className="text-text-muted/40">·</span>
              <Clock size={11} className="text-text-muted" />
              <span className="text-xs text-text-muted font-mono">
                {formatDateTime(payload.timestamp)}
              </span>
            </div>
          </div>
        </div>

        {/* ── Center: Hardware status indicators ───────────────────────────── */}
        <div className="flex items-center gap-4">
          <HardwarePill
            icon={<BatteryIcon pct={formatBattery(payload.batteryVoltage)} />}
            label={`${formatBattery(payload.batteryVoltage)}%`}
            sub="Battery"
            ok={formatBattery(payload.batteryVoltage) > 30}
          />
          <HardwarePill
            icon={<Wifi size={13} />}
            label={`${payload.rssi} dBm`}
            sub={formatRSSI(payload.rssi).label}
            ok={formatRSSI(payload.rssi).bars >= 2}
          />
          <HardwarePill
            icon={<div className={cn('w-2 h-2 rounded-full', connected ? 'bg-status-aman animate-pulse' : 'bg-status-awas')} />}
            label={connected ? 'LIVE' : 'OFFLINE'}
            sub="Telemetry"
            ok={connected}
          />
        </div>

        {/* ── Right: EWS Status chip ────────────────────────────────────────── */}
        <div className="flex items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={payload.ewsStatus}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1,    opacity: 1 }}
              exit={{    scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              {isCrit ? (
                // Pulsing chip for critical states
                <motion.div
                  className={cn('ews-chip', cfg.color, cfg.bg, cfg.border)}
                  animate={{
                    boxShadow: [
                      `0 0 0 0 ${cfg.hex}40`,
                      `0 0 0 8px ${cfg.hex}00`,
                    ],
                  }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
                >
                  <motion.span
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                    className="w-2 h-2 rounded-full"
                    style={{ background: cfg.hex }}
                  />
                  {cfg.label}
                </motion.div>
              ) : (
                // Static chip for safe states
                <div className={cn('ews-chip', cfg.color, cfg.bg, cfg.border)}>
                  <span className="w-2 h-2 rounded-full" style={{ background: cfg.hex }} />
                  {cfg.label}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* EWS description bar (only shown for non-normal states) */}
      <AnimatePresence>
        {payload.ewsStatus !== 'AMAN' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{    height: 0,      opacity: 0 }}
            transition={{ duration: 0.25 }}
            className={cn('overflow-hidden border-t', cfg.border)}
          >
            <div className={cn('px-6 py-2 text-xs font-mono', cfg.color)}>
              ⚠ {cfg.description}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Hardware pill sub-component ───────────────────────────────────────────────
function HardwarePill({ icon, label, sub, ok }: {
  icon:  React.ReactNode;
  label: string;
  sub:   string;
  ok:    boolean;
}) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-bg-card border border-border">
      <span className={ok ? 'text-status-aman' : 'text-status-awas'}>{icon}</span>
      <div>
        <p className={cn('text-xs font-mono font-bold leading-none', ok ? 'text-text-primary' : 'text-status-awas')}>
          {label}
        </p>
        <p className="text-[10px] text-text-muted mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

// ── Simple inline battery icon ────────────────────────────────────────────────
function BatteryIcon({ pct }: { pct: number }) {
  const color = pct > 60 ? '#10B981' : pct > 30 ? '#F59E0B' : '#EF4444';
  return (
    <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
      <rect x="0.5" y="0.5" width="13" height="9" rx="1.5" stroke={color} strokeWidth="1" />
      <rect x="14" y="3" width="2" height="4" rx="0.5" fill={color} opacity={0.6} />
      <rect x="1.5" y="1.5" width={Math.round(pct / 100 * 10)} height="7" rx="1" fill={color} />
    </svg>
  );
}