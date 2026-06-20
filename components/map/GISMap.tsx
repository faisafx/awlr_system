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

// ── KUSTOMISASI MARKER MODERN (CLOUD DASHBOARD STYLE) ───────────
const createTacticalNodeIcon = (status: string, size: number = 32) => {
  // Mapping ke variabel EWS yang sudah ada di CSS
  const colorHex = status === 'AWAS' ? '#B91C1C' : status === 'SIAGA' ? '#C2410C' : '#1A7F3C';
  const bgHex = status === 'AWAS' ? '#FEF2F2' : status === 'SIAGA' ? '#FFF7ED' : '#F0FDF4';
  
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div class="relative flex items-center justify-center drop-shadow-md" style="width: ${size}px; height: ${size}px;">
        <span class="absolute inline-flex h-full w-full rounded-full animate-ping opacity-60" style="background-color: ${colorHex};"></span>
        <span class="relative flex items-center justify-center rounded-full border-2" style="width: ${size/1.4}px; height: ${size/1.4}px; background-color: ${bgHex}; border-color: ${colorHex};">
          <div class="w-2 h-2 rounded-full" style="background-color: ${colorHex};"></div>
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
      <div class="relative flex items-center justify-center w-8 h-8 rounded-lg border-2 shadow-md" style="background-color: var(--brand-50); border-color: var(--brand-500);">
        <div class="w-3 h-3 rounded-sm animate-pulse" style="background-color: var(--brand-600);"></div>
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
      setRadarIntensity(prev => (prev === 0.4 ? 0.15 : 0.4));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  return (
    <div className="w-full h-full relative z-10 bg-[var(--surface-inset)] rounded-[inherit]">
      
      {/* ── PANEL LEGENDA TIKTIKAL (Modern Glassmorphism) ── */}
      <div className="absolute bottom-6 left-4 z-[1000] glass-panel p-4 rounded-xl text-[11px] font-[family-name:var(--font-inter)] space-y-3 shadow-lg min-w-[220px]">
        
        <div className="text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-2 uppercase font-bold text-[10px] tracking-widest flex items-center gap-2">
          <Navigation size={14} className="text-[var(--brand-600)]" /> 
          Legenda Topografi
        </div>

        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-[4px] border flex items-center justify-center" style={{ backgroundColor: 'var(--brand-50)', borderColor: 'var(--brand-500)' }}>
            <div className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: 'var(--brand-600)' }}></div>
          </div>
          <span className="text-[var(--text-secondary)] font-medium">Kolam Retensi BWS IV</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="w-4 h-4 rounded-full border-2 flex items-center justify-center" style={{ backgroundColor: 'var(--ews-awas-bg)', borderColor: 'var(--ews-awas)' }}>
             <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--ews-awas)' }}></div>
          </span>
          <span className="text-[var(--text-secondary)] font-medium">Node AWLR / Titik Pantau</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="w-5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--brand-500)' }} />
          <span className="text-[var(--text-secondary)] font-medium">Garis Sempadan DAS</span>
        </div>

        <div className="flex items-center gap-3 pt-2 mt-1 border-t border-[var(--border-subtle)]">
          <span className="w-4 h-4 rounded-full border" style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', borderColor: 'rgba(59, 130, 246, 0.5)' }} />
          <span className="text-[var(--text-muted)] text-[10px] font-[family-name:var(--font-jetbrains)]">BMKG Presipitasi Radar</span>
        </div>

      </div>

      {/* ── CORE MAP CONTAINER ── */}
      <MapContainer 
        center={KENDARI_CENTER} 
        zoom={14} 
        style={{ height: '100%', width: '100%', borderRadius: 'inherit' }}
        zoomControl={true}
      >
        <ScaleControl position="bottomright" imperial={false} metric={true} />

        <LayersControl position="topright">
          
          <LayersControl.BaseLayer checked name="Google Satellite (High-Res)">
            <TileLayer
              url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
              attribution='© <a href="https://www.google.com/maps">Google Maps</a>'
              maxZoom={20}
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="Esri World Imagery (Pure)">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution='© <a href="https://www.esri.com/">Esri</a>, Earthstar Geographics'
              maxZoom={19}
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="Light Default Basemap">
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution='© <a href="https://carto.com/">CARTO</a>'
            />
          </LayersControl.BaseLayer>

          {/* ── OVERLAY LAYER: JALUR SUNGAI ── */}
          <LayersControl.Overlay checked name="Trase Poligon DAS Wanggu">
            <Polygon 
              positions={WANGGU_RIVER_TRACK}
              pathOptions={{
                color: '#3B82F6', // brand-500
                weight: 4,
                fillColor: '#2563EB', // brand-600
                fillOpacity: 0.15,
                lineJoin: 'round',
                dashArray: '8, 8'
              }}
            />
          </LayersControl.Overlay>

          {/* ── OVERLAY LAYER: RADAR CUACA ── */}
          <LayersControl.Overlay checked name="Radar Cuaca BMKG (Live)">
            <FeatureGroup>
              <Circle 
                center={KOLAM_RETENSI_BOULEVARD}
                radius={2000}
                pathOptions={{
                  color: '#3B82F6',
                  weight: 1.5,
                  fillColor: 'transparent',
                  dashArray: '4, 8'
                }}
              />
              <Circle 
                center={KOLAM_RETENSI_BOULEVARD}
                radius={2000}
                pathOptions={{
                  color: 'transparent',
                  weight: 0,
                  fillColor: '#3B82F6',
                  fillOpacity: radarIntensity
                }}
              />
            </FeatureGroup>
          </LayersControl.Overlay>

        </LayersControl>

        {/* ── INFRASTRUCTURE MARKER 1: KOLAM RETENSI ── */}
        <Marker position={KOLAM_RETENSI_BOULEVARD} icon={createInfrastructureIcon()}>
          <Popup closeButton={false} className="modern-popup">
            <div className="p-1 space-y-3 min-w-[200px]">
              <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2">
                <div className="icon-container brand w-6 h-6">
                  <Anchor size={12} />
                </div>
                <span className="font-bold text-[var(--text-primary)] text-[11px] tracking-wide uppercase">Kolam Retensi BWS</span>
              </div>
              
              <div className="space-y-2 text-[10px] font-medium">
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-muted)]">Status Pintu Air</span>
                  <span className="badge" style={{ backgroundColor: 'var(--ews-aman-bg)', color: 'var(--ews-aman)', border: '1px solid #BBF7D0' }}>
                    TERBUKA (30%)
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-muted)]">Kapasitas Maks</span>
                  <span className="text-[var(--text-primary)] font-[family-name:var(--font-jetbrains)]">± 500.000 m³</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-muted)]">Sektor Operasi</span>
                  <span className="text-[var(--text-primary)]">Boulevard, Baruga</span>
                </div>
              </div>
              
              <div className="pt-2 mt-2 flex justify-between text-[9px] font-[family-name:var(--font-jetbrains)] text-[var(--text-disabled)] border-t border-[var(--border-subtle)]">
                <span className="flex items-center gap-1"><MapPin size={10}/> -4.033889</span>
                <span>122.508056</span>
              </div>
            </div>
          </Popup>
        </Marker>

        {/* ── INFRASTRUCTURE MARKER 2: NODE AWLR ESP32 ── */}
        <Marker position={JEMBATAN_WANGGU_AWLR} icon={createTacticalNodeIcon('AWAS', 36)}>
          <Popup closeButton={false} className="modern-popup">
            <div className="p-1 space-y-3 min-w-[200px]">
              <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2">
                <div className="icon-container w-6 h-6" style={{ backgroundColor: 'var(--ews-awas-bg)', color: 'var(--ews-awas)' }}>
                  <Radio size={12} className="animate-pulse" />
                </div>
                <span className="font-bold text-[var(--text-primary)] text-[11px] tracking-wide uppercase">Node WGG-01</span>
              </div>
              
              <div className="space-y-2 text-[10px] font-medium">
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-muted)]">Lokasi Fisik</span>
                  <span className="text-[var(--text-primary)]">Jembatan Wanggu</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-muted)]">Uplink Telemetri</span>
                  <span className="badge" style={{ backgroundColor: 'var(--ews-aman-bg)', color: 'var(--ews-aman)', border: '1px solid #BBF7D0' }}>
                    <Activity size={8} className="mr-1"/> ONLINE
                  </span>
                </div>
                
                <div className="pt-1">
                  <div className="w-full flex items-center justify-center gap-1.5 font-bold p-1.5 rounded-md animate-pulse border" 
                       style={{ backgroundColor: 'var(--ews-awas-bg)', color: 'var(--ews-awas)', borderColor: '#FECACA' }}>
                    <ShieldAlert size={12} /> TMA STATUS: AWAS
                  </div>
                </div>
              </div>

              <div className="pt-2 mt-2 flex justify-between text-[9px] font-[family-name:var(--font-jetbrains)] text-[var(--text-disabled)] border-t border-[var(--border-subtle)]">
                <span className="flex items-center gap-1"><MapPin size={10}/> -4.017500</span>
                <span>122.515200</span>
              </div>
            </div>
          </Popup>
        </Marker>

      </MapContainer>

      {/* ── INJEKSI CSS MODERN UNTUK LEAFLET POPUP ── */}
      <style dangerouslySetInnerHTML={{__html: `
        .modern-popup .leaflet-popup-content-wrapper {
          background: var(--surface-card);
          border: 1px solid var(--border-subtle);
          color: var(--text-primary);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-lg);
          padding: 4px;
        }
        .modern-popup .leaflet-popup-content {
          margin: 8px;
          line-height: 1.4;
        }
        .modern-popup .leaflet-popup-tip {
          background: var(--surface-card);
          border: 1px solid var(--border-subtle);
          box-shadow: var(--shadow-sm);
        }
        .leaflet-control-attribution {
          background: var(--surface-overlay) !important;
          color: var(--text-muted) !important;
          font-family: var(--font-jetbrains), monospace;
          font-size: 9px !important;
          backdrop-filter: blur(8px);
          border-top-left-radius: var(--radius-sm);
        }
        .leaflet-control-attribution a {
          color: var(--brand-600) !important;
          text-decoration: none;
        }
      `}} />
    </div>
  );
}