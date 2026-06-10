// ─────────────────────────────────────────────────────────────────────────────
// File: tailwind.config.ts
// Architecture: AWLR Command Center Design System
// Status: FULLY OPTIMIZED (JIT Compiler Ready)
// ─────────────────────────────────────────────────────────────────────────────
import type { Config } from "tailwindcss";

const config: Config = {
  // Wajib aktif agar tombol tema (Light/Dark) di sidebar berfungsi
  darkMode: "class",
  
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}', // Ditambahkan untuk utilitas tambahan
  ],
  theme: {
    extend: {
      colors: {
        // ── 1. TEMA GELAP (J.A.R.V.I.S / Tactical Navy) ──────────────────────
        bg: {
          primary:   '#0B1220',
          surface:   '#111827',
          card:      '#172033',
          elevated:  '#1E2A3A',
        },
        border: {
          DEFAULT: '#243042',
          accent:  '#2E3D52',
          glow:    'rgba(59,130,246,0.3)',
        },
        primary: {
          DEFAULT: '#3B82F6',
          dim:     'rgba(59,130,246,0.15)',
          glow:    'rgba(59,130,246,0.4)',
        },
        text: {
          primary:   '#F9FAFB',
          secondary: '#9CA3AF',
          muted:     '#6B7280',
          accent:    '#3B82F6',
        },

        // ── 2. TEMA TERANG (Warm Sand / Kulit) ───────────────────────────────
        sand: {
          primary: '#FDF8F5', // Untuk latar belakang body utama
          card:    '#F5EBE1', // Untuk sidebar dan panel
          border:  '#DBCFBF', // Untuk garis batas (stroke)
          text:    '#4A3F35', // Untuk font teks normal
          muted:   '#8C6D54', // Untuk icon dan teks redup
          accent:  '#C28462', // Aksen utama (pengganti Cyan)
        },

        // ── 3. STATUS KEBENCANAAN EWS (Universal) ────────────────────────────
        // Warna ini absolut, tidak peduli tema terang/gelap, warnanya tetap sama
        status: {
          aman:    '#10B981', // Hijau (Normal)
          waspada: '#F59E0B', // Kuning (Tensi naik)
          siaga:   '#F97316', // Oranye (Butuh tindakan)
          awas:    '#EF4444', // Merah (Kritis/Meluap)
        },

        // ── 4. Kustomisasi UI Khusus ─────────────────────────────────────────
        cyan: {
          jarvis: '#06b6d4',
          glow:   'rgba(6, 182, 212, 0.5)',
        }
      },

      // ── Custom Fonts ───────────────────────────────────────────────────────
      fontFamily: {
        sans:  ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono:  ['var(--font-jetbrains)', 'JetBrains Mono', 'monospace'],
        display: ['var(--font-orbitron)', 'Orbitron', 'sans-serif'],
      },

      // ── Glassmorphism & Backgrounds Utilities ──────────────────────────────
      backdropBlur: {
        xs: '2px',
        glass: '12px',
      },
      backgroundImage: {
        'glass-card': 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
        'grid-pattern': 'linear-gradient(rgba(36,48,66,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(36,48,66,0.4) 1px, transparent 1px)',
        'grid-light': 'linear-gradient(rgba(219,207,191,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(219,207,191,0.4) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid-40': '40px 40px',
      },

      // ── EWS Keyframes (ANIMASI KOMPLEKS DIPERTAHANKAN 100%) ────────────────
      keyframes: {
        'ews-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(239,68,68,0.4)', opacity: '1' },
          '50%':      { boxShadow: '0 0 0 12px rgba(239,68,68,0)',  opacity: '0.8' },
        },
        'siaga-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(249,115,22,0.5)' },
          '50%':      { boxShadow: '0 0 0 10px rgba(249,115,22,0)' },
        },
        'scan-line': {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        'data-tick': {
          '0%':   { opacity: '0.4' },
          '50%':  { opacity: '1'   },
          '100%': { opacity: '0.4' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)'   },
          '50%':      { transform: 'translateY(-6px)' },
        },
        'bg-scroll': {
          '0%':   { backgroundPosition: '0 0'    },
          '100%': { backgroundPosition: '40px 40px' },
        },
      },
      animation: {
        'ews-pulse':   'ews-pulse 2s ease-in-out infinite',
        'siaga-pulse': 'siaga-pulse 1.5s ease-in-out infinite',
        'scan-line':   'scan-line 4s linear infinite',
        'data-tick':   'data-tick 2s ease-in-out infinite',
        float:         'float 3s ease-in-out infinite',
        'bg-scroll':   'bg-scroll 8s linear infinite',
      },

      // ── Border Radius & Box Shadows (Kedalaman Visual) ─────────────────────
      borderRadius: {
        card: '10px',
        panel: '14px',
      },
      boxShadow: {
        'card-blue':    '0 0 20px rgba(59,130,246,0.08), 0 1px 3px rgba(0,0,0,0.4)',
        'card-green':   '0 0 20px rgba(16,185,129,0.08), 0 1px 3px rgba(0,0,0,0.4)',
        'card-orange':  '0 0 20px rgba(249,115,22,0.12), 0 1px 3px rgba(0,0,0,0.4)',
        'card-red':     '0 0 24px rgba(239,68,68,0.18), 0 1px 3px rgba(0,0,0,0.4)',
        'glow-blue':    '0 0 30px rgba(59,130,246,0.25)',
        'glow-green':   '0 0 30px rgba(16,185,129,0.25)',
        'inner-glow':   'inset 0 1px 0 rgba(255,255,255,0.06)',
        glass:          '0 4px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
      },
    },
  },
  plugins: [],
};

export default config;