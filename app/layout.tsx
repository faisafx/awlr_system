import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

import { Sidebar } from '@/components/sidebar';
import { PageTransitionWrapper } from '@/components/PageTransitionWrapper';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';

// ── Config ────────────────────────────────────────────────────────────────────

const SYSTEM_CONFIG = {
  appName: 'TERAWANG',
  stationNode: 'Pos WGG-01 · Sungai Wanggu',
  agency: 'BBWS Sulawesi IV',
  version: 'v2.1.0',
  coordinates: '4°01′S 122°31′E',
  status: 'ONLINE',
} as const;

// ── Typography ────────────────────────────────────────────────────────────────

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

// ── Metadata ──────────────────────────────────────────────────────────────────

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  colorScheme: 'dark', // Diatur ke dark mode
};

export const metadata: Metadata = {
  title: {
    default: `${SYSTEM_CONFIG.appName} | ${SYSTEM_CONFIG.stationNode}`,
    template: `%s | ${SYSTEM_CONFIG.appName}`,
  },
  description: 'Sistem pemantauan hidrologi real-time Sungai Wanggu, Kendari — BWS Sulawesi IV.',
  manifest: '/manifest.json',
  robots: { index: false, follow: false },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: SYSTEM_CONFIG.appName,
  },
};

// ── Top Bar ───────────────────────────────────────────────────────────────────

function TopBar() {
  return (
    <header className="h-[72px] bg-[var(--surface-card)] border-b border-[var(--border-subtle)] flex items-center justify-between px-3 md:px-6 lg:px-8 relative z-30 shrink-0 shadow-sm">

      {/* Left: Brand mark + station identity */}
      <div className="flex items-center gap-3 md:gap-4 pl-10 md:pl-0">
        {/* Logo mark - Enlarged & stylized */}
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--brand-50)] border border-[var(--brand-100)] shadow-inner">
          <svg width="24" height="24" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path
              d="M11 2C11 2 4 9.5 4 13.5C4 17.09 7.13 20 11 20C14.87 20 18 17.09 18 13.5C18 9.5 11 2 11 2Z"
              fill="var(--brand-600)"
            />
            <circle cx="11" cy="14" r="3" fill="white" fillOpacity="0.5" />
          </svg>
        </div>

        <div className="flex flex-col justify-center overflow-hidden">
          <span className="text-lg md:text-2xl font-black text-[var(--text-primary)] tracking-tight leading-none mb-1 truncate">
            {SYSTEM_CONFIG.appName}
          </span>
          <span className="text-[9px] md:text-xs text-[var(--text-muted)] font-[family-name:var(--font-jetbrains)] tracking-[0.04em] leading-none uppercase truncate">
            {SYSTEM_CONFIG.stationNode}
          </span>
        </div>
      </div>

      {/* Center: Custom Banner */}
      <div className="flex-1 h-full hidden lg:flex justify-center items-center overflow-hidden mx-6">
        <div className="relative h-full w-full max-w-[500px]">
          {/* Masking gradients to blend smoothly with the left and right sides */}
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[var(--surface-card)] to-transparent z-10" />
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[var(--surface-card)] to-transparent z-10" />

          <img
            src="/terawang_banner.png"
            alt="TERAWANG Banner"
            className="h-full w-full object-cover opacity-90"
            style={{ objectPosition: 'center 75%' }}
          />
        </div>
      </div>

      {/* Right: System status pills */}
      <div className="flex items-center gap-2 md:gap-5">

        <ThemeSwitcher />
        <div className="flex items-center gap-1.5 md:gap-2 px-2.5 py-1 md:px-3 md:py-1.5 rounded-full bg-[var(--surface-inset)] border border-[var(--border-subtle)]">
          <span className="status-dot live" aria-label="sistem aktif" />
          <span className="text-[9px] md:text-[11px] font-bold text-[var(--ews-aman)] font-[family-name:var(--font-jetbrains)] tracking-widest uppercase">
            {SYSTEM_CONFIG.status}
          </span>
        </div>

        {/* Separator */}
        <div className="w-[1px] h-6 bg-[var(--border-subtle)] hidden md:block" aria-hidden="true" />

        {/* Agency + coordinates */}
        <div className="hidden md:flex flex-col items-end justify-center">
          <span className="text-[11px] font-bold text-[var(--text-secondary)] font-[family-name:var(--font-jetbrains)] tracking-widest uppercase">
            {SYSTEM_CONFIG.agency}
          </span>
          <span className="text-[10px] text-[var(--text-disabled)] font-[family-name:var(--font-jetbrains)] tracking-widest uppercase">
            {SYSTEM_CONFIG.coordinates}
          </span>
        </div>

        {/* Version badge */}
        <span className="badge neutral text-[10px] font-[family-name:var(--font-jetbrains)] hidden lg:inline-flex ml-2 border border-[var(--border-subtle)]">
          {SYSTEM_CONFIG.version}
        </span>
      </div>
    </header>
  );
}

// ── Skip link ─────────────────────────────────────────────────────────────────

function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[100] focus:px-3 focus:py-1.5 focus:text-xs focus:font-medium focus:rounded-lg focus:bg-white focus:text-blue-700 focus:border focus:border-blue-200 focus:shadow-md focus:outline-none"
    >
      Lewati ke konten utama
    </a>
  );
}

// ── Root Layout ───────────────────────────────────────────────────────────────

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="id"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body
        className="bg-[var(--surface-bg)] text-[var(--text-primary)] flex flex-col h-[100dvh] w-screen overflow-hidden font-[family-name:var(--font-inter)] antialiased"
      >
        <ThemeProvider attribute="class" defaultTheme="dark" themes={['light', 'dark', 'pastel', 'colorblind']}>
          <SkipLink />

          {/* ── Top bar: fixed height, full width ── */}
          <TopBar />

          {/* ── Body: sidebar + main ── */}
          <div className="flex flex-1 overflow-hidden bg-[var(--surface-bg)]">

            {/* Sidebar */}
            <Sidebar />

            {/* Main content area */}
            <main
              id="main-content"
              className="flex-1 min-w-0 flex flex-col overflow-hidden bg-[var(--surface-bg)] shadow-[inset_1px_0_0_var(--border-subtle)]"
            >
              {/* Scrollable content shell */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth scrollbar-hide">

                {/* Inner padding */}
                <div className="max-w-[1440px] mx-auto px-3 md:px-5 lg:px-7 py-4 md:py-6 pb-8 md:pb-12">
                  <PageTransitionWrapper>
                    {children}
                  </PageTransitionWrapper>
                </div>

              </div>
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}