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
  Database, RefreshCw, Lock, TerminalSquare, Info, ShieldCheck
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
    <div className="space-y-6">
      
      {/* ── BARIS 1: Header Dokumen ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-widest">
            <Settings size={14} />
            Centralized Core Configuration Panel
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 mt-1">
            Pengaturan Global Sistem <span className="text-slate-500 font-light">| Command Center</span>
          </h1>
        </div>

        {/* Tombol Simpan Global Form */}
        <button
          onClick={handleSaveConfiguration}
          disabled={isSaving}
          className="px-4 py-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 rounded-xl text-xs font-bold font-mono transition-colors flex items-center gap-2 disabled:opacity-50 shadow-[0_0_15px_rgba(6,182,212,0.05)]"
        >
          {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
          {isSaving ? 'MENGUNCI PARAMETER...' : 'SIMPAN CONFIG UTAMA'}
        </button>
      </div>

      {/* ── BARIS 2: Layout Belah Dua (Navigasi Kiri vs Form Kanan) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* PANEL KIRIM: Navigasi Kategori Pengaturan (3 Kolom) */}
        <div className="lg:col-span-3 flex flex-col space-y-1 bg-slate-900/40 border border-white/5 p-2 rounded-xl backdrop-blur-md">
          <button
            onClick={() => setActiveSection('MQTT')}
            className={cn(
              "w-full px-3 py-2.5 rounded-lg text-xs font-mono font-medium uppercase tracking-wider text-left flex items-center gap-2.5 transition-colors",
              activeSection === 'MQTT' ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/10" : "text-slate-400 hover:bg-white/[0.02] hover:text-slate-200"
            )}
          >
            <Radio size={14} /> Pipeline & Broker MQTT
          </button>
          <button
            onClick={() => setActiveSection('STATION')}
            className={cn(
              "w-full px-3 py-2.5 rounded-lg text-xs font-mono font-medium uppercase tracking-wider text-left flex items-center gap-2.5 transition-colors",
              activeSection === 'STATION' ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/10" : "text-slate-400 hover:bg-white/[0.02] hover:text-slate-200"
            )}
          >
            <Globe size={14} /> Anchor & Metadata Stasiun
          </button>
          <button
            onClick={() => setActiveSection('THRES')}
            className={cn(
              "w-full px-3 py-2.5 rounded-lg text-xs font-mono font-medium uppercase tracking-wider text-left flex items-center gap-2.5 transition-colors",
              activeSection === 'THRES' ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/10" : "text-slate-400 hover:bg-white/[0.02] hover:text-slate-200"
            )}
          >
            <ShieldAlert size={14} /> Ambang Batas EWS (PUPR)
          </button>
          <button
            onClick={() => setActiveSection('SYS')}
            className={cn(
              "w-full px-3 py-2.5 rounded-lg text-xs font-mono font-medium uppercase tracking-wider text-left flex items-center gap-2.5 transition-colors",
              activeSection === 'SYS' ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/10" : "text-slate-400 hover:bg-white/[0.02] hover:text-slate-200"
            )}
          >
            <Database size={14} /> Utilitas & Sinkronisasi Waktu
          </button>
        </div>

        {/* PANEL KANAN: Form Pengisian Dinamis (9 Kolom) */}
        <div className="lg:col-span-9 bg-slate-900/40 border border-white/5 p-5 rounded-xl backdrop-blur-md min-h-[320px] flex flex-col justify-between">
          
          <div className="space-y-5">
            
            {/* KATEGORI 1: Pipeline & Broker MQTT */}
            {activeSection === 'MQTT' && (
              <div className="space-y-4">
                <div className="border-b border-white/5 pb-2">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">Pipa Jalur Data Jaringan</h2>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">Kredensial Koneksi Gateway EMQX Publik/Privat</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                  <div className="space-y-1.5">
                    <span className="text-slate-500 uppercase text-[9px] block">Broker URL Host (WebSockets)</span>
                    <input type="text" value={mqttHost} onChange={(e) => setMqttHost(e.target.value)} className="w-full bg-slate-950/60 border border-white/10 rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:border-cyan-500 font-bold" />
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-slate-500 uppercase text-[9px] block">WSS secure Port</span>
                    <input type="number" value={mqttPort} onChange={(e) => setMqttPort(parseInt(e.target.value) || 8084)} className="w-full bg-slate-950/60 border border-white/10 rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:border-cyan-500 font-bold" />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <span className="text-slate-500 uppercase text-[9px] block">Master Ingress Telemetry Topic</span>
                    <input type="text" value={mqttTopic} onChange={(e) => setMqttTopic(e.target.value)} className="w-full bg-slate-950/60 border border-white/10 rounded-lg px-3 py-2 text-cyan-400 focus:outline-none focus:border-cyan-500 font-bold animate-pulse" />
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-slate-500 uppercase text-[9px] block">Gateway Client Username</span>
                    <input type="text" value={mqttUser} onChange={(e) => setMqttUser(e.target.value)} className="w-full bg-slate-950/60 border border-white/10 rounded-lg px-3 py-2 text-slate-400 focus:outline-none focus:border-cyan-500" />
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-slate-500 uppercase text-[9px] block">Gateway Client Password</span>
                    <div className="relative">
                      <input type="password" value="••••••••••••" disabled className="w-full bg-slate-950/40 border border-white/5 rounded-lg px-3 py-2 text-slate-600 focus:outline-none cursor-not-allowed select-none" />
                      <Lock size={12} className="absolute right-3 top-3 text-slate-600" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* KATEGORI 2: Anchor & Metadata Stasiun */}
            {activeSection === 'STATION' && (
              <div className="space-y-4">
                <div className="border-b border-white/5 pb-2">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">Metadata Registrasi Geografis</h2>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">Identitas Absolut Penempatan Fisik Stasiun Lapangan</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                  <div className="space-y-1.5">
                    <span className="text-slate-500 uppercase text-[9px] block">Nama Resmi Stasiun Pantau</span>
                    <input type="text" value={stationName} onChange={(e) => setStationName(e.target.value)} className="w-full bg-slate-950/60 border border-white/10 rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:border-cyan-500 font-bold" />
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-slate-500 uppercase text-[9px] block">Kode Aset Registrasi BMN</span>
                    <input type="text" value={assetCode} onChange={(e) => setAssetCode(e.target.value)} className="w-full bg-slate-950/60 border border-white/10 rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:border-cyan-500" />
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-slate-500 uppercase text-[9px] block">Jangkar Lintang (Latitude desimal)</span>
                    <input type="number" step="0.000001" value={latitude} onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)} className="w-full bg-slate-950/60 border border-white/10 rounded-lg px-3 py-2 text-cyan-400 focus:outline-none focus:border-cyan-500 font-bold" />
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-slate-500 uppercase text-[9px] block">Jangkar Bujur (Longitude desimal)</span>
                    <input type="number" step="0.000001" value={longitude} onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)} className="w-full bg-slate-950/60 border border-white/10 rounded-lg px-3 py-2 text-cyan-400 focus:outline-none focus:border-cyan-500 font-bold" />
                  </div>
                </div>
              </div>
            )}

            {/* KATEGORI 3: Ambang Batas EWS (PUPR) */}
            {activeSection === 'THRES' && (
              <div className="space-y-4">
                <div className="border-b border-white/5 pb-2">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">Ambang Batas Kedaruratan Vertikal</h2>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">Konfigurasi Aturan Sempadan Banjir Standar Ditjen SDA</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                  <div className="space-y-1.5 p-3 rounded-lg bg-rose-500/5 border border-rose-500/10">
                    <span className="text-rose-400 uppercase text-[9px] font-bold block">Siaga I — AWAS (Meter)</span>
                    <input type="number" step="0.01" value={siaga1} onChange={(e) => setSiaga1(parseFloat(e.target.value) || 0)} className="w-full bg-slate-950/60 border border-rose-500/20 rounded-lg px-3 py-2 text-rose-400 font-bold focus:outline-none focus:border-rose-500" />
                  </div>
                  <div className="space-y-1.5 p-3 rounded-lg bg-orange-500/5 border border-orange-500/10">
                    <span className="text-orange-400 uppercase text-[9px] font-bold block">Siaga II — SIAGA (Meter)</span>
                    <input type="number" step="0.01" value={siaga2} onChange={(e) => setSiaga2(parseFloat(e.target.value) || 0)} className="w-full bg-slate-950/60 border border-orange-500/20 rounded-lg px-3 py-2 text-orange-400 font-bold focus:outline-none focus:border-orange-500" />
                  </div>
                  <div className="space-y-1.5 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                    <span className="text-amber-400 uppercase text-[9px] font-bold block">Siaga III — WASPADA (Meter)</span>
                    <input type="number" step="0.01" value={siaga3} onChange={(e) => setSiaga3(parseFloat(e.target.value) || 0)} className="w-full bg-slate-950/60 border border-amber-500/20 rounded-lg px-3 py-2 text-amber-400 font-bold focus:outline-none focus:border-amber-500" />
                  </div>
                </div>
              </div>
            )}

            {/* KATEGORI 4: Utilitas & Sinkronisasi Waktu */}
            {activeSection === 'SYS' && (
              <div className="space-y-4">
                <div className="border-b border-white/5 pb-2">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">Utilitas Sinkronisasi Waktu & Jadwal</h2>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">Penetapan Parameter Pewaktuan Global Perangkat Keras</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                  <div className="space-y-1.5">
                    <span className="text-slate-500 uppercase text-[9px] block">Rujukan Server NTP (Internet Time)</span>
                    <input type="text" value={ntpServer} onChange={(e) => setNtpServer(e.target.value)} className="w-full bg-slate-950/60 border border-white/10 rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:border-cyan-500" />
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-slate-500 uppercase text-[9px] block">Interval Sampling Hardware (Duty Cycle ms)</span>
                    <input type="number" value={txInterval} onChange={(e) => setTxInterval(parseInt(e.target.value) || 4000)} className="w-full bg-slate-950/60 border border-white/10 rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:border-cyan-500 font-bold" />
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Banner Status Penguncian File Konfigurasi */}
          <div className="p-3 mt-6 rounded-lg bg-cyan-500/5 border border-cyan-500/15 text-[11px] text-slate-400 flex items-center gap-2.5 font-sans">
            <ShieldCheck size={14} className="text-cyan-400 shrink-0" />
            <p>
              Mengubah parameter di halaman ini akan menulis ulang variabel konseptual global. Nilai ambang batas dan koordinat baru akan didistribusikan secara instan ke seluruh rute modul *Command Center* pasca komit disimpan.
            </p>
          </div>

        </div>
      </div>

      {/* ── BARIS 3: Doktrin Hukum Keamanan Siber BWS IV ── */}
      <div className="p-4 rounded-xl bg-slate-900/20 border border-white/5 flex items-start gap-3 backdrop-blur-md">
        <div className="p-2 rounded-lg bg-cyan-500/5 text-cyan-400 border border-cyan-500/10">
          <TerminalSquare size={16} />
        </div>
        <div className="text-xs space-y-1">
          <span className="font-bold text-slate-300 uppercase tracking-wide block">Doktrin Perlindungan Enkripsi & Integritas Gateway — Protokol Keamanan</span>
          <p className="text-slate-400 leading-relaxed font-sans">
            Seluruh berkas kredensial broker MQTT dan hak akses pipa parameter dilindungi menggunakan standar enkripsi lapisan transport TLS/SSL aman pada gerbang port 8084 WSS. Sesuai dengan protokol tata kelola data intelijen kebencanaan Balai Wilayah Sungai Sulawesi IV, pembukaan kunci enkripsi atau modifikasi sebaran koordinat absolut tanpa surat otorisasi dari penanggung jawab teknis dilarang keras guna mencegah manipulasi isyarat peringatan dini (*false injection flood alarms*) oleh pihak luar.
          </p>
        </div>
      </div>

    </div>
  );
}