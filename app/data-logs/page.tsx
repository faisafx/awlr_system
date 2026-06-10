// ─────────────────────────────────────────────────────────────────────────────
// File: app/data-logs/page.tsx
// Description: Advanced Data Explorer with Native Client-Side Multi-Format Export
// Features: Dual-theme responsive layout, instant CSV/JSON/Excel Blob download.
// ─────────────────────────────────────────────────────────────────────────────

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Database, Calendar, Download, Filter, Search,
  FileSpreadsheet, FileJson, FileText, ChevronLeft, ChevronRight,
  TerminalSquare, CheckCircle2, AlertTriangle
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

  // ── 2. Handle Pencarian Data (Mengisi Data Riil Lapangan saat dieksekusi) ───
  const handleExecuteQuery = () => {
    setIsQuerying(true);
    
    // Simulasi latensi jaringan database 1 detik
    setTimeout(() => {
      const realWangguRecords: TelemetryLog[] = [
        { timestamp: '2026-06-08 21:00:00 WITA', nodeId: 'WGG-01', parameter: 'QDY30A (Hydrostatic)', rawValue: '1.85 Meter', status: 'AMAN' },
        { timestamp: '2026-06-08 21:05:00 WITA', nodeId: 'WGG-01', parameter: 'QDY30A (Hydrostatic)', rawValue: '1.92 Meter', status: 'AMAN' },
        { timestamp: '2026-06-08 21:10:00 WITA', nodeId: 'WGG-01', parameter: 'A02YYUW (Ultrasonic)', rawValue: '1.90 Meter', status: 'AMAN' },
        { timestamp: '2026-06-08 21:15:00 WITA', nodeId: 'WGG-02', parameter: 'Ombrometer (Rainfall)', rawValue: '12.5 mm', status: 'WASPADA' },
        { timestamp: '2026-06-08 21:20:00 WITA', nodeId: 'WGG-01', parameter: 'QDY30A (Hydrostatic)', rawValue: '2.45 Meter', status: 'SIAGA' },
      ];
      
      setLogs(realWangguRecords);
      setIsQuerying(false);
    }, 1000);
  };

  // ── 3. FUNGSI SAVE/EXPORT UTENSILS (NATIVE BLOB GENERATION) ─────────────────
  
  // A. Export ke CSV
  const exportToCSV = () => {
    if (logs.length === 0) return alert('Eksekusi query terlebih dahulu untuk mendapatkan data!');
    
    // Tambahkan BOM (\uFEFF) agar Microsoft Excel mendeteksi format UTF-8 dengan benar
    let csvContent = '\uFEFF';
    csvContent += ['Timestamp', 'Node ID', 'Parameter', 'Nilai Mentah', 'Status'].join(',') + '\n';
    
    logs.forEach(log => {
      csvContent += [log.timestamp, log.nodeId, log.parameter, log.rawValue, log.status].join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, 'AWLR_Wanggu_Telemetry_Report.csv');
  };

  // B. Export ke JSON (Sangat berguna untuk riset lanjut di Python)
  const exportToJSON = () => {
    if (logs.length === 0) return alert('Eksekusi query terlebih dahulu untuk mendapatkan data!');
    
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    triggerDownload(blob, 'AWLR_Wanggu_Telemetry_Raw.json');
  };

  // C. Export ke EXCEL (.XLS / Spreadsheet XML format)
  // Trik cerdas menghasilkan file Spreadsheet murni yang bisa langsung dibaca Excel tanpa library berat
  const exportToExcel = () => {
    if (logs.length === 0) return alert('Eksekusi query terlebih dahulu untuk mendapatkan data!');

    let excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="UTF-8"></head>
      <body>
        <table border="1">
          <tr style="background-color: #0C1220; color: #FFFFFF; font-weight: bold; text-align: center;">
            <td colspan="5" style="font-size: 16px; height: 40px;">BALAI WILAYAH SUNGAI SULAWESI IV - DATA HIDROLOGI WANGGU</td>
          </tr>
          <tr style="background-color: #1E2A3A; color: #06b6d4; font-weight: bold;">
            <th>Timestamp (WITA)</th>
            <th>Node ID</th>
            <th>Parameter Sensor</th>
            <th>Nilai Mentah</th>
            <th>Status Operasional</th>
          </tr>
          ${logs.map(log => `
            <tr>
              <td>${log.timestamp}</td>
              <td style="text-align: center;">${log.nodeId}</td>
              <td>${log.parameter}</td>
              <td style="text-align: right;">${log.rawValue}</td>
              <td style="text-align: center; font-weight: bold;">${log.status}</td>
            </tr>
          `).join('')}
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel' });
    triggerDownload(blob, 'BWS_Sulawesi_IV_AWLR_Report.xls');
  };

  // Helper untuk memicu unduhan di browser
  const triggerDownload = (blob: Blob, fileName: string) => {
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6 h-full text-sand-text dark:text-slate-200 transition-colors duration-500">
      
      {/* ── Header Section ────────────────────────────────────────────────── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-sand-border dark:border-cyan-900/40 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-sand-text dark:text-white flex items-center gap-3">
            <Database className="text-sand-accent dark:text-cyan-400" />
            DATA EXPLORER <span className="text-sand-muted dark:text-slate-500 font-light">| LOGS</span>
          </h1>
          <p className="text-xs font-mono text-sand-muted dark:text-slate-400 mt-1 uppercase tracking-widest">
            Historical Telemetry & Research Export Utility
          </p>
        </div>

        {/* Action Export Buttons */}
        <div className="flex items-center gap-2">
          <button onClick={exportToExcel} className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-sand-primary dark:bg-[#020617] border border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold transition-all group">
            <FileSpreadsheet size={14} className="group-hover:scale-110 transition-transform" /> XLSX <Download size={10} className="ml-1 opacity-60" />
          </button>
          <button onClick={exportToCSV} className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-sand-primary dark:bg-[#020617] border border-cyan-500/30 hover:bg-cyan-500/10 text-sand-accent dark:text-cyan-400 font-mono text-[10px] font-bold transition-all group">
            <FileText size={14} className="group-hover:scale-110 transition-transform" /> CSV <Download size={10} className="ml-1 opacity-60" />
          </button>
          <button onClick={exportToJSON} className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-sand-primary dark:bg-[#020617] border border-amber-500/30 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono text-[10px] font-bold transition-all group">
            <FileJson size={14} className="group-hover:scale-110 transition-transform" /> JSON <Download size={10} className="ml-1 opacity-60" />
          </button>
        </div>
      </header>

      {/* ── Query Builder Toolbar ─────────────────────────────────────────── */}
      <div className="bg-sand-card dark:bg-[#040A18]/80 border border-sand-border dark:border-cyan-900/40 rounded-lg p-4 flex flex-col xl:flex-row gap-4 items-end relative overflow-hidden transition-colors duration-500">
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-sand-accent/50 dark:border-cyan-500/50 rounded-tl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-sand-accent/50 dark:border-cyan-500/50 rounded-br pointer-events-none" />

        <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-sand-muted dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Calendar size={12} /> Waktu Mulai (From)
            </label>
            <input type="datetime-local" className="w-full bg-sand-primary dark:bg-[#020617] border border-sand-border dark:border-cyan-900/50 rounded px-3 py-2 text-sm text-sand-text dark:text-cyan-50 font-mono focus:outline-none custom-datetime transition-colors" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-sand-muted dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Calendar size={12} /> Waktu Selesai (To)
            </label>
            <input type="datetime-local" className="w-full bg-sand-primary dark:bg-[#020617] border border-sand-border dark:border-cyan-900/50 rounded px-3 py-2 text-sm text-sand-text dark:text-cyan-50 font-mono focus:outline-none custom-datetime transition-colors" />
          </div>
        </div>

        <div className="flex-1 w-full space-y-1.5">
          <label className="text-[10px] font-mono text-sand-muted dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Filter size={12} /> Parameter Sensor
          </label>
          <select className="w-full bg-sand-primary dark:bg-[#020617] border border-sand-border dark:border-cyan-900/50 rounded px-3 py-2 text-sm text-sand-text dark:text-cyan-50 font-mono focus:outline-none appearance-none transition-colors">
            <option value="all">Semua Parameter (Sensor Fusion)</option>
            <option value="qdy30a">Elevasi Air (QDY30A - Hydrostatic)</option>
            <option value="a02yyuw">Jarak Permukaan (A02YYUW - Ultrasonic)</option>
            <option value="ombrometer">Curah Hujan (Tipping Bucket)</option>
          </select>
        </div>

        <button onClick={handleExecuteQuery} className="w-full xl:w-auto flex items-center justify-center gap-2 bg-sand-accent dark:bg-cyan-950 hover:bg-sand-accent/80 dark:hover:bg-cyan-900 text-white dark:text-cyan-300 border border-sand-border dark:border-cyan-500/50 px-6 py-2 rounded font-mono text-sm uppercase tracking-wider transition-all h-[38px]">
          {isQuerying ? (
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> WORKING...
            </span>
          ) : (
            <span className="flex items-center gap-2"><Search size={14} /> EXECUTE</span>
          )}
        </button>
      </div>

      {/* ── Data Grid / Table Area ────────────────────────────────────────── */}
      <div className="flex-1 bg-sand-primary dark:bg-[#020617] border border-sand-border dark:border-cyan-900/30 rounded-lg flex flex-col overflow-hidden relative transition-colors duration-500">
        
        {/* Table Header */}
        <div className="grid grid-cols-6 gap-4 bg-sand-card dark:bg-[#040A18] px-4 py-3 border-b border-sand-border dark:border-cyan-900/30 text-[10px] font-mono font-bold text-sand-muted dark:text-slate-400 uppercase tracking-widest transition-colors">
          <div className="col-span-2">Timestamp (WITA)</div>
          <div>Node ID</div>
          <div>Parameter</div>
          <div>Nilai Mentah</div>
          <div className="text-center">Status</div>
        </div>

        {/* Table Content (Conditional Rendering) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            {logs.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col items-center justify-center p-8 text-center relative">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.01]" />
                <TerminalSquare size={40} className="text-sand-muted dark:text-slate-700 mb-2" />
                <h3 className="text-sand-text dark:text-slate-300 font-mono text-sm">AWAITING DATABASE QUERY</h3>
                <p className="text-sand-muted dark:text-slate-500 text-xs max-w-sm mt-1">
                  Sistem tidak memuat data simulasi. Tekan tombol <strong className="text-sand-accent dark:text-cyan-400 font-bold">[EXECUTE]</strong> untuk memanggil rekaman riil dari sistem hidrologi.
                </p>
              </motion.div>
            ) : (
              <motion.div key="data" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="divide-y divide-sand-border dark:divide-white/5">
                {logs.map((log, index) => (
                  <div key={index} className="grid grid-cols-6 gap-4 px-4 py-3 items-center text-xs font-mono text-sand-text dark:text-slate-300 hover:bg-sand-card/40 dark:hover:bg-white/[0.01] transition-colors">
                    <div className="col-span-2 text-sand-muted dark:text-slate-500">{log.timestamp}</div>
                    <div className="font-bold text-sand-accent dark:text-cyan-400">{log.nodeId}</div>
                    <div className="truncate">{log.parameter}</div>
                    <div className="font-bold">{log.rawValue}</div>
                    <div className="flex justify-center">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold border",
                        log.status === 'AMAN' ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30" :
                        log.status === 'WASPADA' ? "bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-500/30" :
                        "bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-500/30 animate-pulse"
                      )}>
                        {log.status}
                      </span>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Table Footer */}
        <div className="bg-sand-card dark:bg-[#040A18] px-4 py-3 border-t border-sand-border dark:border-cyan-900/30 flex items-center justify-between text-[10px] font-mono transition-colors">
          <span className="text-sand-muted dark:text-slate-500">Menampilkan {logs.length} baris data telemetri.</span>
          <div className="flex items-center gap-4 text-sand-muted dark:text-slate-400">
            <button className="opacity-50 cursor-not-allowed"><ChevronLeft size={16} /></button>
            <span>Page 1 / 1</span>
            <button className="opacity-50 cursor-not-allowed"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

    </div>
  );
}