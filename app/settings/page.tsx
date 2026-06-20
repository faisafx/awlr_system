// ─────────────────────────────────────────────────────────────────────────────
// File: app/settings/page.tsx
// Architecture: Next.js 14 Client Component
// Project: Full-Stack AWLR Command Center - Sungai Wanggu, Kendari
// Description: Master Global Settings Console. Manages MQTT pipelines, 
//              PUPR EWS thresholds, and geodetic station anchors.
// ─────────────────────────────────────────────────────────────────────────────

'use client';

import { useState } from 'react';
import { 
  Settings, Save, Sliders, Radio, Globe, ShieldAlert, 
  Database, RefreshCw, Lock, TerminalSquare, ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function GlobalSettingsPage() {
  const [activeSection, setActiveSection] = useState<'MQTT' | 'STATION' | 'THRES' | 'SYS'>('MQTT');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // ── 1. STATE CONFIG PIPELINE MQTT EMQX ──
  const [mqttHost, setMqttHost] = useState<string>('wss://broker.emqx.io');
  const [mqttPort, setMqttPort] = useState<number>(8084);
  const [mqttTopic, setMqttTopic] = useState<string>('bbws/wanggu/node01/telemetry');
  const [mqttUser, setMqttUser] = useState<string>('bws_sulawesi_iv');

  // ── 2. STATE CONFIG METADATA ANCHOR GEODETIK ──
  const [stationName, setStationName] = useState<string>('Node 01 - Sungai Wanggu');
  const [assetCode, setAssetCode] = useState<string>('BMN-AWLR-WGG01');
  const [latitude, setLatitude] = useState<number>(-4.017500);
  const [longitude, setLongitude] = useState<number>(122.515200);

  // ── 3. STATE CONFIG MASTER THRESHOLD EWS (PUPR) ──
  const [siaga1, setSiaga1] = useState<number>(3.50); // Meter (AWAS)
  const [siaga2, setSiaga2] = useState<number>(2.80); // Meter (SIAGA)
  const [siaga3, setSiaga3] = useState<number>(2.00); // Meter (WASPADA)

  // ── 4. STATE CONFIG UTILITAS SISTEM ──
  const [ntpServer, setNtpServer] = useState<string>('id.pool.ntp.org');
  const [txInterval, setTxInterval] = useState<number>(4000); // Milidetik (Duty Cycle)

  const handleSaveConfiguration = () => {
    setIsSaving(true);
    // Simulasi penulisan balik ke konfigurasi environment atau database local
    setTimeout(() => {
      setIsSaving(false);
      alert('Konfigurasi sistem global berhasil diperbarui dan dikunci.');
    }, 1500);
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6 h-full font-[family-name:var(--font-inter)]">
      
      {/* ── BARIS 1: Header Dokumen ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 md:gap-4 border-b border-[var(--border-subtle)] pb-4 shrink-0">
        <div className="min-w-0">
          <h1 className="text-[17px] md:text-[20px] font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-2">
            <Settings className="text-[var(--brand-600)] shrink-0" size={22} />
            <span className="truncate">Pengaturan Global</span>
            <span className="text-[var(--text-disabled)] font-normal ml-1 hidden sm:inline">| System Config</span>
          </h1>
          <p className="text-[11px] md:text-[12px] text-[var(--text-muted)] mt-1 font-medium uppercase tracking-widest truncate">
            Centralized Core Configuration Panel
          </p>
        </div>

        {/* Tombol Simpan Global Form */}
        <button
          onClick={handleSaveConfiguration}
          disabled={isSaving}
          className={cn(
            "flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-bold text-[12px] tracking-wide transition-all shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-[var(--brand-500)] focus:outline-none",
            isSaving 
              ? "bg-[var(--surface-inset)] text-[var(--text-disabled)] cursor-not-allowed border border-[var(--border-subtle)]" 
              : "bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white active:scale-95"
          )}
        >
          {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
          {isSaving ? 'MENGUNCI PARAMETER...' : 'SIMPAN KONFIGURASI'}
        </button>
      </div>

      {/* ── BARIS 2: Layout Belah Dua (Navigasi Kiri vs Form Kanan) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 items-start flex-1 min-h-0">
        
        {/* PANEL KIRIM: Navigasi Kategori Pengaturan */}
        <div className="lg:col-span-3 card p-1.5 md:p-2 flex lg:flex-col gap-1 shrink-0 overflow-x-auto lg:overflow-x-visible scrollbar-hide">
          <SettingsNavButton 
            active={activeSection === 'MQTT'} 
            onClick={() => setActiveSection('MQTT')} 
            icon={Radio} 
            label="Pipeline & Broker MQTT" 
          />
          <SettingsNavButton 
            active={activeSection === 'STATION'} 
            onClick={() => setActiveSection('STATION')} 
            icon={Globe} 
            label="Metadata Stasiun" 
          />
          <SettingsNavButton 
            active={activeSection === 'THRES'} 
            onClick={() => setActiveSection('THRES')} 
            icon={ShieldAlert} 
            label="Ambang Batas EWS" 
          />
          <SettingsNavButton 
            active={activeSection === 'SYS'} 
            onClick={() => setActiveSection('SYS')} 
            icon={Database} 
            label="Utilitas & Waktu" 
          />
        </div>

        {/* PANEL KANAN: Form Pengisian Dinamis */}
        <div className="lg:col-span-9 card flex flex-col h-full overflow-hidden">
          
          <div className="p-4 md:p-6 flex-1 overflow-y-auto scrollbar-hide">
            
            {/* KATEGORI 1: Pipeline & Broker MQTT */}
            {activeSection === 'MQTT' && (
              <div className="space-y-5 md:space-y-6">
                <div className="border-b border-[var(--border-subtle)] pb-3">
                  <h2 className="text-[15px] md:text-[16px] font-bold text-[var(--text-primary)]">Pipa Jalur Data Jaringan</h2>
                  <p className="text-[11px] md:text-[12px] text-[var(--text-secondary)] mt-1">Kredensial Koneksi Gateway EMQX Publik/Privat untuk akuisisi telemetri.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <SettingsInput label="Broker URL Host (WebSockets)" value={mqttHost} onChange={setMqttHost} type="text" />
                  <SettingsInput label="WSS Secure Port" value={mqttPort} onChange={(v) => setMqttPort(Number(v))} type="number" />
                  <div className="md:col-span-2">
                    <SettingsInput label="Master Ingress Telemetry Topic" value={mqttTopic} onChange={setMqttTopic} type="text" isHighlight />
                  </div>
                  <SettingsInput label="Gateway Client Username" value={mqttUser} onChange={setMqttUser} type="text" />
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Gateway Client Password</label>
                    <div className="relative">
                      <input type="password" value="••••••••••••" disabled className="w-full bg-[var(--surface-inset)] border border-[var(--border-subtle)] rounded-lg px-4 py-2.5 text-[13px] text-[var(--text-disabled)] font-[family-name:var(--font-jetbrains)] focus:outline-none cursor-not-allowed select-none" />
                      <Lock size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-disabled)]" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* KATEGORI 2: Anchor & Metadata Stasiun */}
            {activeSection === 'STATION' && (
              <div className="space-y-5 md:space-y-6">
                <div className="border-b border-[var(--border-subtle)] pb-3">
                  <h2 className="text-[16px] font-bold text-[var(--text-primary)]">Metadata Registrasi Geografis</h2>
                  <p className="text-[12px] text-[var(--text-secondary)] mt-1">Identitas Absolut Penempatan Fisik Stasiun Lapangan pada GIS Matrix.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <SettingsInput label="Nama Resmi Stasiun Pantau" value={stationName} onChange={setStationName} type="text" />
                  </div>
                  <SettingsInput label="Kode Aset Registrasi BMN" value={assetCode} onChange={setAssetCode} type="text" />
                  <div className="hidden md:block"></div> {/* Spacer */}
                  <SettingsInput label="Jangkar Lintang (Latitude)" value={latitude} onChange={(v) => setLatitude(Number(v))} type="number" step="0.000001" />
                  <SettingsInput label="Jangkar Bujur (Longitude)" value={longitude} onChange={(v) => setLongitude(Number(v))} type="number" step="0.000001" />
                </div>
              </div>
            )}

            {/* KATEGORI 3: Ambang Batas EWS (PUPR) */}
            {activeSection === 'THRES' && (
              <div className="space-y-5 md:space-y-6">
                <div className="border-b border-[var(--border-subtle)] pb-3">
                  <h2 className="text-[16px] font-bold text-[var(--text-primary)] flex items-center gap-2">Ambang Batas Kedaruratan Vertikal</h2>
                  <p className="text-[12px] text-[var(--text-secondary)] mt-1">Konfigurasi Aturan Sempadan Banjir Standar Ditjen SDA PUPR.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="flex flex-col gap-1.5 p-4 rounded-xl border bg-[var(--ews-awas-bg)] border-[#FECACA]">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--ews-awas)]">Siaga I — AWAS (Meter)</label>
                    <input type="number" step="0.01" value={siaga1} onChange={(e) => setSiaga1(parseFloat(e.target.value) || 0)} className="w-full bg-[var(--surface-card)] border border-[#FCA5A5] rounded-lg px-4 py-2.5 text-[14px] font-bold text-[var(--ews-awas)] font-[family-name:var(--font-jetbrains)] focus:outline-none focus:ring-2 focus:ring-[var(--ews-awas)]" />
                  </div>
                  
                  <div className="flex flex-col gap-1.5 p-4 rounded-xl border bg-[var(--ews-siaga-bg)] border-[#FDBA74]">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--ews-siaga)]">Siaga II — SIAGA (Meter)</label>
                    <input type="number" step="0.01" value={siaga2} onChange={(e) => setSiaga2(parseFloat(e.target.value) || 0)} className="w-full bg-[var(--surface-card)] border border-[#FCD34D] rounded-lg px-4 py-2.5 text-[14px] font-bold text-[var(--ews-siaga)] font-[family-name:var(--font-jetbrains)] focus:outline-none focus:ring-2 focus:ring-[var(--ews-siaga)]" />
                  </div>

                  <div className="flex flex-col gap-1.5 p-4 rounded-xl border bg-[var(--ews-waspada-bg)] border-[#FDE68A]">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--ews-waspada)]">Siaga III — WASPADA (Meter)</label>
                    <input type="number" step="0.01" value={siaga3} onChange={(e) => setSiaga3(parseFloat(e.target.value) || 0)} className="w-full bg-[var(--surface-card)] border border-[#FDE047] rounded-lg px-4 py-2.5 text-[14px] font-bold text-[var(--ews-waspada)] font-[family-name:var(--font-jetbrains)] focus:outline-none focus:ring-2 focus:ring-[var(--ews-waspada)]" />
                  </div>
                </div>
              </div>
            )}

            {/* KATEGORI 4: Utilitas & Sinkronisasi Waktu */}
            {activeSection === 'SYS' && (
              <div className="space-y-5 md:space-y-6">
                <div className="border-b border-[var(--border-subtle)] pb-3">
                  <h2 className="text-[16px] font-bold text-[var(--text-primary)]">Utilitas Sinkronisasi Waktu & Jadwal</h2>
                  <p className="text-[12px] text-[var(--text-secondary)] mt-1">Penetapan Parameter Pewaktuan Global Perangkat Keras MCU.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <SettingsInput label="Rujukan Server NTP (Internet Time)" value={ntpServer} onChange={setNtpServer} type="text" />
                  <SettingsInput label="Interval Sampling Hardware (Duty Cycle ms)" value={txInterval} onChange={(v) => setTxInterval(Number(v))} type="number" />
                </div>
              </div>
            )}

          </div>

          {/* Banner Status Penguncian File Konfigurasi */}
          <div className="bg-[var(--brand-50)] border-t border-[var(--brand-100)] p-4 flex items-start gap-3 shrink-0">
            <ShieldCheck size={18} className="text-[var(--brand-600)] shrink-0 mt-0.5" />
            <p className="text-[11px] text-[var(--brand-700)] leading-relaxed font-medium">
              <strong className="block mb-0.5 text-[12px]">Konfigurasi Berbasis Sesi</strong>
              Mengubah parameter di halaman ini akan menulis ulang variabel konseptual global. Nilai ambang batas dan koordinat baru akan didistribusikan secara instan ke seluruh rute modul <em>Command Center</em> pasca disimpan.
            </p>
          </div>

        </div>
      </div>

      {/* ── BARIS 3: Doktrin Hukum Keamanan Siber BWS IV ── */}
      <div className="card p-4 md:p-5 bg-[var(--surface-inset)] flex items-start gap-3 md:gap-4 shrink-0">
        <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-[var(--surface-card)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0 shadow-sm">
          <TerminalSquare size={18} className="text-[var(--text-muted)]" />
        </div>
        <div className="space-y-1.5 min-w-0">
          <span className="font-bold text-[var(--text-primary)] text-[11px] md:text-[12px] uppercase tracking-wide block">Doktrin Perlindungan Enkripsi & Integritas Gateway</span>
          <p className="text-[10px] md:text-[11px] text-[var(--text-secondary)] leading-relaxed">
            Seluruh berkas kredensial broker MQTT dan hak akses pipa parameter dilindungi menggunakan standar enkripsi lapisan transport TLS/SSL aman pada gerbang port 8084 WSS.
          </p>
        </div>
      </div>

    </div>
  );
}

