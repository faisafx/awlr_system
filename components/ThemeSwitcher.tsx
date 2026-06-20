'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Moon, Sun, Palette, Eye, ChevronDown, Check } from 'lucide-react';

const THEMES = [
  { id: 'dark', label: 'Dark Mode', icon: Moon, description: 'Pemantauan malam hari' },
  { id: 'light', label: 'Light Mode', icon: Sun, description: 'Siang hari & presentasi' },
  { id: 'pastel', label: 'Pastel Mode', icon: Palette, description: 'Estetik & lembut di mata' },
  { id: 'colorblind', label: 'Color-Blind Safe', icon: Eye, description: 'Aksesibilitas kontras tinggi' },
];

export function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  // Mencegah hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-8 h-8 md:w-9 md:h-9 bg-[var(--surface-inset)] rounded-full" />;
  }

  const activeTheme = THEMES.find((t) => t.id === theme) || THEMES[0];
  const Icon = activeTheme.icon;

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-full bg-[var(--surface-inset)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--brand-600)] transition-colors"
        aria-label="Ganti Tema"
        title="Ganti Tema"
      >
        <Icon size={16} />
      </button>

      {open && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
            onClick={() => setOpen(false)}
          />
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: '240px',
              background: 'var(--surface-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)',
              padding: '8px',
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              animation: 'fadeIn 0.2s ease-out',
            }}
          >
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTheme(t.id);
                  setOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: theme === t.id ? 'var(--brand-50)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (theme !== t.id) e.currentTarget.style.background = 'var(--surface-inset)';
                }}
                onMouseLeave={(e) => {
                  if (theme !== t.id) e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ color: theme === t.id ? 'var(--brand-600)' : 'var(--text-secondary)' }}>
                  <t.icon size={16} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: theme === t.id ? 'var(--brand-700)' : 'var(--text-primary)' }}>
                    {t.label}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {t.description}
                  </div>
                </div>
                {theme === t.id && <Check size={14} color="var(--brand-600)" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
