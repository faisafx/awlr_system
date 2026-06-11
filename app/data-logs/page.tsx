// ─────────────────────────────────────────────────────────────────────────────
// File: app/data-logs/page.tsx
// Description: Advanced Data Explorer - Google Material Design 3 Standard
// Features: Strict Postgres Query, Outlined Text Fields, Native Blob Export
// ─────────────────────────────────────────────────────────────────────────────

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Database, Calendar, Download, Filter, Search,
  FileSpreadsheet, FileJson, FileText, ChevronLeft, ChevronRight,
  TerminalSquare, XCircle, CloudCog, AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TelemetryLog {
  timestamp: string;
  nodeId: string;
  parameter: string;
  rawValue: string;
  status: 'AMAN' | 'WASPADA' | 'SIAGA' | 'AWAS';
}

export default function DataExplorerPage() {
  const [isQuerying, setIsQuerying] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [logs, setLogs] = useState<TelemetryLog[]>([]);
  
  const [selectedParam, setSelectedParam] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedParam('all');
    setHasSearched(false);
    setLogs([]);
  };

  const handleExecuteQuery = async () => {
    // Validasi Standar Google: Cegah input tanggal setengah-setengah
    if ((startDate && !endDate) || (!startDate && endDate)) {
      alert("Validation Error: Harap isi kedua kolom Waktu (Mulai & Selesai) untuk pencarian spesifik.");
      return;
    }

    setIsQuerying(true);
    setHasSearched(true);
    setLogs([]); // KUNCI MUTLAK: Kosongkan tabel lama agar tidak terjadi ilusi optik!
    
    try {
      let url = `/api/logs?parameter=${selectedParam}`;
      if (startDate) url += `&start=${new Date(startDate).toISOString()}`;
      if (endDate) url += `&end=${new Date(endDate).toISOString()}`;

      const response = await fetch(url);
      const result = await response.json();

      if (result.success && result.data && result.data.length > 0) {
        const formattedData: TelemetryLog[] = result.data.map((item: any) => {
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
        // Biarkan array kosong jika memang tidak ada data di rentang tersebut
        setLogs([]);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      alert("Koneksi ke server Vercel terputus.");
    } finally {
      setIsQuerying(false);
    }
  };

  // ── EKSPOR DATA ──
  const triggerDownload = (blob: Blob, fileName: string) => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
  };

  const exportToCSV = () => {
    if (logs.length === 0) return alert('Tidak ada data untuk diekspor.');
    let csvContent = '\uFEFF' + ['Timestamp', 'Node ID', 'Parameter', 'Nilai Mentah', 'Status'].join(',') + '\n';
    logs.forEach(log => { csvContent += [log.timestamp, log.nodeId, log.parameter, log.rawValue, log.status].join(',') + '\n'; });
    triggerDownload(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }), 'Telemetry.csv');
  };

  const exportToJSON = () => {
    if (logs.length === 0) return alert('Tidak ada data untuk diekspor.');
    triggerDownload(new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' }), 'Telemetry.json');
  };

  const exportToExcel = () => {
    if (logs.length === 0) return alert('Tidak ada data untuk diekspor.');
    let excelTemplate = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"></head><body><table border="1"><tr style="background-color: #0C1220; color: #FFFFFF; text-align: center;"><td colspan="5">DATA HIDROLOGI WANGGU</td></tr><tr style="background-color: #1E2A3A; color: #3b82f6;"><th>Timestamp</th><th>Node ID</th><th>Parameter</th><th>Nilai</th><th>Status</th></tr>${logs.map(log => `<tr><td>${log.timestamp}</td><td>${log.nodeId}</td><td>${log.parameter}</td><td>${log.rawValue}</td><td>${log.status}</td></tr>`).join('')}</table></body></html>`;
    triggerDownload(new Blob([excelTemplate], { type: 'application/vnd.ms-excel' }), 'Telemetry.xls');
  };

  const isFilterActive = startDate !== '' || endDate !== '' || selectedParam !== 'all';

  return (
    <div className="flex flex-col gap-6 h-full text-slate-200 font-sans transition-colors duration-500">
      
      {/* ── Header ── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3 tracking-tight">
            <CloudCog className="text-blue-500" size={28} />
            Data Explorer <span className="text-slate-500 font-normal">| Logs</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-mono">
            Google Cloud Standard Telemetry Utility
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={exportToExcel} className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-slate-900 border border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-500/10 text-emerald-400 font-mono text-[10px] font-bold transition-all">
            <FileSpreadsheet size={14} /> EXCEL
          </button>
          <button onClick={exportToCSV} className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-slate-900 border border-slate-700 hover:border-blue-500/50 hover:bg-blue-500/10 text-blue-400 font-mono text-[10px] font-bold transition-all">
            <FileText size={14} /> CSV
          </button>
          <button onClick={exportToJSON} className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-slate-900 border border-slate-700 hover:border-amber-500/50 hover:bg-amber-500/10 text-amber-400 font-mono text-[10px] font-bold transition-all">
            <FileJson size={14} /> JSON
          </button>
        </div>
      </header>

      {/* ── Material 3 Outlined Query Builder ── */}
      <div className="bg-[#0b1120] border border-slate-800 rounded-2xl p-6 flex flex-col xl:flex-row gap-6 items-center shadow-lg">
        
        <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Outlined Date Field: Start */}
          <div className="relative w-full">
            <label className="absolute -top-2 left-3 inline-block bg-[#0b1120] px-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-500 z-10">
              Waktu Mulai
            </label>
            <input 
              type="datetime-local" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="block w-full rounded-md border border-slate-700 bg-transparent px-4 py-3 text-sm text-slate-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all custom-datetime hover:border-slate-500" 
            />
          </div>
          
          {/* Outlined Date Field: End */}
          <div className="relative w-full">
            <label className="absolute -top-2 left-3 inline-block bg-[#0b1120] px-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-500 z-10">
              Waktu Selesai
            </label>
            <input 
              type="datetime-local" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="block w-full rounded-md border border-slate-700 bg-transparent px-4 py-3 text-sm text-slate-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all custom-datetime hover:border-slate-500" 
            />
          </div>
        </div>

        {/* Outlined Select Field: Parameter */}
        <div className="flex-1 w-full relative">
          <label className="absolute -top-2 left-3 inline-block bg-[#0b1120] px-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-500 z-10 flex items-center gap-2">
            Parameter Sensor
            {isFilterActive && (
              <button onClick={handleResetFilters} className="text-rose-400 hover:text-rose-300 ml-2 font-mono flex items-center gap-0.5">
                <XCircle size={10} /> Reset
              </button>
            )}
          </label>
          <select 
            value={selectedParam}
            onChange={(e) => setSelectedParam(e.target.value)}
            className="block w-full rounded-md border border-slate-700 bg-transparent px-4 py-3 text-sm text-slate-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none transition-all cursor-pointer hover:border-slate-500"
          >
            <option value="all" className="bg-slate-900">Semua Parameter (Sensor Fusion)</option>
            <option value="qdy30a" className="bg-slate-900">Elevasi Air (QDY30A - Hydrostatic)</option>
            <option value="a02yyuw" className="bg-slate-900">Jarak Permukaan (A02YYUW - Ultrasonic)</option>
            <option value="ombrometer" className="bg-slate-900">Curah Hujan (Tipping Bucket)</option>
          </select>
        </div>

        {/* Material Pill Button */}
        <button 
          onClick={handleExecuteQuery} 
          disabled={isQuerying}
          className={cn(
            "w-full xl:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-full font-bold text-sm tracking-widest transition-all shadow-md active:scale-95",
            isQuerying 
              ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700" 
              : "bg-blue-600 hover:bg-blue-500 text-white border border-blue-500 hover:shadow-[0_0_15px_rgba(37,99,235,0.4)]"
          )}
        >
          {isQuerying ? (
            <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> MENCARI...</>
          ) : (
            <><Search size={16} /> EXECUTE</>
          )}
        </button>
      </div>

      {/* ── Data Grid ── */}
      <div className="flex-1 bg-[#0b1120] border border-slate-800 rounded-2xl flex flex-col overflow-hidden relative shadow-lg">
        
        <div className="grid grid-cols-6 gap-4 bg-slate-900/50 px-6 py-4 border-b border-slate-800 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
          <div className="col-span-2">Timestamp (WITA)</div>
          <div>Node ID</div>
          <div>Parameter</div>
          <div>Nilai Mentah</div>
          <div className="text-center">Status</div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            {!hasSearched && logs.length === 0 ? (
              <motion.div key="initial" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col items-center justify-center p-8 text-center">
                <Database size={48} className="text-slate-700 mb-4" />
                <h3 className="text-slate-300 font-mono text-sm tracking-widest font-bold">AWAITING DATABASE QUERY</h3>
                <p className="text-slate-500 text-xs max-w-md mt-2 leading-relaxed">
                  Pilih rentang waktu pada panel di atas, lalu tekan <strong className="text-blue-500">[EXECUTE]</strong> untuk memanggil data historis.
                </p>
              </motion.div>
            ) : hasSearched && logs.length === 0 ? (
              <motion.div key="nodata" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col items-center justify-center p-8 text-center">
                <AlertCircle size={48} className="text-rose-500/50 mb-4" />
                <h3 className="text-rose-400 font-mono text-sm tracking-widest font-bold">TIDAK ADA DATA</h3>
                <p className="text-slate-500 text-xs max-w-md mt-2 leading-relaxed">
                  Pangkalan data tidak memiliki rekaman telemetri pada rentang waktu yang Anda minta. Silakan atur ulang filter.
                </p>
              </motion.div>
            ) : (
              <motion.div key="data" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="divide-y divide-slate-800/50">
                {logs.map((log, index) => (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.005 }}
                    key={index} 
                    className="grid grid-cols-6 gap-4 px-6 py-4 items-center text-[12px] font-mono text-slate-300 hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="col-span-2 text-slate-400">{log.timestamp}</div>
                    <div className="font-bold text-blue-500">{log.nodeId}</div>
                    <div className="truncate">{log.parameter}</div>
                    <div className="font-bold">{log.rawValue}</div>
                    <div className="flex justify-center">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[9px] font-bold tracking-wider",
                        log.status === 'AMAN' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                        log.status === 'WASPADA' ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                        log.status === 'SIAGA' ? "bg-orange-500/10 text-orange-400 border border-orange-500/20" :
                        "bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse"
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

        <div className="bg-slate-900/50 px-6 py-3 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-500">
          <span>Menampilkan <strong className="text-blue-500">{logs.length}</strong> baris data.</span>
          <div className="flex items-center gap-4">
            <button className="hover:text-blue-400 transition-colors"><ChevronLeft size={16} /></button>
            <span className="tracking-widest">PG. 1</span>
            <button className="hover:text-blue-400 transition-colors"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

    </div>
  );
}