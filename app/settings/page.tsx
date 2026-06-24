// ─────────────────────────────────────────────────────────────────────────────
// File: app/settings/page.tsx
// Architecture: Next.js 14 Client Component
// Project: Full-Stack AWLR Command Center - Sungai Wanggu, Kendari
// Description: Master Global Settings Console. Manages MQTT pipelines, 
//              PUPR EWS thresholds, and geodetic station anchors.
// ─────────────────────────────────────────────────────────────────────────────

'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Settings, Save, Sliders, Radio, Globe, ShieldAlert, 
  Database, RefreshCw, Lock, TerminalSquare, ShieldCheck,
  Lightbulb, Siren, Power, Zap
} from 'lucide-react';
import mqtt, { MqttClient } from 'mqtt';
import { cn } from '@/lib/utils';

export default function GlobalSettingsPage() {
  const [activeSection, setActiveSection] = useState<'MQTT' | 'STATION' | 'THRES' | 'SYS' | 'ACTUATOR'>('MQTT');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // ── 1. STATE CONFIG PIPELINE MQTT EMQX ──
  const [mqttHost, setMqttHost] = useState<string>('wss://f06e9090.ala.asia-southeast1.emqxsl.com:8084/mqtt');
  const [mqttTopic, setMqttTopic] = useState<string>('awlr/wanggu/sensor');
  const [mqttUser, setMqttUser] = useState<string>('faisal');
  const [mqttPass, setMqttPass] = useState<string>('faisalwibu11');

  useEffect(() => {
    const savedBroker = localStorage.getItem('mqtt_broker');
    const savedTopic = localStorage.getItem('mqtt_topic');
    const savedUser = localStorage.getItem('mqtt_user');
    const savedPass = localStorage.getItem('mqtt_pass');
    
    if (savedBroker) setMqttHost(savedBroker);
    if (savedTopic) setMqttTopic(savedTopic);
    if (savedUser) setMqttUser(savedUser);
    if (savedPass) setMqttPass(savedPass);
  }, []);

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

  // ── 5. STATE MANUAL ACTUATOR TEST ──
  const clientRef = useRef<MqttClient | null>(null);
  const [relay1Siren, setRelay1Siren] = useState(false);
  const [relay2Alarm, setRelay2Alarm] = useState(false);
  const [mqttStatus, setMqttStatus] = useState<'DISCONNECTED' | 'CONNECTED'>('DISCONNECTED');

  // Efek untuk koneksi MQTT background khusus untuk pengujian aktuator
  useEffect(() => {
    if (activeSection !== 'ACTUATOR') return;
    
    // Gunakan kredensial yang ada di state atau localStorage
    const broker = mqttHost;
    const clientId = `awlr-setting-${Math.random().toString(16).substring(2, 8)}`;
    
    if (!clientRef.current || !clientRef.current.connected) {
      clientRef.current = mqtt.connect(broker, {
        clientId,
        username: mqttUser,
        password: mqttPass,
        clean: true,
      });

      clientRef.current.on('connect', () => {
        setMqttStatus('CONNECTED');
        clientRef.current?.subscribe(mqttTopic, { qos: 0 });
        clientRef.current?.subscribe('awlr/wanggu/control', { qos: 0 });
      });

      clientRef.current.on('message', (topic, message) => {
        try {
          const payload = JSON.parse(message.toString());
          if (payload.relay1Siren !== undefined) setRelay1Siren(Boolean(payload.relay1Siren));
          if (payload.relay2Alarm !== undefined) setRelay2Alarm(Boolean(payload.relay2Alarm));
        } catch (e) {}
      });

      clientRef.current.on('offline', () => setMqttStatus('DISCONNECTED'));
    }

    return () => {
      // Kita biarkan terkoneksi selama tab aktif, cleanup jika ganti tab
      // clientRef.current?.end(); 
    };
  }, [activeSection, mqttHost, mqttUser, mqttPass, mqttTopic]);

  const toggleActuator = (relayKey: 'relay1Siren' | 'relay2Alarm', newState: boolean) => {
    if (clientRef.current && clientRef.current.connected) {
      const payload = JSON.stringify({ [relayKey]: newState });
      clientRef.current.publish('awlr/wanggu/control', payload, { qos: 0 });
      // Optimistic update
      if (relayKey === 'relay1Siren') setRelay1Siren(newState);
      if (relayKey === 'relay2Alarm') setRelay2Alarm(newState);
    } else {
      alert('Gagal mengirim perintah: MQTT belum terhubung.');
    }
  };

  const handleSaveConfiguration = () => {
    setIsSaving(true);
    
    if (activeSection === 'MQTT') {
      localStorage.setItem('mqtt_broker', mqttHost);
      localStorage.setItem('mqtt_topic', mqttTopic);
      localStorage.setItem('mqtt_user', mqttUser);
      localStorage.setItem('mqtt_pass', mqttPass);
    }

    setTimeout(() => {
      setIsSaving(false);
      alert('Konfigurasi MQTT berhasil diperbarui. Perubahan akan berlaku ketika memuat ulang Dashboard (Halaman Utama).');
    }, 800);
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
            active={activeSection === 'ACTUATOR'} 
            onClick={() => setActiveSection('ACTUATOR')} 
            icon={Zap} 
            label="Test Aktuator" 
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
                  <div className="md:col-span-2">
                    <SettingsInput label="Broker URL Host (WebSockets)" value={mqttHost} onChange={setMqttHost} type="text" />
                  </div>
                  <div className="md:col-span-2">
                    <SettingsInput label="Master Ingress Telemetry Topic" value={mqttTopic} onChange={setMqttTopic} type="text" isHighlight />
                  </div>
                  <SettingsInput label="Gateway Client Username" value={mqttUser} onChange={setMqttUser} type="text" />
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Gateway Client Password</label>
                    <div className="relative">
                      <input 
                        type="password" 
                        value={mqttPass} 
                        onChange={(e) => setMqttPass(e.target.value)} 
                        className="w-full bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-lg px-4 py-2.5 text-[13px] text-[var(--text-primary)] font-[family-name:var(--font-jetbrains)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]" 
                      />
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

            {/* KATEGORI 5: Pengujian Aktuator Lokal */}
            {activeSection === 'ACTUATOR' && (
              <div className="space-y-5 md:space-y-6">
                <div className="border-b border-[var(--border-subtle)] pb-3 flex justify-between items-end">
                  <div>
                    <h2 className="text-[16px] font-bold text-[var(--text-primary)]">Pengujian Aktuator Lokal</h2>
                    <p className="text-[12px] text-[var(--text-secondary)] mt-1">Uji coba nyala/mati lampu indikator (12V) dan sirene MS-290 secara real-time via MQTT.</p>
                  </div>
                  <div className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border", mqttStatus === 'CONNECTED' ? "bg-[#ECFDF5] text-[#10B981] border-[#A7F3D0]" : "bg-[#FEF2F2] text-[#EF4444] border-[#FECACA]")}>
                    {mqttStatus === 'CONNECTED' ? 'ONLINE' : 'OFFLINE'}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Kartu Relay 1 (Lampu) */}
                  <div className="rounded-xl p-5 flex flex-col items-center gap-4 border-2 transition-all duration-300 relative overflow-hidden" style={{ borderColor: relay1Siren ? '#F59E0B' : 'var(--border-subtle)', background: relay1Siren ? '#FFFBEB' : 'var(--surface-card)' }}>
                    {relay1Siren && <div className="absolute inset-0 bg-[#F59E0B] opacity-5 animate-pulse" />}
                    
                    <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-inner relative z-10 transition-all duration-300" style={{ background: relay1Siren ? '#FEF3C7' : 'var(--surface-inset)', boxShadow: relay1Siren ? '0 0 30px rgba(245, 158, 11, 0.4)' : 'none' }}>
                      <Lightbulb size={40} style={{ color: relay1Siren ? '#F59E0B' : 'var(--text-disabled)', fill: relay1Siren ? '#F59E0B' : 'transparent', transition: 'all 0.3s' }} />
                    </div>
                    
                    <div className="text-center relative z-10">
                      <h3 className="text-[15px] font-bold" style={{ color: relay1Siren ? '#D97706' : 'var(--text-primary)' }}>Lampu Indikator (12V)</h3>
                      <p className="text-[11px] text-[var(--text-muted)] mt-1 font-[family-name:var(--font-jetbrains)] uppercase tracking-wider">ESP32 Relay IN1</p>
                    </div>
                    
                    <button 
                      onClick={() => toggleActuator('relay1Siren', !relay1Siren)}
                      className="px-6 py-3 w-full max-w-[200px] rounded-xl font-bold text-[12px] flex items-center justify-center gap-2 transition-all duration-300 relative z-10 shadow-sm hover:scale-105 active:scale-95"
                      style={{ background: relay1Siren ? '#F59E0B' : 'var(--surface-bg)', color: relay1Siren ? 'white' : 'var(--text-primary)', border: `1px solid ${relay1Siren ? '#F59E0B' : 'var(--border-strong)'}` }}
                    >
                      <Power size={14} className={relay1Siren ? 'animate-pulse' : ''} /> {relay1Siren ? 'MATIKAN LAMPU' : 'NYALAKAN LAMPU'}
                    </button>
                  </div>

                  {/* Kartu Relay 2 (Sirene) */}
                  <div className="rounded-xl p-5 flex flex-col items-center gap-4 border-2 transition-all duration-300 relative overflow-hidden" style={{ borderColor: relay2Alarm ? '#EF4444' : 'var(--border-subtle)', background: relay2Alarm ? '#FEF2F2' : 'var(--surface-card)' }}>
                    {relay2Alarm && <div className="absolute inset-0 bg-[#EF4444] opacity-5 animate-pulse" />}
                    
                    <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-inner relative z-10 transition-all duration-300" style={{ background: relay2Alarm ? '#FEE2E2' : 'var(--surface-inset)', boxShadow: relay2Alarm ? '0 0 30px rgba(239, 68, 68, 0.4)' : 'none' }}>
                      <Siren size={40} style={{ color: relay2Alarm ? '#EF4444' : 'var(--text-disabled)', animation: relay2Alarm ? 'pulse 0.8s infinite' : 'none', transition: 'color 0.3s' }} />
                    </div>
                    
                    <div className="text-center relative z-10">
                      <h3 className="text-[15px] font-bold" style={{ color: relay2Alarm ? '#DC2626' : 'var(--text-primary)' }}>Sirene MS-290 (12V)</h3>
                      <p className="text-[11px] text-[var(--text-muted)] mt-1 font-[family-name:var(--font-jetbrains)] uppercase tracking-wider">ESP32 Relay IN2</p>
                    </div>
                    
                    <button 
                      onClick={() => toggleActuator('relay2Alarm', !relay2Alarm)}
                      className="px-6 py-3 w-full max-w-[200px] rounded-xl font-bold text-[12px] flex items-center justify-center gap-2 transition-all duration-300 relative z-10 shadow-sm hover:scale-105 active:scale-95"
                      style={{ background: relay2Alarm ? '#EF4444' : 'var(--surface-bg)', color: relay2Alarm ? 'white' : 'var(--text-primary)', border: `1px solid ${relay2Alarm ? '#EF4444' : 'var(--border-strong)'}` }}
                    >
                      <Power size={14} className={relay2Alarm ? 'animate-pulse' : ''} /> {relay2Alarm ? 'MATIKAN SIRENE' : 'NYALAKAN SIRENE'}
                    </button>
                  </div>
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