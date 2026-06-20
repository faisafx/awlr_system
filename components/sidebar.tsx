'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  BrainCircuit,
  Map,
  Cpu,
  Database,
  Settings,
  Menu, // Ikon hamburger baru
  Radio,
  DatabaseZap,
  X,
} from 'lucide-react';

// ── Nav structure ─────────────────────────────────────────────────────────────

const NAV_ROUTES = [
  {
    group: 'Operasi',
    routes: [
      { href: '/', label: 'Command Center', icon: Activity },
      { href: '/analytics', label: 'AI Analytics (LSTM)', icon: BrainCircuit, badge: 'Live' },
      { href: '/gis-topology', label: 'GIS & Topologi', icon: Map },
    ],
  },
  {
    group: 'Infrastruktur',
    routes: [
      { href: '/infrastructure', label: 'Perangkat & Jaringan', icon: Cpu, badge: 'Sync' },
    ],
  },
  {
    group: 'Sistem',
    routes: [
      { href: '/data-logs', label: 'Data Explorer', icon: Database },
      { href: '/settings', label: 'Pengaturan', icon: Settings },
    ],
  },
] as const;

// ── Badge colors ──────────────────────────────────────────────────────────────

const BADGE_STYLE: Record<string, React.CSSProperties> = {
  Live: { background: 'var(--ews-awas-bg)', color: 'var(--ews-awas)', border: '0.5px solid #FECACA' },
  Sync: { background: 'var(--brand-50)', color: 'var(--brand-700)', border: '0.5px solid var(--brand-200)' },
};

// ── Sidebar ───────────────────────────────────────────────────────────────────

