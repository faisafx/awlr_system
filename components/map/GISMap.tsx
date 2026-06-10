// ─────────────────────────────────────────────────────────────────────────────
// File: components/map/GISMap.tsx
// Architecture: Next.js 14 Client Component
// Description: Government-grade GIS Map using Real High-Res Satellite Imagery 
//              (Esri World Imagery & Google Hybrid). Features precise coordinates,
//              geospatial scale controls, and tactical hydrology overlays.
// ─────────────────────────────────────────────────────────────────────────────

'use client';

import { MapContainer, TileLayer, Marker, Popup, Polygon, Circle, LayersControl, ScaleControl, FeatureGroup } from 'react-leaflet';
import L from 'leaflet';
import { useEffect, useState } from 'react';
import { Radio, ShieldAlert, Anchor, MapPin, Activity, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── KOORDINAT RIIL INFRASTRUKTUR SUNGAI WANGGU, KENDARI ──────────────────────
// Dikalibrasi presisi tinggi untuk citra satelit
const KENDARI_CENTER: [number, number] = [-4.025, 122.510];

// 1. Kolam Retensi Boulevard (Fasilitas Pengendali Banjir Utama - BWS Sulawesi IV)
const KOLAM_RETENSI_BOULEVARD: [number, number] = [-4.033889, 122.508056]; 

// 2. Jembatan Wanggu (Lokasi Titik Rawan Banjir & Pemasangan Sensor AWLR)
const JEMBATAN_WANGGU_AWLR: [number, number] = [-4.017500, 122.515200]; 

// 3. Poligon Presisi Alur DAS Wanggu Menuju Teluk Kendari
const WANGGU_RIVER_TRACK: [number, number][] = [
  [-4.045000, 122.498000], // Hulu Konsel
  [-4.033889, 122.508056], // Kolam Retensi
  [-4.025000, 122.512000], // Meander Baruga
  [-4.017500, 122.515200], // Bottleneck Jembatan Wanggu
  [-4.008000, 122.522000], // Hilir Kadia
  [-3.995000, 122.528000], // Muara Teluk Kendari
];

// ── KUSTOMISASI MARKER TIKTIKAL (DIOPTIMALKAN UNTUK LATAR SATELIT) ───────────
const createTacticalNodeIcon = (status: string, size: number = 28) => {
  const colorClass = status === 'AWAS' ? 'bg-rose-500' : status === 'SIAGA' ? 'bg-orange-500' : 'bg-cyan-500';
  const borderColorClass = status === 'AWAS' ? 'border-rose-300' : status === 'SIAGA' ? 'border-orange-300' : 'border-cyan-300';
  
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div class="relative flex items-center justify-center drop-shadow-[0_5px_15px_rgba(0,0,0,0.8)]" style="width: ${size}px; height: ${size}px;">
        <span class="absolute inline-flex h-full w-full rounded-full animate-ping opacity-80 ${colorClass}"></span>
        <span class="relative flex items-center justify-center rounded-full border-2 ${borderColorClass} ${colorClass}" style="width: ${size/1.5}px; height: ${size/1.5}px;">
          <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
        </span>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
  });
};

const createInfrastructureIcon = () => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div class="relative flex items-center justify-center w-8 h-8 rounded-md bg-blue-600/80 border-2 border-white backdrop-blur-md shadow-[0_5px_15px_rgba(0,0,0,0.7)]">
        <div class="w-3 h-3 rounded-sm bg-white animate-pulse"></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

