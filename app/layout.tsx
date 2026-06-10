// ─────────────────────────────────────────────────────────────────────────────
// File: app/layout.tsx
// ─────────────────────────────────────────────────────────────────────────────

import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

import { Sidebar } from '@/components/sidebar';
import { PageTransitionWrapper } from '@/components/PageTransitionWrapper';
import { ThemeProvider } from '@/components/theme-provider'; // <--- MESIN TEMA DITAMBAHKAN

// ── 1. Type Definitions & Config ──────────────────────────────────────────────

interface SystemConfig {
  appName: string;
  stationNode: string;
  agency: string;
  location: {
    city: string;
    province: string;
    coordinates: string;
  };
  version: string;
}

const SYSTEM_CONFIG: SystemConfig = {
  appName: 'AWLR Command Center',
  stationNode: 'Node 01 - Sungai Wanggu',
  agency: 'BBWS Sulawesi IV',
  location: {
    city: 'Kendari',
    province: 'Sulawesi Tenggara',
    coordinates: '-4.015, 122.518',
  },
  version: 'v2.1.0-stable',
};

// ── 2. Typography ─────────────────────────────────────────────────────────────

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

// ── 3. Metadata & Viewport ────────────────────────────────────────────────────

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  colorScheme: 'light dark', // Mendukung dua mode
};

export const metadata: Metadata = {
  title: {
    default: `${SYSTEM_CONFIG.appName} | ${SYSTEM_CONFIG.stationNode}`,
    template: `%s | ${SYSTEM_CONFIG.appName}`,
  },
  description: `Sistem Pemantauan Hidrologi Sungai Wanggu, ${SYSTEM_CONFIG.location.city}.`,
  applicationName: SYSTEM_CONFIG.appName,
  robots: { index: false, follow: false },
};

// ── 4. Internal UI Components ─────────────────────────────────────────────────

const SkipToMainContent = () => (
  <a
    href="#main-content"
    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-cyan-600 focus:text-white focus:font-mono focus:text-sm focus:rounded-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all"
  >
    [ ACCESS MAIN TERMINAL ]
  </a>
);

const AmbientBackground = () => (
  <div className="fixed inset-0 z-0 pointer-events-none bg-sand-primary dark:bg-bg-primary overflow-hidden transition-colors duration-500">
    {/* Soft Holographic Glows (Menyesuaikan tema) */}
    <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-sand-accent/10 dark:bg-cyan-900/10 blur-[80px]" />
    <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-sand-accent/10 dark:bg-teal-900/10 blur-[80px]" />
    
    <div 
      className="absolute inset-0 opacity-[0.04] dark:opacity-[0.04] opacity-[0.08]" 
      style={{
        backgroundImage: 'linear-gradient(transparent 50%, rgba(0,0,0,1) 50%)',
        backgroundSize: '100% 4px',
      }}
    />
  </div>
);

const AgencyHeaderStrip = () => (
  <header className="relative z-20 flex w-full h-10 items-center justify-between px-6 bg-sand-card/50 dark:bg-bg-surface/50 border-b border-sand-border dark:border-cyan-900/30 text-[10px] uppercase tracking-[0.2em] text-sand-muted dark:text-slate-400 font-mono transition-colors duration-500">
    <div className="flex items-center gap-4">
      <span className="flex items-center gap-2 text-sand-accent dark:text-cyan-400">
        <span className="w-1.5 h-1.5 rounded-full bg-sand-accent dark:bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)] animate-pulse" />
        {SYSTEM_CONFIG.agency}
      </span>
      <span className="hidden sm:inline-block text-sand-muted/50 dark:text-slate-600">///</span>
      <span className="hidden sm:inline-block">
        {SYSTEM_CONFIG.location.coordinates}
      </span>
    </div>
    <div className="flex items-center gap-4">
      <span className="text-status-aman">STATUS: SECURE</span>
      <span className="text-sand-muted/50 dark:text-slate-600">///</span>
      <span>{SYSTEM_CONFIG.version}</span>
    </div>
  </header>
);

// ── 5. Main Root Layout ───────────────────────────────────────────────────────

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      {/* Body sekarang menggunakan variabel dinamis dari tailwind.config.ts */}
      <body className="relative bg-sand-primary text-sand-text dark:bg-bg-primary dark:text-slate-200 font-sans antialiased overflow-hidden selection:bg-sand-accent/30 dark:selection:bg-cyan-900/50 flex flex-col h-screen w-screen transition-colors duration-500">
        
        {/* PEMBUNGKUS TEMA WAJIB ADA DI SINI */}
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          
          <SkipToMainContent />
          <AmbientBackground />
          <AgencyHeaderStrip />

          {/* Flexible Working Area */}
          <div className="relative z-10 flex flex-1 w-full overflow-hidden p-3 gap-3">
            
            <Sidebar />

            <main 
              id="main-content"
              className="flex-1 flex flex-col min-w-0 bg-sand-card/90 dark:bg-bg-card/80 backdrop-blur-xl
                         border border-sand-border dark:border-cyan-900/30 rounded-lg shadow-2xl relative
                         transition-colors duration-500 ease-in-out group"
            >
              {/* Tactical Corner Brackets */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-sand-accent/50 dark:border-cyan-500/50 rounded-tl-lg pointer-events-none" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-sand-accent/50 dark:border-cyan-500/50 rounded-tr-lg pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-sand-accent/50 dark:border-cyan-500/50 rounded-bl-lg pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-sand-accent/50 dark:border-cyan-500/50 rounded-br-lg pointer-events-none" />

              {/* Inner Content Area */}
              <div className="relative z-10 flex-1 overflow-x-hidden overflow-y-auto scroll-smooth custom-scrollbar p-6">
                <PageTransitionWrapper>
                  {children}
                </PageTransitionWrapper>
              </div>
            </main>

          </div>
        </ThemeProvider>

      </body>
    </html>
  );
}