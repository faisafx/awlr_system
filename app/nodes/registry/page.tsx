// ─────────────────────────────────────────────────────────────────────────────
// File: app/nodes/registry/page.tsx
// Architecture: Next.js 14 Client Component
// Description: Dynamic Hardware Registry Page pulling real data from Database API.
// ─────────────────────────────────────────────────────────────────────────────

'use client';

import { useState, useEffect } from 'react';
import { 
  Cpu, Wrench, ShieldCheck, AlertTriangle, Calendar, Info, 
  Clock, Package, HardDrive, Hammer, UserCheck, BarChart2 
} from 'lucide-react';
import { cn } from '@/lib/utils';
export interface HardwareAssetSchema {
  assetCode: string;
  componentName: string;
  modelNumber: string;
  installationDate: string;
  operatingHours: number;
  healthIndex: number;
  calibrationDueDays: number;
  technician: string;
  nodeId: string;
  criticality: string;
}
export default function HardwareRegistryPage() {
  const [assets, setAssets] = useState<HardwareAssetSchema[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<HardwareAssetSchema | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ── FETCH DATA RIIL DARI DATABASE MELALUI API ROUTE ───────────────────────
  useEffect(() => {
    async function loadHardwareData() {
      try {
        setLoading(true);
        const response = await fetch('/api/hardware', { cache: 'no-store' });
        const result = await response.json();
        
        if (result.status === 'success') {
          setAssets(result.data);
          if (result.data.length > 0) {
            setSelectedAsset(result.data[0]); // Default pilih baris pertama
          }
        } else {
          setError(result.message);
        }
      } catch (err) {
        setError('Gagal menghubungkan ke server basis data aset.');
      } finally {
        setLoading(false);
      }
    }
    loadHardwareData();
  }, []);

  // State Loading Skala Enterprise
  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-3 font-mono text-xs text-cyan-500">
        <div className="w-8 h-8 rounded-full border-2 border-t-cyan-500 border-b-cyan-500 border-l-transparent border-r-transparent animate-spin" />
        <p className="animate-pulse tracking-widest">SINKRONISASI MANAJEMEN ASET DATABASE BWS IV...</p>
      </div>
    );
  }

  // State Error Handler jika API/Database Down
  if (error) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-2 text-rose-400 font-mono text-xs">
        <AlertTriangle size={32} className="animate-bounce" />
        <p className="font-bold uppercase tracking-wider">CRITICAL DATA ERROR</p>
        <p className="text-slate-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="border-b border-white/5 pb-5">
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-widest">
          <Package size={14} />
          Infrastructural Asset Lifecycle & Integrity Database
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100 mt-1">
          Registrasi & Integritas Perangkat Keras <span className="text-slate-500 font-light">| Aset BWS IV</span>
        </h1>
      </div>

      {/* Agregat Metrik Atas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/40 border border-white/5 backdrop-blur-md flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
            <HardDrive size={18} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono block">Total Komponen Terpasang</span>
            <span className="text-xl font-bold font-mono text-slate-200">{assets.length} Unit</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/40 border border-white/5 backdrop-blur-md flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
            <Wrench size={18} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono block">Butuh Kalibrasi (&lt;30 Hari)</span>
            <span className="text-xl font-bold font-mono text-amber-400">
              {assets.filter(a => a.calibrationDueDays <= 30).length} Instrumen
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/40 border border-white/5 backdrop-blur-md flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
            <ShieldCheck size={18} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono block">Rata-rata Kesehatan Aset</span>
            <span className="text-xl font-bold font-mono text-emerald-400">
              {(assets.reduce((acc, curr) => acc + curr.healthIndex, 0) / (assets.length || 1)).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* TABEL MASTER (Kiri) */}
        <div className="lg:col-span-8 rounded-xl bg-slate-900/40 border border-white/5 backdrop-blur-md overflow-hidden flex flex-col justify-between">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/60 text-[10px] font-mono uppercase tracking-wider text-slate-500 border-b border-white/5">
                  <th className="p-3.5 font-medium">Nama Komponen / Spesifikasi</th>
                  <th className="p-3.5 font-medium">Kode BMN</th>
                  <th className="p-3.5 font-medium">Indeks Kesehatan</th>
                  <th className="p-3.5 font-medium">Jatuh Tempo Kalibrasi</th>
                </tr>
              </thead>
              <tbody className="text-xs font-mono text-slate-300">
                {assets.map((asset) => {
                  const isCritical = asset.calibrationDueDays <= 30;
                  return (
                    <tr 
                      key={asset.assetCode} 
                      onClick={() => setSelectedAsset(asset)}
                      className={cn(
                        "border-b border-white/5 hover:bg-white/[0.02] cursor-pointer transition-colors",
                        selectedAsset?.assetCode === asset.assetCode ? "bg-cyan-500/5 text-cyan-300" : ""
                      )}
                    >
                      <td className="p-3.5">
                        <span className="font-bold text-slate-200 block font-sans">{asset.componentName}</span>
                        <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">{asset.modelNumber}</span>
                      </td>
                      <td className="p-3.5 text-slate-400">{asset.assetCode}</td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className={cn(
                                "h-full rounded-full",
                                asset.healthIndex >= 85 ? "bg-emerald-500" : asset.healthIndex >= 75 ? "bg-amber-500" : "bg-rose-500"
                              )} 
                              style={{ width: `${asset.healthIndex}%` }}
                            />
                          </div>
                          <span className="font-bold">{asset.healthIndex}%</span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold tracking-wide",
                          isCritical ? "bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse" : "bg-slate-800 text-slate-400"
                        )}>
                          {asset.calibrationDueDays} Hari
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* DETAILS SIDE PANEL (Kanan) */}
        <div className="lg:col-span-4 rounded-xl bg-slate-900/40 border border-white/5 p-4 flex flex-col justify-between backdrop-blur-md relative overflow-hidden">
          {selectedAsset ? (
            <div className="space-y-4">
              <div className="border-b border-white/5 pb-3">
                <span className="text-[9px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/20 font-mono font-bold tracking-wider uppercase">
                  Level Kritis: {selectedAsset.criticality}
                </span>
                <h2 className="text-sm font-bold text-slate-200 mt-2 font-sans">{selectedAsset.componentName}</h2>
                <span className="text-[10px] text-slate-500 font-mono block mt-0.5">{selectedAsset.assetCode}</span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between p-2 rounded bg-slate-950/40 border border-white/[0.02]">
                  <span className="text-slate-500 flex items-center gap-1.5"><Calendar size={12} /> Instalasi Lapangan</span>
                  <span className="text-slate-300 text-right">{new Date(selectedAsset.installationDate).toLocaleDateString()}</span>
                </div>

                <div className="flex justify-between p-2 rounded bg-slate-950/40 border border-white/[0.02]">
                  <span className="text-slate-500 flex items-center gap-1.5"><Clock size={12} /> Durasi Aktif</span>
                  <span className="text-slate-300 text-right font-bold">{selectedAsset.operatingHours.toLocaleString()} Jam</span>
                </div>

                <div className="flex justify-between p-2 rounded bg-slate-950/40 border border-white/[0.02]">
                  <span className="text-slate-500 flex items-center gap-1.5"><Hammer size={12} /> Alokasi Titik</span>
                  <span className="text-slate-300 text-right text-cyan-400">{selectedAsset.nodeId}</span>
                </div>

                <div className="flex justify-between p-2 rounded bg-slate-950/40 border border-white/[0.02]">
                  <span className="text-slate-500 flex items-center gap-1.5"><UserCheck size={12} /> Penanggung Jawab</span>
                  <span className="text-slate-300 text-right">{selectedAsset.technician}</span>
                </div>
              </div>

              <div className="pt-2">
                {selectedAsset.calibrationDueDays <= 30 ? (
                  <div className="p-2.5 rounded-lg bg-rose-500/5 border border-rose-500/20 text-rose-400 text-[11px] flex gap-2 items-start">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                    <p className="font-sans leading-relaxed">
                      <strong>Urgent Audit:</strong> Penyimpangan (*drift*) sensor melewati ambang toleransi. Segera jadwalkan pengangkatan fisik untuk kalibrasi ulang.
                    </p>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 text-[11px] flex gap-2 items-start">
                    <ShieldCheck size={14} className="shrink-0 mt-0.5" />
                    <p className="font-sans">
                      Komponen beroperasi penuh dalam kurva linear aman tanpa indikasi degradasi sinyal.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center text-xs italic">
              <BarChart2 size={36} className="text-slate-800 mb-2 stroke-1" />
              Pilih baris komponen untuk membuka hasil audit database.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}