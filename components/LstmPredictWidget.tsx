'use client';

import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, Radio } from 'lucide-react';

export default function LstmPredictWidget({ currentDischarge = 45, currentRain = 5 }: { currentDischarge?: number, currentRain?: number }) {
  const [prediction, setPrediction] = useState<number | null>(null);
  const [status, setStatus] = useState<string>('Menghitung...');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchPrediction = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/lstm-predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ discharge: currentDischarge, rainRate: currentRain })
        });
        const data = await res.json();
        if (data.success && isMounted) {
          setPrediction(data.prediction);
          setStatus(data.status);
        }
      } catch (err) {
        console.error('LSTM AI Error:', err);
        if (isMounted) setStatus('Server AI Offline');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    if (currentDischarge >= 0 || currentRain >= 0) fetchPrediction();
    const interval = setInterval(fetchPrediction, 5 * 60 * 1000); 
    return () => { isMounted = false; clearInterval(interval); };
  }, [currentDischarge, currentRain]);

  const colors: Record<string, string> = {
    'Aman': '#10B981', // green-500
    'Siaga': '#F59E0B', // amber-500
    'Bahaya': '#EF4444', // red-500
    'Menghitung...': 'var(--text-disabled)',
    'Server AI Offline': '#EF4444'
  };
  const color = colors[status] || 'var(--text-disabled)';

  return (
    <div className="card w-full mb-5" style={{ background: 'var(--surface-card)', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-subtle)', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
      <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.05) 0%, rgba(236, 72, 153, 0.05) 100%)' }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <h2 className="text-[16px] md:text-[18px] font-bold text-[var(--text-primary)] flex items-center gap-2 m-0" style={{ letterSpacing: '-0.02em' }}>
              <Bot size={20} style={{ color: '#A855F7' }} /> 
              AI Forecast Radar (LSTM)
              <span className="ml-2 px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-bold tracking-wider text-[#A855F7] bg-[#A855F7] bg-opacity-10 border border-[#A855F7] border-opacity-20 uppercase flex items-center gap-1">
                <Sparkles size={10} /> Smart Model
              </span>
            </h2>
            <p className="text-[12px] md:text-[13px] text-[var(--text-muted)] mt-2 mb-0 leading-relaxed max-w-2xl" style={{ fontFamily: 'var(--font-sans)' }}>
              Sistem kecerdasan buatan ini otomatis menganalisis pola hidrologi 14 hari ke belakang untuk memprediksi potensi bahaya besok hari. 
              <strong> Membantu masyarakat awam bersiaga lebih awal!</strong>
            </p>
          </div>
          
          <div className="flex items-center gap-4 p-4 rounded-xl bg-[var(--surface-inset)] border border-[var(--border-subtle)] md:w-auto w-full justify-between md:justify-start shadow-sm" title="Hasil Analisis AI">
            <div>
              <div className="text-[9px] md:text-[10px] uppercase font-bold tracking-wider text-[var(--text-disabled)] mb-1">
                Prediksi Debit H+1
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-[24px] md:text-[28px] font-black font-[family-name:var(--font-jetbrains)] text-[var(--text-primary)] leading-none">
                  {prediction !== null ? prediction.toFixed(1) : '--.-'}
                </span>
                <span className="text-[11px] md:text-[12px] font-bold text-[var(--text-muted)]">m³/s</span>
              </div>
            </div>
            
            <div className="w-[1px] h-10 bg-[var(--border-subtle)] mx-2 hidden sm:block"></div>
            
            <div title="Aman = Debit normal. Siaga = Air berpotensi naik, warga waspada. Bahaya = Potensi banjir tinggi, segera evakuasi.">
              <div className="text-[9px] md:text-[10px] uppercase font-bold tracking-wider text-[var(--text-disabled)] mb-1">
                Status Keselamatan
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex items-center justify-center">
                   {loading && <div className="absolute w-full h-full rounded-full border border-[var(--text-disabled)] border-t-[#A855F7] animate-spin"></div>}
                   <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: color, boxShadow: `0 0 10px ${color}` }}></div>
                </div>
                <span 
                  className="text-[14px] md:text-[16px] font-black tracking-widest uppercase" 
                  style={{ color: color, textShadow: `0 0 15px ${color}40` }}
                >
                  {status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
