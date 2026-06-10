// ─────────────────────────────────────────────────────────────────────────────
// hooks/useTelemetry.ts
// Simulates a WebSocket telemetry stream using setInterval.
// In production, replace the interval with an actual WebSocket connection:
//   const ws = new WebSocket('wss://your-gateway/telemetry');
//   ws.onmessage = (e) => setPayload(JSON.parse(e.data));
// ─────────────────────────────────────────────────────────────────────────────

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { SensorPayload, HistoricalReading } from '@/types/awlr';
import { INITIAL_PAYLOAD, simulateTelemetryTick } from '@/lib/ews-engine';

const TICK_INTERVAL_MS   = 2_000; // 2-second update cadence
const HISTORY_MAX_POINTS = 60;    // Keep 2 minutes of data in chart buffer

interface TelemetryState {
  /** Latest sensor payload */
  payload:   SensorPayload;
  /** Rolling time-series buffer for ECharts */
  history:   HistoricalReading[];
  /** Whether the simulated stream is connected */
  connected: boolean;
  /** Time of last received tick */
  lastTick:  Date;
  /** Pause / resume the stream */
  toggleStream: () => void;
}

export function useTelemetry(): TelemetryState {
  const [payload,   setPayload]   = useState<SensorPayload>(INITIAL_PAYLOAD);
  const [history,   setHistory]   = useState<HistoricalReading[]>([]);
  const [connected, setConnected] = useState(true);
  const [lastTick,  setLastTick]  = useState(new Date());

  // Use ref so the interval closure always reads the latest payload
  const payloadRef = useRef<SensorPayload>(INITIAL_PAYLOAD);
  payloadRef.current = payload;

  const connectedRef = useRef(true);
  connectedRef.current = connected;

  // Seed initial history with 30 stable points
  useEffect(() => {
    const seed: HistoricalReading[] = Array.from({ length: 30 }, (_, i) => ({
      timestamp:  new Date(Date.now() - (30 - i) * TICK_INTERVAL_MS).toISOString(),
      waterLevel: INITIAL_PAYLOAD.waterLevelQDY + (Math.random() - 0.5) * 0.1,
      rainfall:   INITIAL_PAYLOAD.rainfall       + (Math.random() - 0.5) * 2,
    }));
    setHistory(seed);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      if (!connectedRef.current) return;

      const next = simulateTelemetryTick(payloadRef.current);
      setPayload(next);
      setLastTick(new Date());

      // Append to rolling history buffer
      setHistory(prev => {
        const entry: HistoricalReading = {
          timestamp:  next.timestamp,
          waterLevel: next.waterLevelQDY,
          rainfall:   next.rainfall,
        };
        const updated = [...prev, entry];
        return updated.length > HISTORY_MAX_POINTS
          ? updated.slice(updated.length - HISTORY_MAX_POINTS)
          : updated;
      });
    }, TICK_INTERVAL_MS);

    return () => clearInterval(id);
  }, []); // ← intentionally empty; uses refs for fresh values

  const toggleStream = useCallback(() => {
    setConnected(prev => !prev);
  }, []);

  return { payload, history, connected, lastTick, toggleStream };
}