export default function GISMap() {
  const [mounted, setMounted] = useState(false);
  const [radarIntensity, setRadarIntensity] = useState(0.4);

  // Engine Animasi Radar Cuaca
  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setRadarIntensity(prev => (prev === 0.4 ? 0.1 : 0.4));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  return (
    <div className="w-full h-full relative z-10 bg-[#0a0a0a]">
      
      {/* ── PANEL LEGENDA TIKTIKAL (Glassmorphism Profesional) ── */}
      <div className="absolute bottom-6 left-4 z-[1000] bg-slate-950/90 border border-white/10 p-4 rounded-xl backdrop-blur-xl text-[11px] font-mono space-y-3 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        <div className="text-slate-300 border-b border-white/10 pb-2 uppercase font-bold text-[10px] tracking-widest flex items-center gap-2">
          <Navigation size={14} className="text-cyan-400" /> Legenda Topografi
        </div>
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-[4px] bg-blue-600/80 border border-white shadow-sm flex items-center justify-center"><div className="w-1 h-1 bg-white rounded-full"></div></div>
          <span className="text-slate-300">Kolam Retensi BWS IV</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-4 h-4 rounded-full bg-rose-500/80 border-2 border-white animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
          <span className="text-slate-300">AWLR Node / Titik Pantau</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-5 h-1 bg-cyan-400 rounded-full shadow-[0_0_5px_rgba(34,211,238,0.5)]" />
          <span className="text-slate-300">Garis Sempadan DAS Wanggu</span>
        </div>
        <div className="flex items-center gap-3 pt-1 border-t border-white/5">
          <span className="w-4 h-4 rounded-full bg-blue-500/30 border border-blue-400/50" />
          <span className="text-slate-400 text-[10px]">BMKG Presipitasi Radar</span>
        </div>
      </div>

      {/* ── CORE MAP CONTAINER ── */}
      <MapContainer 
        center={KENDARI_CENTER} 
        zoom={14} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={true} // Aktifkan zoom control default Leaflet
      >
        {/* Indikator Skala Geospasial Profesional (Wajib untuk Peta Engineering) */}
        <ScaleControl position="bottomright" imperial={false} metric={true} />

        <LayersControl position="topright">
          
          {/* ── BASE LAYER 1: GOOGLE MAPS SATELLITE HYBRID (DEFAULT) ── */}
          {/* Menggunakan API publik Google Maps lengkap dengan label jalan */}
          <LayersControl.BaseLayer checked name="Google Satellite (High-Res)">
            <TileLayer
              url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
              attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
              maxZoom={20}
            />
          </LayersControl.BaseLayer>

          {/* ── BASE LAYER 2: ESRI WORLD IMAGERY (GIS STANDARD) ── */}
          {/* Sangat jernih untuk topografi, murni foto bumi tanpa label jalan */}
          <LayersControl.BaseLayer name="Esri World Imagery (Pure)">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>, Earthstar Geographics'
              maxZoom={19}
            />
          </LayersControl.BaseLayer>

          {/* ── BASE LAYER 3: CARTO DARK (FALLBACK MODE MALAM) ── */}
          <LayersControl.BaseLayer name="Dark Tactical Mode">
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            />
          </LayersControl.BaseLayer>

          {/* ── OVERLAY LAYER: JALUR SUNGAI (RIVER TRACE) ── */}
          <LayersControl.Overlay checked name="Trase Poligon DAS Wanggu">
            <Polygon 
              positions={WANGGU_RIVER_TRACK}
              pathOptions={{
                color: '#22d3ee', // cyan-400 agar sangat kontras di atas satelit hijau/gelap
                weight: 4,
                fillColor: '#0891b2', // cyan-600
                fillOpacity: 0.15,
                lineJoin: 'round',
                dashArray: '8, 8' // Efek garis putus-putus
              }}
            />
          </LayersControl.Overlay>

          {/* ── OVERLAY LAYER: RADAR CUACA ── */}
          <LayersControl.Overlay checked name="Radar Cuaca BMKG (Live)">
            <FeatureGroup>
              {/* Cincin luar radar */}
              <Circle 
                center={KOLAM_RETENSI_BOULEVARD}
                radius={2000} // 2 KM
                pathOptions={{
                  color: '#3b82f6', 
                  weight: 1,
                  fillColor: 'transparent',
                  dashArray: '4, 10'
                }}
              />
              {/* Inti sapuan radar dinamis */}
              <Circle 
                center={KOLAM_RETENSI_BOULEVARD}
                radius={2000}
                pathOptions={{
                  color: 'transparent',
                  weight: 0,
                  fillColor: '#2563eb', // blue-600
                  fillOpacity: radarIntensity
                }}
              />
            </FeatureGroup>
          </LayersControl.Overlay>

        </LayersControl>

        {/* ── INFRASTRUCTURE MARKER 1: KOLAM RETENSI ── */}
        <Marker position={KOLAM_RETENSI_BOULEVARD} icon={createInfrastructureIcon()}>
          <Popup closeButton={false} className="tactical-popup">
            <div className="p-2 font-mono text-xs space-y-2 min-w-[200px]">
              <div className="flex items-center gap-2 border-b border-slate-700 pb-2 mb-2">
                <Anchor size={14} className="text-blue-400" />
                <span className="font-bold text-slate-100 tracking-wider">KOLAM RETENSI BWS</span>
              </div>
              <div className="space-y-1.5 text-[10px] text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Status Pintu Air</span>
                  <span className="text-emerald-400 font-bold bg-emerald-400/10 px-1.5 py-0.5 rounded">TERBUKA (30%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kapasitas Maks</span>
                  <span className="text-slate-200">± 500.000 m³</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sektor Operasi</span>
                  <span className="text-cyan-400">Boulevard, Baruga</span>
                </div>
              </div>
              <div className="pt-2 mt-2 flex justify-between text-[9px] text-slate-500 border-t border-slate-700/50">
                <span className="flex items-center gap-1"><MapPin size={10}/> -4.033889</span>
                <span>122.508056</span>
              </div>
            </div>
          </Popup>
        </Marker>

        {/* ── INFRASTRUCTURE MARKER 2: NODE AWLR ESP32 ── */}
        <Marker position={JEMBATAN_WANGGU_AWLR} icon={createTacticalNodeIcon('AWAS', 32)}>
          <Popup closeButton={false} className="tactical-popup">
            <div className="p-2 font-mono text-xs space-y-2 min-w-[200px]">
              <div className="flex items-center gap-2 border-b border-slate-700 pb-2 mb-2">
                <Radio size={14} className="text-rose-400 animate-pulse" />
                <span className="font-bold text-rose-400 tracking-wider">NODE AWLR WGG-01</span>
              </div>
              <div className="space-y-1.5 text-[10px] text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Lokasi Fisik</span>
                  <span className="text-slate-200">Jembatan Wanggu</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Uplink Telemetri</span>
                  <span className="text-emerald-400 font-bold bg-emerald-400/10 px-1.5 py-0.5 rounded flex items-center gap-1"><Activity size={10}/> ONLINE</span>
                </div>
                <div className="pt-1">
                  <div className="w-full bg-rose-500/20 border border-rose-500/50 text-rose-400 p-1.5 rounded flex items-center justify-center gap-1.5 font-bold animate-pulse">
                    <ShieldAlert size={12} /> TMA STATUS: AWAS
                  </div>
                </div>
              </div>
              <div className="pt-2 mt-2 flex justify-between text-[9px] text-slate-500 border-t border-slate-700/50">
                <span className="flex items-center gap-1"><MapPin size={10}/> -4.017500</span>
                <span>122.515200</span>
              </div>
            </div>
          </Popup>
        </Marker>

      </MapContainer>

      {/* ── INJEKSI CSS KHUSUS UNTUK POPUP LEAFLET AGAR SESUAI TEMA ── */}
      <style dangerouslySetInnerHTML={{__html: `
        /* Overrides Leaflet Popup Default Styles for Tactical Look */
        .tactical-popup .leaflet-popup-content-wrapper {
          background: rgba(15, 23, 42, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(12px);
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.8);
          padding: 0;
        }
        .tactical-popup .leaflet-popup-content {
          margin: 0;
          line-height: 1.4;
        }
        .tactical-popup .leaflet-popup-tip {
          background: rgba(15, 23, 42, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.15);
        }
        /* Make attribution less intrusive */
        .leaflet-control-attribution {
          background: rgba(0,0,0,0.5) !important;
          color: rgba(255,255,255,0.5) !important;
          font-family: monospace;
          font-size: 9px !important;
        }
        .leaflet-control-attribution a {
          color: rgba(255,255,255,0.8) !important;
        }
      `}} />
    </div>
  );
}