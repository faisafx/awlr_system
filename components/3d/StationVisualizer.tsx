// ─────────────────────────────────────────────────────────────────────────────
// File: components/3d/StationVisualizer.tsx (Diubah menjadi 2D Blueprint)
// Description: Lightweight, high-performance 2D SVG Schematic of the AWLR Station.
// Features: Zero dependencies, JARVIS HUD aesthetic, embedded CSS animations,
//           and technical measurement annotations.
// ─────────────────────────────────────────────────────────────────────────────

'use client';

import React, { useEffect, useState } from 'react';

export default function StationVisualizer() {
  const [beamPulse, setBeamPulse] = useState(false);

  // Animasi gelombang ultrasonik mandiri
  useEffect(() => {
    const interval = setInterval(() => {
      setBeamPulse(prev => !prev);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-full bg-[#020617] overflow-hidden flex items-center justify-center p-2 font-mono select-none">
      
      {/* Efek CRT Scanline Background */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-30 z-10"></div>
      
      {/* ── 2D SVG BLUEPRINT ENGINE ── */}
      <svg 
        viewBox="0 0 600 700" 
        className="w-full h-full max-h-full drop-shadow-[0_0_15px_rgba(6,182,212,0.1)] relative z-0"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Pola Grid Blueprint */}
          <pattern id="blueprintGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <rect width="40" height="40" fill="none" />
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(6, 182, 212, 0.1)" strokeWidth="1" />
          </pattern>
          <pattern id="blueprintGridSmall" width="10" height="10" patternUnits="userSpaceOnUse">
            <rect width="10" height="10" fill="none" />
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(6, 182, 212, 0.03)" strokeWidth="0.5" />
          </pattern>

          {/* Gradien Material Metal & Air */}
          <linearGradient id="metalGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="50%" stopColor="#475569" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>
          
          <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(6, 182, 212, 0.4)" />
            <stop offset="100%" stopColor="rgba(6, 182, 212, 0.05)" />
          </linearGradient>

          <linearGradient id="beamGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(139, 92, 246, 0.8)" />
            <stop offset="100%" stopColor="rgba(139, 92, 246, 0.0)" />
          </linearGradient>
        </defs>

        {/* Render Latar Belakang Grid */}
        <rect width="100%" height="100%" fill="url(#blueprintGridSmall)" />
        <rect width="100%" height="100%" fill="url(#blueprintGrid)" />

        <g transform="translate(50, 50)">
          
          {/* ── ELEMEN ALAM (Dasar Sungai & Air) ── */}
          <path d="M 0 550 Q 150 540 250 550 T 500 550 L 500 600 L 0 600 Z" fill="#0f172a" stroke="#1e293b" strokeWidth="2" />
          <rect x="0" y="350" width="500" height="200" fill="url(#waterGrad)" />
          <line x1="0" y1="350" x2="500" y2="350" stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="4 4" className="animate-[pulse_2s_ease-in-out_infinite]" />
          <text x="15" y="340" fill="#06b6d4" fontSize="12" letterSpacing="1">ELEVASI PERMUKAAN AIR</text>

          {/* ── STRUKTUR UTAMA (Tiang & Girder) ── */}
          {/* Tiang Pancang / Stilling Well */}
          <rect x="230" y="100" width="40" height="480" fill="url(#metalGrad)" stroke="#64748b" strokeWidth="1" />
          <rect x="220" y="580" width="60" height="20" fill="#334155" stroke="#475569" strokeWidth="1.5" />
          
          {/* Lengan Penahan (Girder Atas) */}
          <rect x="90" y="120" width="280" height="25" fill="url(#metalGrad)" stroke="#64748b" strokeWidth="1" />
          {/* Baut penyambung girder */}
          <circle cx="250" cy="132.5" r="4" fill="#0f172a" stroke="#64748b" strokeWidth="1" />
          <circle cx="235" cy="132.5" r="3" fill="#0f172a" />
          <circle cx="265" cy="132.5" r="3" fill="#0f172a" />

          {/* Jalur Kabel (Conduit) */}
          <path d="M 235 145 L 235 480" stroke="#06b6d4" strokeWidth="2" fill="none" opacity="0.6" />
          <path d="M 320 145 L 320 220 L 260 220 L 260 250" stroke="#8b5cf6" strokeWidth="2" fill="none" opacity="0.6" />

          {/* ── SENSOR 1: A02YYUW ULTRASONIC (Kanan) ── */}
          <g transform="translate(305, 145)">
            <rect x="0" y="0" width="30" height="25" fill="#1e293b" stroke="#8b5cf6" strokeWidth="1.5" />
            <rect x="5" y="25" width="20" height="10" fill="#0f172a" stroke="#8b5cf6" strokeWidth="1" />
            {/* Gelombang Pancar */}
            <path 
              d="M 5 35 L -20 350 L 50 350 L 25 35 Z" 
              fill="url(#beamGrad)" 
              className={beamPulse ? "opacity-100 transition-opacity duration-300" : "opacity-30 transition-opacity duration-300"} 
            />
          </g>

          {/* ── SENSOR 2: QDY30A HYDROSTATIC (Bawah Kiri) ── */}
          <g transform="translate(210, 480)">
            <rect x="0" y="0" width="20" height="60" fill="#1e293b" stroke="#14b8a6" strokeWidth="1.5" />
            {/* Filter Diafragma */}
            <path d="M 2 60 L 18 60 L 15 70 L 5 70 Z" fill="#0f172a" stroke="#14b8a6" strokeWidth="1" />
            <line x1="10" y1="-300" x2="10" y2="0" stroke="#14b8a6" strokeWidth="2" />
          </g>

          {/* ── SENSOR 3: OMBROMETER (Kiri Atas) ── */}
          <g transform="translate(100, 75)">
            <path d="M 0 0 L 40 0 L 35 45 L 5 45 Z" fill="#1e293b" stroke="#0ea5e9" strokeWidth="1.5" />
            <rect x="15" y="45" width="10" height="15" fill="#334155" />
            {/* Tipping Bucket Mekanisme */}
            <circle cx="20" cy="25" r="4" fill="#0f172a" stroke="#0ea5e9" />
          </g>

          {/* ── PANEL KONTROL / BOX ESP32 (Tengah) ── */}
          <g transform="translate(215, 250)">
            <rect x="0" y="0" width="70" height="90" fill="#020617" stroke="#3b82f6" strokeWidth="2" />
            {/* Antena LoRa */}
            <line x1="70" y1="10" x2="90" y2="-20" stroke="#3b82f6" strokeWidth="3" />
            <circle cx="90" cy="-20" r="3" fill="#60a5fa" className="animate-ping" />
            {/* Lampu Indikator Box */}
            <circle cx="15" cy="15" r="4" fill="#10b981" className="animate-pulse" />
            <circle cx="30" cy="15" r="4" fill="#ef4444" />
            <rect x="10" y="30" width="50" height="40" fill="#1e293b" />
            <text x="15" y="55" fill="#60a5fa" fontSize="9">NODE-01</text>
          </g>

          {/* ── GARIS UKUR & ANOTASI HUD (DIMENSIONAL LINES) ── */}
          <g className="text-slate-400" fontSize="10">
            {/* Garis Ukur Tinggi Total */}
            <line x1="450" y1="120" x2="450" y2="550" stroke="#475569" strokeWidth="1" />
            <path d="M 445 120 L 455 120 M 445 550 L 455 550" stroke="#475569" strokeWidth="1" />
            <text x="460" y="340" fill="#94a3b8" transform="rotate(-90 460 340)" letterSpacing="2">ELEVASI MAKS: 5.0m</text>

            {/* Label QDY30A */}
            <polyline points="190,520 140,520 110,490" fill="none" stroke="#14b8a6" strokeWidth="1" />
            <rect x="15" y="465" width="105" height="40" fill="#020617" stroke="#14b8a6" strokeWidth="1" />
            <text x="25" y="482" fill="#2dd4bf" fontSize="11" fontWeight="bold">QDY30A</text>
            <text x="25" y="497" fill="#94a3b8" fontSize="9">SUBMERGED</text>

            {/* Label A02YYUW */}
            <polyline points="350,160 400,160 420,130" fill="none" stroke="#8b5cf6" strokeWidth="1" />
            <rect x="410" y="95" width="115" height="40" fill="#020617" stroke="#8b5cf6" strokeWidth="1" />
            <text x="420" y="112" fill="#a78bfa" fontSize="11" fontWeight="bold">A02YYUW</text>
            <text x="420" y="127" fill="#94a3b8" fontSize="9">ULTRASONIC</text>

            {/* Label Ombrometer */}
            <polyline points="75,90 40,90 20,110" fill="none" stroke="#0ea5e9" strokeWidth="1" />
            <rect x="5" y="115" width="120" height="40" fill="#020617" stroke="#0ea5e9" strokeWidth="1" />
            <text x="15" y="132" fill="#38bdf8" fontSize="11" fontWeight="bold">OMBROMETER</text>
            <text x="15" y="147" fill="#94a3b8" fontSize="9">TIPPING BUCKET</text>

            {/* Label Panel Box */}
            <polyline points="295,300 350,300 370,320" fill="none" stroke="#3b82f6" strokeWidth="1" />
            <rect x="365" y="325" width="135" height="40" fill="#020617" stroke="#3b82f6" strokeWidth="1" />
            <text x="375" y="342" fill="#60a5fa" fontSize="11" fontWeight="bold">ESP32 TX PANEL</text>
            <text x="375" y="357" fill="#94a3b8" fontSize="9">LORA 921.4 MHz</text>
          </g>

          {/* ── CROSSHAIRS / DEKORASI SUDUT ── */}
          <path d="M 0 20 L 0 0 L 20 0" fill="none" stroke="#06b6d4" strokeWidth="2" opacity="0.7" />
          <path d="M 500 20 L 500 0 L 480 0" fill="none" stroke="#06b6d4" strokeWidth="2" opacity="0.7" />
          <path d="M 0 580 L 0 600 L 20 600" fill="none" stroke="#06b6d4" strokeWidth="2" opacity="0.7" />
          <path d="M 500 580 L 500 600 L 480 600" fill="none" stroke="#06b6d4" strokeWidth="2" opacity="0.7" />
          
        </g>
      </svg>
    </div>
  );
}