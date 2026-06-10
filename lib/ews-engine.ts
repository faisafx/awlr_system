// ─────────────────────────────────────────────────────────────────────────────
// lib/ews-engine.ts — Early Warning System Rule Engine
// Evaluates sensor data against configurable thresholds and returns EWS status.
// ─────────────────────────────────────────────────────────────────────────────

import type { EWSStatus, EWSThresholds, SensorPayload, WeatherCondition } from '@/types/awlr';

// Default thresholds (Sungai Wanggu, Kendari — configurable via /alarms page)
export const DEFAULT_THRESHOLDS: EWSThresholds = {
  waspada: { waterLevel: 1.5, rainfall: 20  },
  siaga:   { waterLevel: 2.5, rainfall: 50  },
  awas:    { waterLevel: 3.5, rainfall: 80  },
};

/**
 * Core Rule Engine: Evaluates the composite EWS status from sensor readings.
 * Priority: AWAS > SIAGA > WASPADA > AMAN
 * Multi-parameter compound rule: both water level AND rainfall must exceed
 * a threshold level for SIAGA and AWAS to trigger (single-parameter triggers WASPADA).
 */
export function evaluateEWSStatus(
  waterLevel: number,
  rainfall: number,
  thresholds: EWSThresholds = DEFAULT_THRESHOLDS,
): EWSStatus {
  const { waspada, siaga, awas } = thresholds;

  // AWAS: Both parameters exceed critical thresholds
  if (waterLevel >= awas.waterLevel && rainfall >= awas.rainfall) return 'AWAS';

  // SIAGA: Both parameters exceed alert thresholds (as per spec)
  if (waterLevel >= siaga.waterLevel && rainfall >= siaga.rainfall) return 'SIAGA';

  // WASPADA: Either parameter alone exceeds watch threshold
  if (waterLevel >= waspada.waterLevel || rainfall >= waspada.rainfall) return 'WASPADA';

  return 'AMAN';
}

// ─────────────────────────────────────────────────────────────────────────────
// Simulation Utilities — WebSocket data stream substitute
// ─────────────────────────────────────────────────────────────────────────────

/** Clamp a value between min and max */
const clamp = (v: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, v));

/** Add bounded random walk noise to a value */
const jitter = (v: number, magnitude: number, min: number, max: number): number =>
  clamp(v + (Math.random() - 0.5) * 2 * magnitude, min, max);

/** Weather conditions weighted toward rain-likely scenario for demo */
const WEATHER_POOL: WeatherCondition[] = [
  'Sunny', 'Partly Cloudy', 'Cloudy', 'Cloudy', 'Rain', 'Rain', 'Heavy Rain',
];

/**
 * Simulates the next telemetry tick from a simulated WebSocket stream.
 * Called every 2 seconds to produce realistic-looking sensor drift.
 */
export function simulateTelemetryTick(prev: SensorPayload): SensorPayload {
  const waterLevelQDY      = jitter(prev.waterLevelQDY,      0.04, 0.1, 4.5);
  const waterLevelUltrasonic = jitter(prev.waterLevelUltrasonic, 0.03, 0.1, 4.5);
  const rainfall           = jitter(prev.rainfall,           2.0,  0,   120);
  const batteryVoltage     = jitter(prev.batteryVoltage,     0.01, 11.5, 14.2);
  const rssi               = Math.round(jitter(prev.rssi,    1,   -110, -50));
  const temperature        = jitter(prev.temperature,        0.1,  20,  40);
  const humidity           = jitter(prev.humidity,           0.5,  40,  98);

  // Occasionally change weather (10% chance per tick)
  const weatherStatus = Math.random() < 0.1
    ? WEATHER_POOL[Math.floor(Math.random() * WEATHER_POOL.length)]
    : prev.weatherStatus;

  const ewsStatus = evaluateEWSStatus(waterLevelQDY, rainfall);

  return {
    ...prev,
    timestamp: new Date().toISOString(),
    waterLevelQDY:       parseFloat(waterLevelQDY.toFixed(3)),
    waterLevelUltrasonic: parseFloat(waterLevelUltrasonic.toFixed(3)),
    rainfall:            parseFloat(rainfall.toFixed(1)),
    batteryVoltage:      parseFloat(batteryVoltage.toFixed(2)),
    rssi,
    temperature:         parseFloat(temperature.toFixed(1)),
    humidity:            parseFloat(humidity.toFixed(1)),
    weatherStatus,
    ewsStatus,
  };
}

/** Initial seed payload for Sungai Wanggu Node */
export const INITIAL_PAYLOAD: SensorPayload = {
  timestamp:             new Date().toISOString(),
  nodeId:               'NODE-WGG-01',
  nodeName:             'Sungai Wanggu Node',
  waterLevelQDY:        1.24,
  waterLevelUltrasonic: 1.19,
  rainfall:             12.5,
  weatherStatus:        'Partly Cloudy',
  batteryVoltage:       13.1,
  rssi:                 -72,
  temperature:          28.4,
  humidity:             74.2,
  ewsStatus:            'AMAN',
};

// ─────────────────────────────────────────────────────────────────────────────
// EWS Display Helpers
// ─────────────────────────────────────────────────────────────────────────────

export const EWS_CONFIG: Record<EWSStatus, {
  label:      string;
  color:      string;       // Tailwind text class
  bg:         string;       // Tailwind bg class
  border:     string;       // Tailwind border class
  glow:       string;       // Tailwind shadow class
  hex:        string;       // Raw hex for Three.js / ECharts
  pulse:      boolean;      // Whether to animate the status badge
  description: string;
}> = {
  AMAN: {
    label:       'AMAN',
    color:       'text-status-aman',
    bg:          'bg-status-aman/10',
    border:      'border-status-aman/30',
    glow:        'shadow-glow-green',
    hex:         '#10B981',
    pulse:       false,
    description: 'Kondisi Normal — Water level within safe range.',
  },
  WASPADA: {
    label:       'WASPADA',
    color:       'text-status-waspada',
    bg:          'bg-status-waspada/10',
    border:      'border-status-waspada/30',
    glow:        '',
    hex:         '#F59E0B',
    pulse:       false,
    description: 'Status Waspada — Elevated water level. Monitor closely.',
  },
  SIAGA: {
    label:       'SIAGA',
    color:       'text-status-siaga',
    bg:          'bg-status-siaga/10',
    border:      'border-status-siaga/30',
    glow:        '',
    hex:         '#F97316',
    pulse:       true,
    description: 'Status Siaga — Critical threshold exceeded. Alert communities.',
  },
  AWAS: {
    label:       'AWAS',
    color:       'text-status-awas',
    bg:          'bg-status-awas/10',
    border:      'border-status-awas/30',
    glow:        'shadow-card-red',
    hex:         '#EF4444',
    pulse:       true,
    description: 'BAHAYA — Immediate evacuation may be required!',
  },
};

/** Format RSSI into a human-readable signal strength label */
export function formatRSSI(rssi: number): { label: string; bars: number } {
  if (rssi >= -70) return { label: 'Excellent', bars: 4 };
  if (rssi >= -80) return { label: 'Good',      bars: 3 };
  if (rssi >= -90) return { label: 'Fair',       bars: 2 };
  return              { label: 'Poor',       bars: 1 };
}

/** Format battery voltage into a percentage estimate for LiFePO4-like profile */
export function formatBattery(voltage: number): number {
  const pct = ((voltage - 11.5) / (14.2 - 11.5)) * 100;
  return Math.round(clamp(pct, 0, 100));
}