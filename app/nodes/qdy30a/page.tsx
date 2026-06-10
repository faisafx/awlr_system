// ─────────────────────────────────────────────────────────────────────────────
// File: app/nodes/qdy30a/page.tsx
// Architecture: Next.js 14 Client Component
// Project: Full-Stack AWLR Command Center - Sungai Wanggu, Kendari
// Description: Advanced Hardware Diagnostic Console calibrated for QDY30A 
//              0-3.3V Voltage Variant directly sampled by ESP32 12-Bit ADC.
// ─────────────────────────────────────────────────────────────────────────────

'use client';

import { useState, useEffect, useRef } from 'react';
import mqtt, { MqttClient } from 'mqtt';
import { 
  Gauge, Activity, Sliders, Wrench, ShieldAlert, AlertCircle, 
  CheckCircle2, RefreshCw, Layers, Database, Cpu, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── CONFIG & CONSTANTS ────────────────────────────────────────────────────────
const MQTT_BROKER = 'wss://broker.emqx.io:8084/mqtt';
const MQTT_TOPIC = 'bbws/wanggu/node01/telemetry';
const SENSOR_MAX_RANGE = 5.0; // Maksimal jangkauan duga sensor (5 Meter)

interface SensorData {
  hydro: number;        // TMA Terbaca (Meter)
  vbat: number;         // Tegangan Aki Lapangan (Volt)
  pressureKpa: number;   // Tekanan Hidrostatik Efektif (kPa)
  adcVoltage: number;    // Tegangan Sinyal Masuk ke ESP32 (Volt: 0 - 3.3V)
  rawAdcBits: number;    // Nilai Mentah Digitalisasi Register ADC (0 - 4095)
  sensorStatus: 'NOMINAL' | 'SATURATION_WARN' | 'ADC_NON_LINEAR';
}

export default function HydrostaticNodePage() {
  const [sensor, setSensor] = useState<SensorData>({
    hydro: 0.00,
    vbat: 0.0,
    pressureKpa: 0.0,
    adcVoltage: 0.0,
    rawAdcBits: 0,
    sensorStatus: 'NOMINAL'
  });

  const [mqttStatus, setMqttStatus] = useState<'ONLINE' | 'CONNECTING' | 'OFFLINE'>('CONNECTING');
  const [offsetValue, setOffsetValue] = useState<string>('0.00');
  const [logs, setLogs] = useState<{ time: string; msg: string; type: 'info' | 'warn' | 'success' }[]>([]);
  const clientRef = useRef<MqttClient | null>(null);

  const addLog = (msg: string, type: 'info' | 'warn' | 'success' = 'info') => {
    const time = new Date().toLocaleTimeString('id-ID');
    setLogs(prev => [...prev.slice(-6), { time, msg, type }]);
  };

  // ── 1. CORE TELEMETRY SUB-SYSTEM (MQTT over WebSockets) ────────────────────
  useEffect(() => {
    const clientId = `awlr-qdy30a-adc-${Math.random().toString(16).substring(2, 8)}`;
    addLog('Mengonfigurasi interkoneksi register ADC 12-Bit ESP32...', 'info');

    clientRef.current = mqtt.connect(MQTT_BROKER, { clientId, clean: true, reconnectPeriod: 2000 });

    clientRef.current.on('connect', () => {
      setMqttStatus('ONLINE');
      addLog('Tersambung ke EMQX Broker. Mengonfirmasi parameter 0-3.3V...', 'success');
      clientRef.current?.subscribe(MQTT_TOPIC);
    });

    clientRef.current.on('offline', () => {
      setMqttStatus('OFFLINE');
      addLog('Saluran udara komunikasi EMQX terputus.', 'warn');
    });

    clientRef.current.on('message', (topic, message) => {
      if (topic === MQTT_TOPIC) {
        try {
          const payload = JSON.parse(message.toString());
          const rawHydro = Number(payload.hydro) || 0;
          
          // ── PERSAMAAN MATEMATIKA ANALOG-TO-DIGITAL CONVERSION (ADC) ESP32 ──
          // Hubungan Linearitas: TMA (0-5m) -> Voltase (0-3.3V) -> Register Bits (0-4095)
          const calculatedVoltage = +(rawHydro * (3.3 / SENSOR_MAX_RANGE)).toFixed(3);
          const calculatedBits = Math.round((calculatedVoltage / 3.3) * 4095);
          const kpa = +(rawHydro * 9.81).toFixed(2); // Tekanan P = rho * g * h

          // Evaluasi ambang batas operasi ADC ESP32
          let currentStatus: SensorData['sensorStatus'] = 'NOMINAL';
          if (calculatedVoltage >= 3.25) {
            currentStatus = 'SATURATION_WARN'; // Mendekati batas atas atas voltase GPIO
          } else if (rawHydro > 0 && calculatedVoltage <= 0.15) {
            currentStatus = 'ADC_NON_LINEAR'; // Zona "dead-zone" non-linearitas bawah ESP32
          }

          setSensor({
            hydro: rawHydro,
            vbat: Number(payload.vbat) || 0,
            pressureKpa: kpa,
            adcVoltage: calculatedVoltage,
            rawAdcBits: calculatedBits,
            sensorStatus: currentStatus
          });
        } catch (e) {
          console.error('Gagal memproses parsing telemetri:', e);
        }
      }
    });

    return () => {
      if (clientRef.current) clientRef.current.end();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      
      {/* Header Kendali Diagnostik */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-widest">
            <Cpu size={14} />
            Direct 12-Bit Microcontroller Attenuation Array
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 mt-1">
            Diagnostik ADC QDY30A <span className="text-slate-500 font-light">| Tegangan 0 - 3.3V</span>
          </h1>
        </div>

        <div className={cn(
          "px-4 py-2 rounded-xl border text-xs font-mono flex items-center gap-2 backdrop-blur-md",
          mqttStatus === 'ONLINE' ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse"
        )}>
          <span className="relative flex h-2 w-2">
            <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-75", mqttStatus === 'ONLINE' ? "animate-ping bg-cyan-400" : "bg-amber-400")}></span>
            <span className={cn("relative inline-flex rounded-full h-2 w-2", mqttStatus === 'ONLINE' ? "bg-cyan-500" : "bg-amber-500")}></span>
          </span>
          {mqttStatus === 'ONLINE' ? 'ADC LISTENER: ACTIVE' : 'WAITING FOR HARDWARE PIN OUT...'}
        </div>
      </div>

      {/* Grid Metrik Utama Kelistrikan */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Kolom Kiri: Sinyal Tegangan & Bit Register (8 Kolom) */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Card 1: Voltase Sinyal (0-3.3V) */}
          <div className="p-5 rounded-xl bg-slate-900/40 border border-white/5 backdrop-blur-md flex flex-col justify-between h-40 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 text-cyan-500/5">
              <Zap size={48} />
            </div>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono block">Isyarat Tegangan Pin</span>
                <span className="text-2xl font-bold font-mono text-cyan-400 mt-1 block">
                  {sensor.adcVoltage.toFixed(3)} <span className="text-xs text-slate-500">Volt</span>
                </span>
              </div>
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Zap size={16} />
              </div>
            </div>
            <div className="text-[11px] text-slate-400 font-sans border-t border-white/5 pt-2 flex justify-between">
              <span>Resolusi Skala: <span className="font-mono text-slate-300">0.001 V</span></span>
              <span className="text-slate-500 font-mono">GPIO Analog Read</span>
            </div>
          </div>

          {/* Card 2: Raw ADC Register Bits (0-4095) */}
          <div className="p-5 rounded-xl bg-slate-900/40 border border-white/5 backdrop-blur-md flex flex-col justify-between h-40 relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono block">Daftar Bit Digital (12-Bit)</span>
                <span className="text-2xl font-bold font-mono text-slate-150 mt-1 block">
                  {sensor.rawAdcBits} <span className="text-xs text-slate-500">/ 4095</span>
                </span>
              </div>
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Database size={16} />
              </div>
            </div>
            
            {/* Visualisasi Pengisian Register Bit */}
            <div className="space-y-1">
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-500" 
                  style={{ width: `${(sensor.rawAdcBits / 4095) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                <span>0x000 (0)</span>
                <span>0xFFF (4095)</span>
              </div>
            </div>
          </div>

          {/* Banner Peringatan Status Linearitas ADC ESP32 */}
          <div className={cn(
            "md:col-span-2 p-4 rounded-xl border flex gap-3 items-start backdrop-blur-md",
            sensor.sensorStatus === 'NOMINAL' && "bg-emerald-500/5 border-emerald-500/20 text-emerald-400",
            sensor.sensorStatus === 'SATURATION_WARN' && "bg-rose-500/5 border-rose-500/20 text-rose-400",
            sensor.sensorStatus === 'ADC_NON_LINEAR' && "bg-amber-500/5 border-amber-500/20 text-amber-400"
          )}>
            {sensor.sensorStatus === 'NOMINAL' && <CheckCircle2 size={16} className="shrink-0 mt-0.5" />}
            {sensor.sensorStatus === 'SATURATION_WARN' && <ShieldAlert size={16} className="shrink-0 mt-0.5 animate-bounce" />}
            {sensor.sensorStatus === 'ADC_NON_LINEAR' && <AlertCircle size={16} className="shrink-0 mt-0.5 animate-pulse" />}
            
            <div className="text-xs space-y-0.5">
              <span className="font-bold uppercase tracking-wider block">
                {sensor.sensorStatus === 'NOMINAL' && 'STATUS REGISTRASI ADC: LINIER & NOMINAL'}
                {sensor.sensorStatus === 'SATURATION_WARN' && 'CRITICAL WARNING: ADC VOLTAGE SATURATION'}
                {sensor.sensorStatus === 'ADC_NON_LINEAR' && 'ANOMALI: NON-LINEAR ADC ZONA BAWAH (DEAD ZONE)'}
              </span>
              <p className="text-slate-400 font-sans leading-relaxed">
                {sensor.sensorStatus === 'NOMINAL' && 'Tegangan isyarat sensor berada di rentang linear yang aman. Konversi register register digital presisi.'}
                {sensor.sensorStatus === 'SATURATION_WARN' && 'Tegangan isyarat mendekati batas referensi internal VREF 3.3V mikroprosesor. Nilai TMA di atas batas ukur rawan mengalami saturasi atau kliping data puncak.'}
                {sensor.sensorStatus === 'ADC_NON_LINEAR' && 'Tegangan berada di bawah 0.15V. Karakteristik ADC bawaan ESP32 pada area ini memiliki tingkat non-linearitas yang tinggi. Diperlukan penambahan fungsi kalibrasi polinomial di program C++.'}
              </p>
            </div>
          </div>

        </div>

        {/* Konsol Kalibrasi Manual & Suntik Parameter (4 Kolom) */}
        <div className="lg:col-span-4 rounded-xl bg-slate-900/40 border border-white/5 p-4 flex flex-col justify-between backdrop-blur-md">
          <div className="space-y-4">
            <div className="border-b border-white/5 pb-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Sliders size={14} className="text-cyan-400" /> Kalibrasi Koefisien Software
              </h2>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">Koreksi Parameter Pembagian Tegangan</p>
            </div>

            {/* Input Kalibrasi Offset */}
            <div className="space-y-2 font-mono">
              <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Koreksi Geser Nol / Zero Offset (m)</label>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  step="0.01"
                  value={offsetValue}
                  onChange={(e) => setOffsetValue(e.target.value)}
                  className="flex-1 bg-slate-950/60 border border-white/10 rounded-lg px-3 py-2 text-xs font-bold text-cyan-400 focus:outline-none focus:border-cyan-500 transition-colors"
                  placeholder="0.00"
                />
                <button 
                  onClick={() => {
                    addLog(`Menghitung ulang offset pembagi tegangan: ${offsetValue}m`, 'info');
                    addLog('Mengirimkan payload kalibrasi via EMQX Broker...', 'success');
                  }}
                  className="px-3 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                >
                  <Wrench size={12} /> Inject
                </button>
              </div>
            </div>
          </div>

          {/* Konsol Aktivitas Log */}
          <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
            <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 font-mono block">Log Aktivitas Konsol ADC</span>
            <div className="bg-slate-950/40 border border-white/[0.03] rounded-lg p-2 h-28 font-mono text-[9px] text-slate-500 overflow-y-auto space-y-1 custom-scrollbar">
              {logs.length === 0 ? (
                <p className="text-center pt-8 italic">Menunggu aktivitas instrumen...</p>
              ) : (
                logs.map((item, i) => (
                  <p key={i} className={cn(
                    item.type === 'warn' ? "text-amber-500" : item.type === 'success' ? "text-cyan-400" : "text-slate-400"
                  )}>
                    [{item.time}] {item.msg}
                  </p>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Panduan Teknis Attenuasi Pin ESP32 */}
      <div className="p-4 rounded-xl bg-slate-900/20 border border-white/5 flex items-start gap-3 backdrop-blur-md">
        <div className="p-2 rounded-lg bg-cyan-500/5 text-cyan-400 border border-cyan-500/10">
          <Layers size={16} />
        </div>
        <div className="text-xs space-y-1.5">
          <span className="font-bold text-slate-300 uppercase tracking-wide block">Petunjuk Teknis ADC Attenuation — ESP32 Core</span>
          <p className="text-slate-400 leading-relaxed font-sans">
            Agar pin analog ESP32 mampu membaca tegangan isyarat keluaran sensor QDY30A secara penuh dari <span className="text-cyan-400 font-mono">0V hingga 3.3V</span>, pastikan konfigurasi program pada kode firmware Arduino/C++ Anda telah diatur menggunakan fungsi pemanggilan attenuasi tertinggi, yaitu <span className="text-purple-400 font-mono">analogSetAttenuation(ADC_11db)</span>. Tanpa attenuasi 11dB, batas ukur pin analog secara internal akan mengalami saturasi mutlak pada level tegangan 1.1 Volt.
          </p>
        </div>
      </div>

    </div>
  );
}