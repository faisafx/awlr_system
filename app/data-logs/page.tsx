// ─────────────────────────────────────────────────────────────────────────────
// File: app/data-logs/page.tsx
// Description: Advanced Data Explorer - Enterprise Cloud Standard
// Features: Strict Postgres Query, Outlined Text Fields, Native Blob Export
// ─────────────────────────────────────────────────────────────────────────────

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Database, Download, Search, FileSpreadsheet, FileJson, FileText, 
  ChevronLeft, ChevronRight, XCircle, AlertCircle, DatabaseZap
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
    setLogs([]); // KOSONGKAN TABEL LAMA SEBELUM FETCH
    
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
    let excelTemplate = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"></head><body><table border="1"><tr style="background-color: #f0f4f8; color: #0d1b2a; text-align: center; font-weight: bold;"><td colspan="5">DATA HISTORIS HIDROLOGI WANGGU</td></tr><tr style="background-color: #2563eb; color: #ffffff;"><th>Timestamp</th><th>Node ID</th><th>Parameter</th><th>Nilai</th><th>Status</th></tr>${logs.map(log => `<tr><td>${log.timestamp}</td><td>${log.nodeId}</td><td>${log.parameter}</td><td>${log.rawValue}</td><td>${log.status}</td></tr>`).join('')}</table></body></html>`;
    triggerDownload(new Blob([excelTemplate], { type: 'application/vnd.ms-excel' }), 'Telemetry.xls');
  };

  const isFilterActive = startDate !== '' || endDate !== '' || selectedParam !== 'all';

  return (
    <div className="flex flex-col gap-6 h-full font-[family-name:var(--font-inter)]">
      
      {/* ── Header ── */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-[var(--border-subtle)] pb-4 shrink-0">
        <div>
          <h1 className="text-[20px] font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-2">
            <DatabaseZap className="text-[var(--brand-600)]" size={24} />
            Data Explorer <span className="text-[var(--text-disabled)] font-normal ml-1">| Logs</span>
          </h1>
          <p className="text-[12px] text-[var(--text-muted)] mt-1 font-medium uppercase tracking-widest">
            Google Cloud Standard Telemetry Utility
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button onClick={exportToExcel} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--surface-card)] border border-[var(--border-subtle)] hover:border-[#10B981] hover:bg-[#10B981]/10 text-[#10B981] font-[family-name:var(--font-jetbrains)] text-[11px] font-bold transition-all shadow-sm">
            <FileSpreadsheet size={14} /> EXCEL
          </button>
          <button onClick={exportToCSV} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--surface-card)] border border-[var(--border-subtle)] hover:border-[var(--brand-500)] hover:bg-[var(--brand-50)] text-[var(--brand-600)] font-[family-name:var(--font-jetbrains)] text-[11px] font-bold transition-all shadow-sm">
            <FileText size={14} /> CSV
          </button>
          <button onClick={exportToJSON} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--surface-card)] border border-[var(--border-subtle)] hover:border-[#F59E0B] hover:bg-[#F59E0B]/10 text-[#D97706] font-[family-name:var(--font-jetbrains)] text-[11px] font-bold transition-all shadow-sm">
            <FileJson size={14} /> JSON
          </button>
        </div>
      </header>

      {/* ── Material 3 Outlined Query Builder ── */}
      <div className="card p-6 flex flex-col xl:flex-row gap-6 items-start xl:items-center shrink-0">
        
        <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Outlined Date Field: Start */}
          <div className="relative w-full">
            <label className="absolute -top-2 left-3 inline-block bg-[var(--surface-card)] px-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] z-10">
              Waktu Mulai
            </label>
            <input 
              type="datetime-local" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="block w-full rounded-lg border border-[var(--border-default)] bg-transparent px-4 py-3.5 text-[13px] font-[family-name:var(--font-jetbrains)] text-[var(--text-primary)] focus:border-[var(--brand-500)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-500)] transition-all custom-datetime hover:border-[var(--border-strong)]" 
            />
          </div>
          
          {/* Outlined Date Field: End */}
          <div className="relative w-full">
            <label className="absolute -top-2 left-3 inline-block bg-[var(--surface-card)] px-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] z-10">
              Waktu Selesai
            </label>
            <input 
              type="datetime-local" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="block w-full rounded-lg border border-[var(--border-default)] bg-transparent px-4 py-3.5 text-[13px] font-[family-name:var(--font-jetbrains)] text-[var(--text-primary)] focus:border-[var(--brand-500)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-500)] transition-all custom-datetime hover:border-[var(--border-strong)]" 
            />
          </div>
        </div>

        {/* Outlined Select Field: Parameter */}
        <div className="flex-1 w-full relative">
          <label className="absolute -top-2 left-3 inline-block bg-[var(--surface-card)] px-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] z-10 flex items-center gap-2">
            Parameter Sensor
            {isFilterActive && (
              <button onClick={handleResetFilters} className="text-[var(--ews-awas)] hover:text-red-700 ml-1 font-[family-name:var(--font-jetbrains)] flex items-center gap-0.5">
                <XCircle size={10} /> Reset
              </button>
            )}
          </label>
          <select 
            value={selectedParam}
            onChange={(e) => setSelectedParam(e.target.value)}
            className="block w-full rounded-lg border border-[var(--border-default)] bg-transparent px-4 py-3.5 text-[13px] text-[var(--text-primary)] focus:border-[var(--brand-500)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-500)] transition-all cursor-pointer hover:border-[var(--border-strong)]"
          >
            <option value="all">Semua Parameter (Sensor Fusion)</option>
            <option value="qdy30a">Elevasi Air (QDY30A - Hydrostatic)</option>
            <option value="a02yyuw">Jarak Permukaan (A02YYUW - Ultrasonic)</option>
            <option value="ombrometer">Curah Hujan (Tipping Bucket)</option>
          </select>
        </div>

        {/* Material Filled Button - Height aligned with inputs */}
        <button 
          onClick={handleExecuteQuery} 
          disabled={isQuerying}
          className={cn(
            "w-full xl:w-auto flex items-center justify-center gap-2 px-8 h-[48px] rounded-xl font-bold text-[12px] tracking-wide transition-all", // Changed py to h-[48px] for strict alignment
            isQuerying 
              ? "bg-[var(--surface-inset)] text-[var(--text-disabled)] cursor-not-allowed border border-[var(--border-subtle)]" 
              : "bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white shadow-md active:scale-95 focus:ring-2 focus:ring-offset-2 focus:ring-[var(--brand-500)] focus:outline-none"
          )}
        >
          {isQuerying ? (
            <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> MENCARI...</>
          ) : (
            <><Search size={16} /> EXECUTE QUERY</>
          )}
        </button>
      </div>

      {/* ── Data Grid (Table) ── */}
      <div className="card flex-1 flex flex-col overflow-hidden min-h-[400px]">
        
        {/* Table Header */}
        <div className="grid grid-cols-6 gap-4 bg-[var(--surface-inset)] px-6 py-3.5 border-b border-[var(--border-subtle)] text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest shrink-0">
          <div className="col-span-2">Timestamp (WITA)</div>
          <div>Node ID</div>
          <div>Parameter</div>
          <div>Nilai Mentah</div>
          <div className="text-center">Status</div>
        </div>

        {/* Table Body Area */}
        <div className="flex-1 relative overflow-hidden">
          
          <AnimatePresence mode="wait">
            
            {/* Empty State: Initial */}
            {!hasSearched && logs.length === 0 && (
              <motion.div 
                key="initial" 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-[var(--surface-card)] z-10"
              >
                <div className="w-16 h-16 rounded-2xl bg-[var(--brand-50)] text-[var(--brand-500)] flex items-center justify-center mb-4">
                  <Database size={32} />
                </div>
                <h3 className="text-[var(--text-primary)] text-[14px] tracking-wide font-bold">Awaiting Database Query</h3>
                <p className="text-[var(--text-muted)] text-[12px] max-w-md mt-2 leading-relaxed">
                  Pilih rentang waktu pada panel di atas, lalu tekan <strong className="text-[var(--brand-600)]">Execute Query</strong> untuk memanggil data historis telemetri.
                </p>
              </motion.div>
            )}
            
            {/* Empty State: No Data Found */}
            {hasSearched && logs.length === 0 && !isQuerying && (
              <motion.div 
                key="nodata" 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0 }} 
                className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-[var(--surface-card)] z-10"
              >
                <div className="w-16 h-16 rounded-2xl bg-[var(--ews-awas-bg)] text-[var(--ews-awas)] flex items-center justify-center mb-4">
                  <AlertCircle size={32} />
                </div>
                <h3 className="text-[var(--text-primary)] text-[14px] tracking-wide font-bold">Tidak Ada Data Ditemukan</h3>
                <p className="text-[var(--text-muted)] text-[12px] max-w-md mt-2 leading-relaxed">
                  Pangkalan data tidak memiliki rekaman telemetri pada rentang waktu yang Anda minta. Silakan atur ulang parameter filter.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actual Scrollable Data Container */}
          <div className="h-full overflow-x-auto overflow-y-auto custom-scrollbar">
            <div className="min-w-[800px]">
              {logs.length > 0 && (
                <div className="flex flex-col">
                  {logs.map((log, index) => (
                    <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      transition={{ delay: Math.min(index * 0.02, 0.5) }}
                      key={index} 
                      className="grid grid-cols-6 gap-4 px-6 py-3.5 items-center text-[12px] font-[family-name:var(--font-jetbrains)] text-[var(--text-secondary)] border-b border-[var(--border-subtle)] hover:bg-[var(--surface-inset)] transition-colors"
                    >
                      <div className="col-span-2 text-[var(--text-muted)]">{log.timestamp}</div>
                      <div className="font-bold text-[var(--text-primary)]">{log.nodeId}</div>
                      <div className="truncate text-[11px] font-[family-name:var(--font-inter)]">{log.parameter}</div>
                      <div className="font-bold text-[var(--text-primary)]">{log.rawValue}</div>
                      <div className="flex justify-center">
                        <span className={cn(
                          "px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider font-[family-name:var(--font-inter)] border",
                          log.status === 'AMAN' ? "bg-[var(--ews-aman-bg)] text-[var(--ews-aman)] border-[#BBF7D0]" :
                          log.status === 'WASPADA' ? "bg-[var(--ews-waspada-bg)] text-[var(--ews-waspada)] border-[#FDE68A]" :
                          log.status === 'SIAGA' ? "bg-[var(--ews-siaga-bg)] text-[var(--ews-siaga)] border-[#FDBA74]" :
                          "bg-[var(--ews-awas-bg)] text-[var(--ews-awas)] border-[#FECACA] animate-pulse"
                        )}>
                          {log.status}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table Footer / Pagination */}
        <div className="bg-[var(--surface-inset)] px-6 py-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] font-[family-name:var(--font-jetbrains)] text-[var(--text-muted)] shrink-0 z-20">
          <span>Menampilkan <strong className="text-[var(--text-primary)]">{logs.length}</strong> baris data.</span>
          <div className="flex items-center gap-4">
            <button className="hover:text-[var(--brand-600)] transition-colors disabled:opacity-50"><ChevronLeft size={16} /></button>
            <span className="tracking-widest font-bold">PG. 1</span>
            <button className="hover:text-[var(--brand-600)] transition-colors disabled:opacity-50"><ChevronRight size={16} /></button>
          </div>
        </div>

      </div>

    </div>
  );
}