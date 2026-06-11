// ─────────────────────────────────────────────────────────────────────────────
// File: app/data-logs/page.tsx
// Description: Advanced Data Explorer with Native Client-Side Multi-Format Export
// Features: Live Supabase Postgres Query, Interactive Date Range, Framer Motion UI
// ─────────────────────────────────────────────────────────────────────────────

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Database, Calendar, Download, Filter, Search,
  FileSpreadsheet, FileJson, FileText, ChevronLeft, ChevronRight,
  TerminalSquare, XCircle, Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── 1. Type Definitions untuk Log Data ───────────────────────────────────────
interface TelemetryLog {
  timestamp: string;
  nodeId: string;
  parameter: string;
  rawValue: string;
  status: 'AMAN' | 'WASPADA' | 'SIAGA' | 'AWAS';
}

export default function DataExplorerPage() {
  const [isQuerying, setIsQuerying] = useState(false);
  const [logs, setLogs] = useState<TelemetryLog[]>([]);
  
  // ── STATE UNTUK FILTER INTERAKTIF ──
  const [selectedParam, setSelectedParam] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // ── Fungsi Reset Filter ──
  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedParam('all');
  };

  // ── 2. Handle Pencarian Data Asli dari Supabase ─────────────────────────────
  const handleExecuteQuery = async () => {
    setIsQuerying(true);
    
    try {
      // Susun URL pintar berdasarkan filter yang diisi user
      let url = `/api/logs?parameter=${selectedParam}`;
      if (startDate) url += `&start=${new Date(startDate).toISOString()}`;
      if (endDate) url += `&end=${new Date(endDate).toISOString()}`;

      const response = await fetch(url);
      const result = await response.json();

      if (result.success && result.data) {
        // Konversi data mentah database ke format UI yang cantik
        const formattedData: TelemetryLog[] = result.data.map((item: any) => {
          // Paksa formatter waktu tingkat tinggi agar detik lenyap!
          const timeString = new Date(item.timestamp).toLocaleString('id-ID', { 
            timeZone: 'Asia/Makassar',
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }).replace(/\./g, ':');

          return {
            timestamp: `${timeString} WITA`,
            nodeId: item.nodeId,
            parameter: item.parameter === 'TMA_ULTRA' ? 'A02YYUW (Ultrasonic)' : 
                       item.parameter === 'CURAH_HUJAN' ? 'Ombrometer (Rainfall)' : 
                       item.parameter === 'TMA_HYDRO' ? 'QDY30A (Hydrostatic)' : item.parameter,
            rawValue: `${item.rawValue} ${item.unit}`,
            status: item.status,
          };
        });
        
        setLogs(formattedData);
      } else {
        console.error("Vercel API Error:", result.error);
        alert(`Gagal mengambil data: ${result.error}`);
      }
    } catch (error) {
      console.error("Gagal menarik data dari server:", error);
      alert("Koneksi ke API Vercel terputus. Pastikan file API sudah ter-deploy.");
    } finally {
      setIsQuerying(false);
    }
  };

  // ── 3. FUNGSI SAVE/EXPORT UTENSILS ──────────────────────────────────────────
  const exportToCSV = () => {
    if (logs.length === 0) return alert('Eksekusi query terlebih dahulu untuk mendapatkan data!');
    let csvContent = '\uFEFF'; 
    csvContent += ['Timestamp', 'Node ID', 'Parameter', 'Nilai Mentah', 'Status'].join(',') + '\n';
    logs.forEach(log => {
      csvContent += [log.timestamp, log.nodeId, log.parameter, log.rawValue, log.status].join(',') + '\n';
    });
    triggerDownload(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }), 'AWLR_Wanggu_Telemetry_Report.csv');
  };

  const exportToJSON = () => {
    if (logs.length === 0) return alert('Eksekusi query terlebih dahulu untuk mendapatkan data!');
    triggerDownload(new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' }), 'AWLR_Wanggu_Telemetry_Raw.json');
  };

  const exportToExcel = () => {
    if (logs.length === 0) return alert('Eksekusi query terlebih dahulu untuk mendapatkan data!');
    let excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="UTF-8"></head>
      <body>
        <table border="1">
          <tr style="background-color: #0C1220; color: #FFFFFF; font-weight: bold; text-align: center;"><td colspan="5" style="font-size: 16px; height: 40px;">BALAI WILAYAH SUNGAI SULAWESI IV - DATA HIDROLOGI WANGGU</td></tr>
          <tr style="background-color: #1E2A3A; color: #06b6d4; font-weight: bold;"><th>Timestamp (WITA)</th><th>Node ID</th><th>Parameter Sensor</th><th>Nilai Mentah</th><th>Status Operasional</th></tr>
          ${logs.map(log => `<tr><td>${log.timestamp}</td><td style="text-align: center;">${log.nodeId}</td><td>${log.parameter}</td><td style="text-align: right;">${log.rawValue}</td><td style="text-align: center; font-weight: bold;">${log.status}</td></tr>`).join('')}
        </table>
      </body></html>
    `;
    triggerDownload(new Blob([excelTemplate], { type: 'application/vnd.ms-excel' }), 'BWS_Sulawesi_IV_AWLR_Report.xls');
  };

  const triggerDownload = (blob: Blob, fileName: string) => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
  };

  // Cek apakah ada filter aktif
  const isFilterActive = startDate !== '' || endDate !== '' || selectedParam !== 'all';

  return (
    <div className="flex flex-col gap-6 h-full text-sand-text dark:text-slate-200 transition-colors duration-500">
      
      {/* ── Header Section ── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-sand-border dark:border-cyan-900/40 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-sand-text dark:text-white flex items-center gap-3">
            <Database className="text-sand-accent dark:text-cyan-400" />
            DATA EXPLORER <span className="text-sand-muted dark:text-slate-500 font-light">| LOGS</span>
          </h1>
          <p className="text-xs font-mono text-sand-muted dark:text-slate-400 mt-1 uppercase tracking-widest">
            Supabase Cloud Telemetry & Research Export Utility
          </p>
        </div>

        {/* Action Export Buttons */}
        <div className="flex items-center gap-2">
          <button onClick={exportToExcel} className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-sand-primary dark:bg-[#020617] border border-emerald-500/30 hover:bg-emerald-500/10 hover:shadow-[0_0_10px_rgba(16,185,129,0.2)] text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold transition-all group">
            <FileSpreadsheet size={14} className="group-hover:scale-110 transition-transform" /> XLSX <Download size={10} className="ml-1 opacity-60" />
          </button>
          <button onClick={exportToCSV} className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-sand-primary dark:bg-[#020617] border border-cyan-500/30 hover:bg-cyan-500/10 hover:shadow-[0_0_10px_rgba(6,182,212,0.2)] text-sand-accent dark:text-cyan-400 font-mono text-[10px] font-bold transition-all group">
            <FileText size={14} className="group-hover:scale-110 transition-transform" /> CSV <Download size={10} className="ml-1 opacity-60" />
          </button>
          <button onClick={exportToJSON} className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-sand-primary dark:bg-[#020617] border border-amber-500/30 hover:bg-amber-500/10 hover:shadow-[0_0_10px_rgba(245,158,11,0.2)] text-amber-600 dark:text-amber-400 font-mono text-[10px] font-bold transition-all group">
            <FileJson size={14} className="group-hover:scale-110 transition-transform" /> JSON <Download size={10} className="ml-1 opacity-60" />
          </button>
        </div>
      </header>

      {/* ── Query Builder Toolbar (Interaktif) ── */}
      <div className="bg-sand-card dark:bg-[#040A18]/80 border border-sand-border dark:border-cyan-900/40 rounded-xl p-5 flex flex-col xl:flex-row gap-5 items-end relative overflow-hidden transition-colors duration-500 shadow-lg shadow-cyan-900/5">
        
        {/* Glow Effects Corners */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-sand-accent dark:border-cyan-400 rounded-tl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-sand-accent dark:border-cyan-400 rounded-br pointer-events-none" />

        <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Start Date */}
          <div className="space-y-2 group">
            <label className="text-[10px] font-bold font-mono text-sand-muted dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5 group-focus-within:text-cyan-400 transition-colors">
              <Calendar size={14} /> Waktu Mulai (From)
            </label>
            <input 
              type="datetime-local" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-sand-primary dark:bg-[#020617] border border-sand-border dark:border-cyan-900/60 rounded-lg px-4 py-2.5 text-sm text-sand-text dark:text-cyan-50 font-mono focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/50 transition-all shadow-inner" 
            />
          </div>
          
          {/* End Date */}
          <div className="space-y-2 group">
            <label className="text-[10px] font-bold font-mono text-sand-muted dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5 group-focus-within:text-cyan-400 transition-colors">
              <Calendar size={14} /> Waktu Selesai (To)
            </label>
            <input 
              type="datetime-local" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-sand-primary dark:bg-[#020617] border border-sand-border dark:border-cyan-900/60 rounded-lg px-4 py-2.5 text-sm text-sand-text dark:text-cyan-50 font-mono focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/50 transition-all shadow-inner" 
            />
          </div>
        </div>

        <div className="flex-1 w-full space-y-2 group">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-bold font-mono text-sand-muted dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5 group-focus-within:text-cyan-400 transition-colors">
              <Filter size={14} /> Parameter Sensor
            </label>
            
            {/* Tombol Clear Filter dengan Animasi */}
            <AnimatePresence>
              {isFilterActive && (
                <motion.button 
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                  onClick={handleResetFilters}
                  className="text-[10px] font-mono text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 px-2 py-0.5 rounded transition-colors flex items-center gap-1"
                >
                  <XCircle size={12} /> RESET FILTER
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          <select 
            value={selectedParam}
            onChange={(e) => setSelectedParam(e.target.value)}
            className="w-full bg-sand-primary dark:bg-[#020617] border border-sand-border dark:border-cyan-900/60 rounded-lg px-4 py-2.5 text-sm text-sand-text dark:text-cyan-50 font-mono focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/50 appearance-none transition-all shadow-inner cursor-pointer"
          >
            <option value="all">Semua Parameter (Sensor Fusion)</option>
            <option value="qdy30a">Elevasi Air (QDY30A - Hydrostatic)</option>
            <option value="a02yyuw">Jarak Permukaan (A02YYUW - Ultrasonic)</option>
            <option value="ombrometer">Curah Hujan (Tipping Bucket)</option>
          </select>
        </div>

        {/* Tombol Execute Dinamis */}
        <button 
          onClick={handleExecuteQuery} 
          disabled={isQuerying}
          className={cn(
            "w-full xl:w-auto flex items-center justify-center gap-2 px-8 py-2.5 rounded-lg font-mono text-sm uppercase tracking-widest transition-all shadow-lg h-[42px]",
            isQuerying 
              ? "bg-cyan-900 text-cyan-500 border border-cyan-900 cursor-not-allowed" 
              : "bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-400/50 shadow-cyan-900/20 active:scale-95"
          )}
        >
          {isQuerying ? (
            <>
              <Activity size={16} className="animate-pulse" /> MENCARI...
            </>
          ) : (
            <>
              <Search size={16} /> EXECUTE
            </>
          )}
        </button>
      </div>

      {/* ── Data Grid / Table Area ────────────────────────────────────────── */}
      <div className="flex-1 bg-sand-primary dark:bg-[#020617] border border-sand-border dark:border-cyan-900/30 rounded-xl flex flex-col overflow-hidden relative transition-colors duration-500 shadow-md">
        
        {/* Table Header */}
        <div className="grid grid-cols-6 gap-4 bg-sand-card dark:bg-[#040A18] px-5 py-4 border-b border-sand-border dark:border-cyan-900/40 text-[10px] font-mono font-bold text-sand-muted dark:text-cyan-500/70 uppercase tracking-widest transition-colors">
          <div className="col-span-2">Timestamp (WITA)</div>
          <div>Node ID</div>
          <div>Parameter</div>
          <div>Nilai Mentah</div>
          <div className="text-center">Status</div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            {logs.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col items-center justify-center p-8 text-center relative">
                <TerminalSquare size={48} className="text-sand-muted dark:text-cyan-900/50 mb-4" />
                <h3 className="text-sand-text dark:text-cyan-400 font-mono text-sm tracking-widest font-bold">AWAITING DATABASE QUERY</h3>
                <p className="text-sand-muted dark:text-slate-500 text-xs max-w-md mt-2 leading-relaxed">
                  Filter rentang waktu dan parameter telah siap. Tekan tombol <strong className="text-sand-accent dark:text-cyan-400">[EXECUTE]</strong> untuk memanggil rekaman riil dari pangkalan data Supabase.
                </p>
              </motion.div>
            ) : (
              <motion.div key="data" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="divide-y divide-sand-border dark:divide-white/5">
                {logs.map((log, index) => (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.01 }}
                    key={index} 
                    className="grid grid-cols-6 gap-4 px-5 py-3.5 items-center text-[11px] font-mono text-sand-text dark:text-slate-300 hover:bg-sand-card/40 dark:hover:bg-cyan-900/10 transition-colors group"
                  >
                    <div className="col-span-2 text-sand-muted dark:text-slate-400 group-hover:text-cyan-300 transition-colors">{log.timestamp}</div>
                    <div className="font-bold text-sand-accent dark:text-cyan-500">{log.nodeId}</div>
                    <div className="truncate">{log.parameter}</div>
                    <div className="font-bold">{log.rawValue}</div>
                    <div className="flex justify-center">
                      <span className={cn(
                        "px-2.5 py-1 rounded shadow-sm text-[9px] font-bold border tracking-wider",
                        log.status === 'AMAN' ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30" :
                        log.status === 'WASPADA' ? "bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-500/30" :
                        log.status === 'SIAGA' ? "bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-500/30" :
                        "bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-500/30 animate-pulse"
                      )}>
                        {log.status}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Table Footer */}
        <div className="bg-sand-card dark:bg-[#040A18] px-5 py-3 border-t border-sand-border dark:border-cyan-900/40 flex items-center justify-between text-[10px] font-mono transition-colors">
          <span className="text-sand-muted dark:text-slate-500">
            Menampilkan <strong className="text-cyan-500">{logs.length}</strong> baris data telemetri.
          </span>
          <div className="flex items-center gap-4 text-sand-muted dark:text-slate-400">
            <button className="opacity-50 cursor-not-allowed hover:text-cyan-400 transition-colors"><ChevronLeft size={16} /></button>
            <span className="tracking-widest">REAL-TIME SYNC</span>
            <button className="opacity-50 cursor-not-allowed hover:text-cyan-400 transition-colors"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

    </div>
  );
}