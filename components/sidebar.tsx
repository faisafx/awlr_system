// ─────────────────────────────────────────────────────────────────────────────
// components/sidebar.tsx
// ─────────────────────────────────────────────────────────────────────────────

'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  BrainCircuit,
  Map,
  Cpu,
  Database,
  Settings,
  ChevronLeft,
  ChevronRight,
  Radio,
  DatabaseZap,
  Sun,
  Moon
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── 1. Type Definitions & Navigation ──────────────────────────────────────────
const NAV_ROUTES = [
  {
    group: 'Operations',
    routes: [
      { href: '/', label: 'Command Center', icon: Activity },
      { href: '/analytics', label: 'AI Analytics (LSTM)', icon: BrainCircuit, badge: 'Live' },
      { href: '/gis-topology', label: 'GIS & Topology', icon: Map },
    ],
  },
  {
    group: 'Infrastructure',
    routes: [
      { href: '/infrastructure', label: 'Device & Network', icon: Cpu, badge: 'Sync' },
    ],
  },
  {
    group: 'System',
    routes: [
      { href: '/data-logs', label: 'Data Explorer', icon: Database },
      { href: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

// ── 2. Animation Constants ────────────────────────────────────────────────────
const sidebarVariants = {
  expanded: { width: 260, transition: { type: 'spring', stiffness: 300, damping: 30 } },
  collapsed: { width: 72, transition: { type: 'spring', stiffness: 300, damping: 30 } },
};

const fadeSlideVariants = {
  expanded: { opacity: 1, x: 0, display: 'block', transition: { delay: 0.1, duration: 0.2 } },
  collapsed: { opacity: 0, x: -10, transition: { duration: 0.1 }, transitionEnd: { display: 'none' } },
};

// ── 3. Main Sidebar Component ─────────────────────────────────────────────────
export function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

  // Mencegah Hydration Error dari next-themes
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleSidebar = useCallback(() => setIsExpanded((prev) => !prev), []);

  return (
    <motion.aside
      variants={sidebarVariants}
      initial="expanded"
      animate={isExpanded ? 'expanded' : 'collapsed'}
      className="relative flex flex-col h-full bg-[#F5EBE1]/90 dark:bg-[#040A18]/80 backdrop-blur-xl border border-[#DBCFBF] dark:border-cyan-900/30 rounded-lg shadow-2xl shrink-0 z-30 transition-shadow duration-300"
    >
      {/* ── Brand Header ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 h-20 px-4 border-b border-[#DBCFBF] dark:border-cyan-900/30 shrink-0 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#C28462]/10 dark:from-cyan-500/5 to-transparent opacity-50" />
        
        <div className="relative shrink-0 z-10">
          <div className="w-10 h-10 rounded bg-[#EADDCB] dark:bg-cyan-950 border border-[#C28462]/50 dark:border-cyan-500/50 flex items-center justify-center">
            <Activity className="w-5 h-5 text-[#C28462] dark:text-cyan-400" />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#C28462] dark:bg-cyan-500 rounded-full border-2 border-[#F5EBE1] dark:border-[#040A18] animate-pulse" />
        </div>

        <motion.div variants={fadeSlideVariants} className="flex flex-col whitespace-nowrap z-10">
          <h1 className="text-sm font-bold text-[#4A3F35] dark:text-slate-200 tracking-wide">
            AWLR<span className="text-[#C28462] dark:text-cyan-400">.OPS</span>
          </h1>
          <span className="text-[10px] text-[#8C6D54] dark:text-slate-500 font-mono tracking-wider uppercase mt-0.5">
            Node: Sungai Wanggu
          </span>
        </motion.div>
      </div>

      {/* ── Navigation Container ────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-6 px-3 space-y-6 custom-scrollbar">
        {NAV_ROUTES.map(({ group, routes }) => (
          <div key={group} className="flex flex-col">
            <motion.div variants={fadeSlideVariants} className="text-[10px] font-bold uppercase tracking-widest text-[#8C6D54] dark:text-slate-500/70 px-3 pb-2 select-none">
              {group}
            </motion.div>

            <ul className="space-y-1">
              {routes.map((route) => {
                const isActive = pathname === route.href || (route.href !== '/' && pathname.startsWith(`${route.href}/`));
                const Icon = route.icon;

                return (
                  <li key={route.href}>
                    <Link href={route.href} passHref>
                      <motion.div
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          'relative flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors group',
                          isActive ? 'bg-[#EADDCB] dark:bg-cyan-950/40' : 'hover:bg-white/50 dark:hover:bg-slate-800/40',
                          !isExpanded && 'justify-center px-0'
                        )}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeNavIndicator"
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#C28462] dark:bg-cyan-400 rounded-r-md"
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                          />
                        )}

                        <Icon 
                          size={18} 
                          className={cn('shrink-0 transition-colors', isActive ? 'text-[#C28462] dark:text-cyan-400' : 'text-[#8C6D54] dark:text-slate-500 group-hover:text-[#4A3F35] dark:group-hover:text-cyan-400')} 
                          strokeWidth={isActive ? 2.5 : 1.5}
                        />

                        <motion.span variants={fadeSlideVariants} className={cn('flex-1 text-sm font-medium truncate', isActive ? 'text-[#4A3F35] dark:text-cyan-300' : 'text-[#8C6D54] dark:text-slate-400')}>
                          {route.label}
                        </motion.span>

                        {route.badge && (
                          <motion.div variants={fadeSlideVariants}>
                            <span className={cn(
                              'px-1.5 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider border',
                              route.badge === 'Live' ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-500/50' :
                              route.badge === 'Sync' ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-500/50' :
                              'bg-[#FDF8F5] dark:bg-cyan-950/50 text-[#C28462] dark:text-cyan-400 border-[#DBCFBF] dark:border-cyan-500/50'
                            )}>
                              {route.badge}
                            </span>
                          </motion.div>
                        )}
                      </motion.div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* ── System Status Footer & THEME SWITCHER ─────────────────────────── */}
      <div className="border-t border-[#DBCFBF] dark:border-cyan-900/30 bg-[#FDF8F5]/50 dark:bg-black/20 shrink-0 p-4 relative overflow-hidden">
        <motion.div variants={fadeSlideVariants} className="relative z-10 flex flex-col gap-3">
          
          {/* THEME SWITCHER ADA DI SINI */}
          {mounted && (
            <div className="flex items-center justify-between border-b border-[#DBCFBF] dark:border-white/5 pb-3 mb-1">
              <span className="text-[11px] font-mono text-[#8C6D54] dark:text-slate-500">Visual Mode</span>
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-1.5 rounded-md transition-colors bg-[#EADDCB] hover:bg-[#DBCFBF] text-[#8C6D54] dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-cyan-400"
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
              </button>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#8C6D54] dark:text-slate-500">
              <Radio size={14} className="text-blue-500 dark:text-cyan-400" />
              <span className="text-[11px] font-mono">Uplink Status</span>
            </div>
            <span className="text-[11px] font-mono text-blue-600 dark:text-cyan-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-cyan-400 animate-pulse"></span>
              14ms
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#8C6D54] dark:text-slate-500">
              <DatabaseZap size={14} className="text-teal-600 dark:text-teal-400" />
              <span className="text-[11px] font-mono">LSTM Engine</span>
            </div>
            <span className="text-[11px] font-mono text-teal-600 dark:text-teal-400">Standby</span>
          </div>
        </motion.div>
      </div>

      {/* ── Toggle Control ──────────────────────────────────────────────────── */}
      <motion.button
        onClick={toggleSidebar}
        whileTap={{ scale: 0.9 }}
        className="absolute -right-3 top-8 z-50 w-6 h-6 rounded border border-[#C28462]/50 dark:border-cyan-500/50 bg-[#F5EBE1] dark:bg-[#040A18] text-[#C28462] dark:text-cyan-400 flex items-center justify-center transition-colors hover:text-[#4A3F35] dark:hover:text-cyan-300"
      >
        {isExpanded ? <ChevronLeft size={14} strokeWidth={2.5} /> : <ChevronRight size={14} strokeWidth={2.5} />}
      </motion.button>
    </motion.aside>
  );
}