export function Sidebar() {
  const [expanded, setExpanded] = useState(true);
  const pathname = usePathname();
  const toggle = useCallback(() => setExpanded(p => !p), []);

  // Collapse sidebar by default on mobile
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setExpanded(false);
    }
  }, []);

  const W = expanded ? 240 : 64; // Lebar dinaikkan sedikit ke 240px agar muat untuk Hamburger Menu

  return (
    <>
      {/* ── Mobile Hamburger Toggle (Outside Sidebar) ── */}
      <button
        className="md:hidden fixed top-[20px] left-[20px] z-[60] flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--surface-card)] border border-[var(--border-subtle)] text-[var(--text-secondary)] shadow-sm hover:text-[var(--brand-600)] transition-colors"
        onClick={toggle}
        aria-label="Toggle Mobile Menu"
      >
        <Menu size={18} />
      </button>

      {/* ── Mobile Overlay ── */}
      {expanded && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-[40] backdrop-blur-sm transition-opacity"
          onClick={() => setExpanded(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 md:relative md:top-auto md:left-auto z-[70] md:z-20 h-[100dvh] md:h-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${expanded ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        style={{
          width: W,
          minWidth: W,
          background: 'var(--surface-card)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          flexShrink: 0,
          boxShadow: expanded ? '4px 0 24px rgba(0,0,0,0.4)' : 'none',
        }}
      >

        {/* ── Brand header & Hamburger Toggle ── */}
        <div
          style={{
            height: '72px', // Samakan dengan TopBar 72px
            padding: expanded ? '0 16px' : '0',
            borderBottom: '1px solid var(--border-subtle)',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: expanded ? 'space-between' : 'center',
            overflow: 'hidden',
          }}
        >
          {/* Left: Spacer to push hamburger to right when expanded */}
          <div style={{ flex: expanded ? 1 : 0, width: expanded ? 'auto' : '0px', opacity: expanded ? 1 : 0, transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.15em', paddingLeft: '4px', display: expanded ? 'block' : 'none' }}>
              Menu Navigasi
            </span>
          </div>
          {/* Right: Hamburger Toggle / Close on Mobile */}
          <button
            onClick={toggle}
            aria-label={expanded ? 'Tutup sidebar' : 'Buka sidebar'}
            className="flex items-center justify-center w-[32px] h-[32px] rounded-lg bg-transparent border-none cursor-pointer text-[var(--text-secondary)] transition-all hover:bg-[var(--surface-inset)] hover:text-[var(--brand-600)] shrink-0"
          >
            {expanded ? (
              <>
                <Menu size={18} className="hidden md:block" />
                <X size={18} className="block md:hidden" />
              </>
            ) : (
              <Menu size={18} />
            )}
          </button>
        </div>

        {/* ── Nav ── */}
        <nav
          className="scrollbar-hide"
          style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '16px 12px' }}
        >
          {NAV_ROUTES.map(({ group, routes }) => (
            <div key={group} style={{ marginBottom: '16px' }}>

              {/* Group label */}
              <div
                style={{
                  fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.12em', color: 'var(--text-disabled)',
                  padding: expanded ? '0 8px 8px' : '0',
                  height: expanded ? 'auto' : '1px',
                  margin: expanded ? '0' : '0 auto 16px',
                  width: expanded ? '100%' : '24px',
                  background: expanded ? 'transparent' : 'var(--border-subtle)',
                  textAlign: expanded ? 'left' : 'center',
                  userSelect: 'none',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  transition: 'all var(--duration-base)',
                }}
              >
                <span style={{ opacity: expanded ? 1 : 0, transition: 'opacity 0.2s' }}>{group}</span>
              </div>

              {/* Route items */}
              {routes.map((route) => {
                const isActive = pathname === route.href || (route.href !== '/' && pathname.startsWith(`${route.href}/`));
                const Icon = route.icon;
                const badge = (route as { badge?: string }).badge;

                return (
                  <Link key={route.href} href={route.href} style={{ textDecoration: 'none', display: 'block', marginBottom: '1px' }} title={!expanded ? route.label : undefined}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: expanded ? '7px 10px' : '0',
                        height: expanded ? 'auto' : '38px',
                        width: expanded ? 'auto' : '38px',
                        justifyContent: expanded ? 'flex-start' : 'center',
                        borderRadius: 'var(--radius-md)',
                        margin: expanded ? '0' : '0 auto',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'all var(--duration-fast) var(--ease-standard)',
                        background: isActive ? 'var(--brand-50)' : 'transparent',
                        border: isActive ? '0.5px solid var(--brand-200)' : '0.5px solid transparent',
                        color: isActive ? 'var(--brand-700)' : 'var(--text-secondary)',
                      }}
                      onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = 'var(--surface-inset)'; (e.currentTarget as HTMLElement).style.color = 'var(--brand-700)'; } }}
                      onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; } }}
                    >
                      {isActive && (
                        <div
                          style={{
                            position: 'absolute', left: expanded ? 0 : '-3px', top: '50%', transform: 'translateY(-50%)',
                            width: '3px', height: '16px', background: 'var(--brand-600)',
                            borderRadius: '0 3px 3px 0',
                          }}
                        />
                      )}

                      <Icon
                        size={15}
                        strokeWidth={isActive ? 2.5 : 1.8}
                        style={{ flexShrink: 0, color: 'inherit' }}
                      />

                      {/* Label + badge */}
                      <div
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px', flex: 1,
                          opacity: expanded ? 1 : 0,
                          maxWidth: expanded ? '180px' : '0px', // Animasi lipat untuk teks nav
                          transition: 'all var(--duration-base) var(--ease-standard)',
                          pointerEvents: expanded ? 'auto' : 'none',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <span style={{ fontSize: '12px', fontWeight: isActive ? 600 : 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {route.label}
                        </span>
                        {badge && (
                          <span
                            style={{
                              ...BADGE_STYLE[badge],
                              fontSize: '9px', fontFamily: 'var(--font-jetbrains), monospace',
                              fontWeight: 700, padding: '1px 5px', borderRadius: '4px',
                              letterSpacing: '0.04em', flexShrink: 0,
                            }}
                          >
                            {badge}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* ── Footer: system status ── */}
        <div
          style={{
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--surface-inset)',
            padding: expanded ? '10px 12px' : '10px 0',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '7px',
            overflow: 'hidden',
            transition: 'padding var(--duration-base) var(--ease-standard)',
          }}
        >
          {/* Uplink status */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: expanded ? 'space-between' : 'center', height: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} title={!expanded ? "Uplink MQTT: 14ms" : undefined}>
              <Radio size={12} style={{ color: 'var(--brand-500)', flexShrink: 0 }} />
              <span
                style={{
                  fontSize: '10px', fontFamily: 'var(--font-jetbrains), monospace', color: 'var(--text-muted)',
                  opacity: expanded ? 1 : 0, maxWidth: expanded ? '100px' : '0px',
                  overflow: 'hidden', transition: 'all var(--duration-base)', whiteSpace: 'nowrap',
                }}
              >
                Uplink MQTT
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: expanded ? 1 : 0, maxWidth: expanded ? '50px' : '0px', overflow: 'hidden', transition: 'all var(--duration-base)' }}>
              <span className="status-dot live" style={{ width: '5px', height: '5px' }} />
              <span style={{ fontSize: '10px', fontFamily: 'var(--font-jetbrains), monospace', fontWeight: 600, color: 'var(--brand-600)' }}>
                14 ms
              </span>
            </div>
          </div>

          {/* LSTM engine */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: expanded ? 'space-between' : 'center', height: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} title={!expanded ? "Model LSTM: Standby" : undefined}>
              <DatabaseZap size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <span
                style={{
                  fontSize: '10px', fontFamily: 'var(--font-jetbrains), monospace', color: 'var(--text-muted)',
                  opacity: expanded ? 1 : 0, maxWidth: expanded ? '100px' : '0px',
                  overflow: 'hidden', transition: 'all var(--duration-base)', whiteSpace: 'nowrap',
                }}
              >
                Model LSTM
              </span>
            </div>
            <span
              style={{
                fontSize: '10px', fontFamily: 'var(--font-jetbrains), monospace', color: 'var(--text-disabled)',
                opacity: expanded ? 1 : 0, maxWidth: expanded ? '50px' : '0px',
                overflow: 'hidden', transition: 'all var(--duration-base)', whiteSpace: 'nowrap',
              }}
            >
              Standby
            </span>
          </div>

          {/* Version line */}
          <div
            style={{
              paddingTop: '6px', borderTop: '1px solid var(--border-subtle)',
              display: 'flex', justifyContent: 'space-between',
              opacity: expanded ? 1 : 0, maxHeight: expanded ? '20px' : '0px',
              overflow: 'hidden', transition: 'all var(--duration-base) var(--ease-standard)',
            }}
          >
            <span style={{ fontSize: '9px', fontFamily: 'var(--font-jetbrains), monospace', color: 'var(--text-disabled)', whiteSpace: 'nowrap' }}>
              BBWS Sulawesi IV · v2.1.0
            </span>
            <span style={{ fontSize: '9px', fontFamily: 'var(--font-jetbrains), monospace', color: 'var(--text-disabled)', whiteSpace: 'nowrap' }}>
              60s
            </span>
          </div>
        </div>

      </aside>
    </>
  );
}