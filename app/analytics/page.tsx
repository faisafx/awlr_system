'use client';

import { useEffect, useState } from 'react';
import { BrainCircuit, Database, Hourglass, TrendingUp, AlertCircle, ShieldCheck } from 'lucide-react';
import PredictionChart from '@/components/charts/PredictionChart';
import { cn } from '@/lib/utils';

interface PredictionData {
  metrics: { mae: number; rmse: number; executionTimeMs: number };
  historical: { timestamp: number; value: number }[];
  forecast: { timestamp: number; value: number; upperConfidence: number; lowerConfidence: number }[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPredictions() {
      try {
        const res = await fetch('/api/predictions');
        const json = await res.json();
        if (json.status === 'success') setData(json);
      } catch (err) {
        console.error('Gagal memuat data prediksi:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPredictions();
  }, []);

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 rounded-full border-4 border-t-purple-500 border-slate-800 animate-spin" />
        <p className="text-xs font-mono text-slate-500">Mengeksekusi Iterasi Matrix Jaringan Syaraf LSTM...</p>
      </div>
    );
  }

  // Cari nilai prediksi tertinggi untuk konfirmasi EWS
  const peakForecast = data ? Math.max(...data.forecast.map(o => o.value)) : 0;

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="border-b border-white/5 pb-5">
        <div className="flex items-center gap-2 text-xs font-mono text-purple-400 uppercase tracking-widest">
          <BrainCircuit size={14} />
          Predictive Analytics Engine Active
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100 mt-1">
          Prediksi Hidrograf LSTM <span className="text-slate-500 font-light">| Sungai Wanggu</span>
        </h1>
      </div>

      {/* Grid Status / Akurasi Model AI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/30 border border-white/5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
            <Database size={18} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Akurasi Model (MAE)</span>
            <span className="text-xl font-bold font-mono text-slate-200">{data?.metrics.mae}m</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/30 border border-white/5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
            <Hourglass size={18} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Waktu Inferensi</span>
            <span className="text-xl font-bold font-mono text-slate-200">{data?.metrics.executionTimeMs} ms</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/30 border border-white/5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400">
            <TrendingUp size={18} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Puncak Prediksi (6 Jam)</span>
            <span className="text-xl font-bold font-mono text-slate-200">{peakForecast.toFixed(2)}m</span>
          </div>
        </div>
      </div>

      {/* Area Grafik Utama */}
      <div className="w-full h-[400px] p-4 rounded-xl bg-slate-900/20 border border-white/5 backdrop-blur-md">
        {data && <PredictionChart historical={data.historical} forecast={data.forecast} />}
      </div>

      {/* Doktrin Pengambilan Keputusan Taktis Berdasarkan Hasil AI */}
      <div className={cn(
        "p-4 rounded-xl border flex gap-3 items-start",
        peakForecast >= 2.8 
          ? "bg-rose-500/10 border-rose-500/20 text-rose-300" 
          : "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
      )}>
        {peakForecast >= 2.8 ? <AlertCircle className="shrink-0 mt-0.5" size={16} /> : <ShieldCheck className="shrink-0 mt-0.5" size={16} />}
        <div className="text-xs space-y-1">
          <span className="font-bold uppercase tracking-wider block">
            {peakForecast >= 2.8 ? 'Rekomendasi Tindakan Kedaruratan (AI Warning)' : 'Sistem Konfirmasi Kondisi Aman'}
          </span>
          <p className="text-slate-400 font-sans leading-relaxed">
            {peakForecast >= 2.8 
              ? 'Model Deep Learning mendeteksi adanya akumulasi debit air yang berpotensi melampaui Siaga II dalam 4 jam ke depan. Disarankan untuk mengoordinasikan pembukaan pintu pengendali di Kolam Retensi Boulevard guna mereduksi tekanan hidrolis di Jembatan Wanggu.'
              : 'Hasil komputasi interatif jaringan LSTM menunjukkan fluktuasi air dalam batas ambang batas aman (Siaga IV). Tidak diperlukan rekayasa hidrolik pintu air untuk 6 jam ke depan.'}
          </p>
        </div>
      </div>
    </div>
  );
}