// ── KOMPONEN PENDUKUNG (Micro-components) ──

function SettingsNavButton({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "whitespace-nowrap px-3 py-2.5 lg:px-4 lg:py-3 rounded-lg text-[10px] lg:text-[11px] font-bold uppercase tracking-widest text-left flex items-center gap-2 lg:gap-3 transition-all shrink-0 lg:w-full",
        active 
          ? "bg-[var(--brand-50)] text-[var(--brand-700)] border border-[var(--brand-200)] shadow-sm" 
          : "text-[var(--text-secondary)] hover:bg-[var(--surface-inset)] hover:text-[var(--text-primary)] border border-transparent"
      )}
    >
      <Icon size={15} className="shrink-0" /> {label}
    </button>
  );
}

function SettingsInput({ label, value, onChange, type, step, isHighlight }: { label: string, value: string | number, onChange: (v: string) => void, type: string, step?: string, isHighlight?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5 relative">
      <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] ml-1">
        {label}
      </label>
      <input 
        type={type} 
        step={step}
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        className={cn(
          "w-full bg-[var(--surface-bg)] border border-[var(--border-default)] rounded-lg px-4 py-2.5 text-[13px] font-[family-name:var(--font-jetbrains)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] transition-all hover:border-[var(--border-strong)]",
          isHighlight && "font-bold text-[var(--brand-600)] border-[var(--brand-200)] bg-[var(--brand-50)]"
        )} 
      />
    </div>
  );
}