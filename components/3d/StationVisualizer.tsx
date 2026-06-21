// ─────────────────────────────────────────────────────────────────────────────
// File: components/3d/StationVisualizer.tsx
// Description: Live 2D SVG Schematic of the AWLR Station with real sensor data,
//              water flow animation, and responsive layout.
// ─────────────────────────────────────────────────────────────────────────────

'use client';

import React, { useEffect, useState, useMemo } from 'react';

interface SensorData {
  tmaHydrostatic: number;
  tmaUltrasonic: number;
  rainRate: number;
  flowRate1: number;
  velocity: number;
  discharge: number;
  batteryVoltage: number;
  ewsStatus: 'AMAN' | 'WASPADA' | 'SIAGA' | 'AWAS';
}

const EWS_COLORS: Record<string, string> = {
  AMAN: '#10b981',
  WASPADA: '#eab308',
  SIAGA: '#f97316',
  AWAS: '#ef4444',
};

export default function StationVisualizer({ sensorData }: { sensorData?: SensorData }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 800);
    return () => clearInterval(interval);
  }, []);

  const d = sensorData || {
    tmaHydrostatic: 0, tmaUltrasonic: 0, rainRate: 0,
    flowRate1: 0, velocity: 0, discharge: 0,
    batteryVoltage: 12.6, ewsStatus: 'AMAN' as const,
  };

  // Hitung tinggi air relatif dalam SVG (max 5m = 250px area air)
  const maxTMA = 5.0;
  const waterHeight = Math.min(Math.max((d.tmaHydrostatic / maxTMA) * 250, 10), 250);
  const waterY = 550 - waterHeight;

  const ewsColor = EWS_COLORS[d.ewsStatus] || '#10b981';
  const beamPulse = tick % 2 === 0;

  // Partikel air mengalir (posisi bergeser setiap tick)
  const particles = useMemo(() => {
    const pts = [];
    for (let i = 0; i < 12; i++) {
      pts.push({
        x: ((i * 45 + tick * 18) % 500),
        y: waterY + 10 + (i % 3) * 30 + Math.sin(i * 1.2) * 15,
        r: 2 + (i % 3),
      });
    }
    return pts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, waterY]);

  return (
    <div className="relative w-full h-full bg-[#020617] overflow-hidden flex items-center justify-center font-mono select-none">

      {/* Efek CRT Scanline */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-20 z-10"></div>

      {/* ── SVG BLUEPRINT ── */}
      {/* viewBox="min-x min-y width height" 
          Untuk Zoom Out: Perbesar nilai width & height (contoh dari 600 650 jadi 640 700)
          Untuk Geser: Ubah min-x (kiri/kanan) dan min-y (atas/bawah) */}
      <svg
        viewBox="-50 60 700 800"
        className="w-full h-full drop-shadow-[0_0_15px_rgba(6,182,212,0.1)] relative z-0"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <pattern id="bpGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(6,182,212,0.08)" strokeWidth="0.5" />
          </pattern>

          <linearGradient id="metalGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="50%" stopColor="#475569" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>

          <linearGradient id="waterBodyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(6,182,212,0.45)" />
            <stop offset="60%" stopColor="rgba(6,182,212,0.15)" />
            <stop offset="100%" stopColor="rgba(6,182,212,0.03)" />
          </linearGradient>

          <linearGradient id="beamGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(139,92,246,0.85)" />
            <stop offset="100%" stopColor="rgba(139,92,246,0.0)" />
          </linearGradient>

          {/* Glow filter untuk data value badges */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>

          {/* Animasi gelombang permukaan air */}
          <clipPath id="waterClip">
            <rect x="0" y={waterY} width="500" height={600 - waterY} />
          </clipPath>
        </defs>

        {/* Grid */}
        <rect width="100%" height="100%" fill="url(#bpGrid)" />

        <g transform="translate(50, 20)">

          {/* ── DASAR SUNGAI ── */}
          <path d="M 0 550 Q 125 535 250 550 T 500 550 L 500 600 L 0 600 Z" fill="#0f172a" stroke="#1e293b" strokeWidth="2" />

          {/* ── BADAN AIR (tinggi dinamis berdasar TMA) ── */}
          <rect x="0" y={waterY} width="500" height={550 - waterY} fill="url(#waterBodyGrad)" />

          {/* Gelombang permukaan air animatif */}
          <path
            d={`M 0 ${waterY} Q 60 ${waterY - 4 + (tick % 2) * 8} 125 ${waterY} T 250 ${waterY} T 375 ${waterY} T 500 ${waterY}`}
            fill="none" stroke="#06b6d4" strokeWidth="1.5" opacity="0.8"
          />
          <path
            d={`M 0 ${waterY + 3} Q 80 ${waterY + 7 - (tick % 2) * 6} 160 ${waterY + 3} T 320 ${waterY + 3} T 500 ${waterY + 3}`}
            fill="none" stroke="#06b6d4" strokeWidth="0.8" opacity="0.4"
          />

          {/* Partikel air mengalir */}
          {particles.map((p, i) => (
            <circle key={i} cx={p.x} cy={Math.min(p.y, 545)} r={p.r} fill="#06b6d4" opacity={0.15 + (i % 3) * 0.08}>
              <animate attributeName="opacity" values={`${0.1 + (i % 3) * 0.06};${0.25 + (i % 3) * 0.08};${0.1 + (i % 3) * 0.06}`} dur="2s" repeatCount="indefinite" />
            </circle>
          ))}

          {/* Label Elevasi Permukaan */}
          <text x="15" y={waterY - 8} fill="#06b6d4" fontSize="9" letterSpacing="1.5" fontWeight="bold">ELEVASI PERMUKAAN AIR</text>

          {/* ── STRUKTUR UTAMA ── */}
          {/* Tiang Pancang */}
          <rect x="230" y="80" width="40" height="500" fill="url(#metalGrad)" stroke="#64748b" strokeWidth="1" />
          <rect x="220" y="575" width="60" height="20" fill="#334155" stroke="#475569" strokeWidth="1.5" />

          {/* Girder Atas */}
          <rect x="80" y="100" width="300" height="22" fill="url(#metalGrad)" stroke="#64748b" strokeWidth="1" />
          <circle cx="250" cy="111" r="3.5" fill="#0f172a" stroke="#64748b" strokeWidth="1" />
          <circle cx="235" cy="111" r="2.5" fill="#0f172a" />
          <circle cx="265" cy="111" r="2.5" fill="#0f172a" />

          {/* Jalur Kabel */}
          <path d="M 235 122 L 235 470" stroke="#14b8a6" strokeWidth="1.5" fill="none" opacity="0.5" strokeDasharray="4 3" />
          <path d="M 320 122 L 320 200 L 260 200 L 260 235" stroke="#8b5cf6" strokeWidth="1.5" fill="none" opacity="0.5" strokeDasharray="4 3" />

          {/* ── SENSOR 1: A02YYUW ULTRASONIC ── */}
          <g transform="translate(305, 122)">
            <rect x="0" y="0" width="28" height="22" fill="#1e293b" stroke="#8b5cf6" strokeWidth="1.5" rx="2" />
            <rect x="4" y="22" width="20" height="8" fill="#0f172a" stroke="#8b5cf6" strokeWidth="1" rx="1" />
            {/* Beam */}
            <path
              d={`M 4 30 L ${-15} ${waterY - 122} L ${43} ${waterY - 122} L 24 30 Z`}
              fill="url(#beamGrad)"
              opacity={beamPulse ? 0.7 : 0.15}
              style={{ transition: 'opacity 0.4s ease' }}
            />
            {/* Pulse rings */}
            <circle cx="14" cy="30" r={beamPulse ? 18 : 8} fill="none" stroke="#8b5cf6"
              strokeWidth="0.8" opacity={beamPulse ? 0.6 : 0}
              style={{ transition: 'all 0.5s ease' }}
            />
          </g>

          {/* ── SENSOR 2: QDY30A HYDROSTATIC ── */}
          <g transform="translate(210, 470)">
            <rect x="0" y="0" width="18" height="55" fill="#1e293b" stroke="#14b8a6" strokeWidth="1.5" rx="2" />
            <path d="M 1 55 L 17 55 L 14 65 L 4 65 Z" fill="#0f172a" stroke="#14b8a6" strokeWidth="1" />
            <line x1="9" y1="-280" x2="9" y2="0" stroke="#14b8a6" strokeWidth="1.5" opacity="0.4" />
            {/* Glow ketika terendam */}
            {d.tmaHydrostatic > 0 && (
              <circle cx="9" cy="35" r="6" fill="#14b8a6" opacity="0.3">
                <animate attributeName="r" values="4;8;4" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.2;0.5;0.2" dur="2s" repeatCount="indefinite" />
              </circle>
            )}
          </g>

          {/* ── SENSOR 3: OMBROMETER ── */}
          <g transform="translate(90, 55)">
            <path d="M 0 0 L 38 0 L 33 42 L 5 42 Z" fill="#1e293b" stroke="#0ea5e9" strokeWidth="1.5" />
            <rect x="14" y="42" width="10" height="13" fill="#334155" />
            <circle cx="19" cy="22" r="3.5" fill="#0f172a" stroke="#0ea5e9" />
            {/* Tetesan hujan animatif */}
            {d.rainRate > 0 && (
              <>
                <line x1="8" y1={-10 - (tick % 3) * 4} x2="8" y2={-5 - (tick % 3) * 4} stroke="#38bdf8" strokeWidth="1.5" opacity="0.7" />
                <line x1="19" y1={-14 - ((tick + 1) % 3) * 4} x2="19" y2={-9 - ((tick + 1) % 3) * 4} stroke="#38bdf8" strokeWidth="1.5" opacity="0.5" />
                <line x1="30" y1={-8 - ((tick + 2) % 3) * 4} x2="30" y2={-3 - ((tick + 2) % 3) * 4} stroke="#38bdf8" strokeWidth="1.5" opacity="0.6" />
              </>
            )}
          </g>

          {/* ── PANEL KONTROL ESP32 ── */}
          <g transform="translate(215, 235)">
            <rect x="0" y="0" width="70" height="85" fill="#020617" stroke="#3b82f6" strokeWidth="2" rx="3" />
            {/* Antena LoRa */}
            <line x1="70" y1="8" x2="88" y2="-18" stroke="#3b82f6" strokeWidth="2.5" />
            <circle cx="88" cy="-18" r="3" fill="#60a5fa" opacity={beamPulse ? 1 : 0.3} style={{ transition: 'opacity 0.4s' }} />
            {/* LED Status */}
            <circle cx="14" cy="14" r="3.5" fill={ewsColor}>
              <animate attributeName="opacity" values="0.6;1;0.6" dur="1.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="28" cy="14" r="3.5" fill={d.batteryVoltage < 11.5 ? '#ef4444' : '#10b981'} />
            <rect x="8" y="28" width="54" height="44" fill="#0f172a" rx="2" />
            <text x="13" y="44" fill="#60a5fa" fontSize="8" fontWeight="bold">WGG-01</text>
            <text x="13" y="56" fill="#94a3b8" fontSize="7">ESP32-S3</text>
            <text x="13" y="66" fill={ewsColor} fontSize="7" fontWeight="bold">{d.ewsStatus}</text>
          </g>

          {/* ═══ LIVE DATA BADGES ═══ */}

          {/* Badge: TMA Ultrasonik */}
          <g filter="url(#glow)">
            <rect x="395" y="75" width="110" height="52" fill="#020617" stroke="#8b5cf6" strokeWidth="1.2" rx="6" opacity="0.95" />
            <text x="405" y="92" fill="#a78bfa" fontSize="8" fontWeight="bold" letterSpacing="1">A02YYUW</text>
            <text x="405" y="108" fill="#c4b5fd" fontSize="7">ULTRASONIK</text>
            <text x="405" y="122" fill="#e9d5ff" fontSize="14" fontWeight="bold" fontFamily="monospace">
              {d.tmaUltrasonic.toFixed(2)}
              <tspan fill="#94a3b8" fontSize="8"> m</tspan>
            </text>
            <line x1="395" y1="101" x2="350" y2="135" stroke="#8b5cf6" strokeWidth="0.8" opacity="0.6" />
          </g>

          {/* Badge: TMA Hidrostatik */}
          <g filter="url(#glow)">
            <rect x="10" y="385" width="115" height="52" fill="#020617" stroke="#14b8a6" strokeWidth="1.2" rx="6" opacity="0.95" />
            <text x="20" y="402" fill="#2dd4bf" fontSize="8" fontWeight="bold" letterSpacing="1">QDY30A</text>
            <text x="20" y="414" fill="#5eead4" fontSize="7">HIDROSTATIK</text>
            <text x="20" y="432" fill="#a7f3d0" fontSize="14" fontWeight="bold" fontFamily="monospace">
              {d.tmaHydrostatic.toFixed(3)}
              <tspan fill="#94a3b8" fontSize="8"> m</tspan>
            </text>
            <line x1="125" y1="411" x2="210" y2="490" stroke="#14b8a6" strokeWidth="0.8" opacity="0.6" />
          </g>

          {/* Badge: Curah Hujan */}
          <g filter="url(#glow)">
            <rect x="10" y="100" width="68" height="48" fill="#020617" stroke="#0ea5e9" strokeWidth="1.2" rx="6" opacity="0.95" />
            <text x="17" y="116" fill="#38bdf8" fontSize="7.5" fontWeight="bold">HUJAN</text>
            <text x="17" y="139" fill="#bae6fd" fontSize="13" fontWeight="bold" fontFamily="monospace">
              {d.rainRate.toFixed(1)}
              <tspan fill="#94a3b8" fontSize="7"> mm</tspan>
            </text>
            <line x1="78" y1="124" x2="90" y2="85" stroke="#0ea5e9" strokeWidth="0.8" opacity="0.6" />
          </g>

          {/* Badge: Flow & Debit */}
          <g filter="url(#glow)">
            <rect x="370" y="290" width="125" height="62" fill="#020617" stroke="#3b82f6" strokeWidth="1.2" rx="6" opacity="0.95" />
            <text x="380" y="306" fill="#60a5fa" fontSize="8" fontWeight="bold" letterSpacing="1">ESP32 TX</text>
            <text x="380" y="320" fill="#94a3b8" fontSize="7">Debit</text>
            <text x="418" y="320" fill="#93c5fd" fontSize="10" fontWeight="bold" fontFamily="monospace">
              {d.discharge.toFixed(2)}
              <tspan fill="#64748b" fontSize="7"> m³/s</tspan>
            </text>
            <text x="380" y="335" fill="#94a3b8" fontSize="7">Arus</text>
            <text x="418" y="335" fill="#93c5fd" fontSize="10" fontWeight="bold" fontFamily="monospace">
              {d.velocity.toFixed(2)}
              <tspan fill="#64748b" fontSize="7"> m/s</tspan>
            </text>
            <text x="380" y="348" fill="#94a3b8" fontSize="7">Batt</text>
            <text x="418" y="348" fill={d.batteryVoltage < 11.5 ? '#fca5a5' : '#86efac'} fontSize="10" fontWeight="bold" fontFamily="monospace">
              {d.batteryVoltage.toFixed(1)}
              <tspan fill="#64748b" fontSize="7"> V</tspan>
            </text>
            <line x1="370" y1="310" x2="293" y2="280" stroke="#3b82f6" strokeWidth="0.8" opacity="0.6" />
          </g>

          {/* ── GARIS UKUR ELEVASI ── */}
          <line x1="520" y1="100" x2="520" y2="550" stroke="#334155" strokeWidth="0.8" />
          <path d="M 516 100 L 524 100 M 516 550 L 524 550" stroke="#334155" strokeWidth="0.8" />
          <text x="528" y="330" fill="#64748b" fontSize="8" transform="rotate(-90 528 330)" letterSpacing="2">MAX 5.0m</text>

          {/* Garis TMA aktual */}
          <line x1="0" y1={waterY} x2="520" y2={waterY} stroke={ewsColor} strokeWidth="1" strokeDasharray="6 3" opacity="0.7" />
          <rect x="435" y={waterY - 10} width="80" height="18" fill="#020617" stroke={ewsColor} strokeWidth="1" rx="3" opacity="0.9" />
          <text x="445" y={waterY + 3} fill={ewsColor} fontSize="9" fontWeight="bold" fontFamily="monospace">
            TMA {d.tmaHydrostatic.toFixed(2)}m
          </text>

          {/* ── AMBANG BATAS EWS ── */}
          {/* AWAS 3.50m */}
          <line x1="0" y1={550 - (3.5 / 5) * 250} x2="500" y2={550 - (3.5 / 5) * 250} stroke="#ef4444" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.5" />
          <text x="5" y={550 - (3.5 / 5) * 250 - 3} fill="#ef4444" fontSize="7" opacity="0.7">AWAS 3.5m</text>

          {/* SIAGA 2.80m */}
          <line x1="0" y1={550 - (2.8 / 5) * 250} x2="500" y2={550 - (2.8 / 5) * 250} stroke="#f97316" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.5" />
          <text x="5" y={550 - (2.8 / 5) * 250 - 3} fill="#f97316" fontSize="7" opacity="0.7">SIAGA 2.8m</text>

          {/* WASPADA 2.00m */}
          <line x1="0" y1={550 - (2.0 / 5) * 250} x2="500" y2={550 - (2.0 / 5) * 250} stroke="#eab308" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.5" />
          <text x="5" y={550 - (2.0 / 5) * 250 - 3} fill="#eab308" fontSize="7" opacity="0.7">WASPADA 2.0m</text>

          {/* ── CROSSHAIRS SUDUT ── */}
          <path d="M 0 18 L 0 0 L 18 0" fill="none" stroke="#06b6d4" strokeWidth="1.5" opacity="0.5" />
          <path d="M 540 18 L 540 0 L 522 0" fill="none" stroke="#06b6d4" strokeWidth="1.5" opacity="0.5" />
          <path d="M 0 582 L 0 600 L 18 600" fill="none" stroke="#06b6d4" strokeWidth="1.5" opacity="0.5" />
          <path d="M 540 582 L 540 600 L 522 600" fill="none" stroke="#06b6d4" strokeWidth="1.5" opacity="0.5" />

        </g>
      </svg>
    </div>
  );
}