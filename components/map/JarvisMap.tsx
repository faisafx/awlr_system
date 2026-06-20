// ─────────────────────────────────────────────────────────────────────────────
// File: components/map/GISMap.tsx
// Architecture: Next.js 14 Client Component
// Project: Full-Stack AWLR Command Center - Sungai Wanggu, Kendari
// Description: Enterprise-grade GIS Map. Clean, modern, Google Cloud aesthetic.
//              Features solid marker iconography and geospatial tracking overlays.
// ─────────────────────────────────────────────────────────────────────────────

'use client';

import { MapContainer, TileLayer, Marker, Popup, Polygon, Circle, LayersControl, ScaleControl } from 'react-leaflet';
import L from 'leaflet';
import { useEffect, useState } from 'react';

// ── KOORDINAT RIIL SUNGAI WANGGU ──────────────────────────────────────────────
const KENDARI_CENTER: [number, number] = [-4.025, 122.510];
const KOLAM_RETENSI_BOULEVARD: [number, number] = [-4.033889, 122.508056];
const JEMBATAN_WANGGU_AWLR: [number, number] = [-4.017500, 122.515200];

const WANGGU_RIVER_TRACK: [number, number][] = [
  [-4.045, 122.498], [-4.033889, 122.508056], [-4.025, 122.512],
  [-4.0175, 122.5152], [-4.008, 122.522], [-3.995, 122.528],
];

// ── ENTERPRISE CUSTOM ICONS ──────────────────────────────────────────────────
// Marker untuk Node Sensor Utama (Merespons status telemetri)
const createPrimaryNodeIcon = (status: 'ONLINE' | 'OFFLINE' | 'WARNING') => {
  const colorHex = status === 'WARNING' ? 'var(--ews-awas)' : status === 'OFFLINE' ? 'var(--text-disabled)' : 'var(--brand-500)';
  const bgHex = status === 'WARNING' ? 'var(--ews-awas-bg)' : status === 'OFFLINE' ? 'var(--surface-inset)' : 'var(--brand-50)';
  
  return L.divIcon({
    className: 'clear-default',
    html: `
      <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));">
        <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background-color: ${bgHex}; border: 2px solid ${colorHex}; opacity: 0.8; ${status !== 'OFFLINE' ? 'animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;' : ''}"></div>
        <div style="position: relative; z-index: 10; width: 16px; height: 16px; background-color: ${colorHex}; border-radius: 50%; border: 3px solid var(--surface-card);"></div>
      </div>
      <style>
        @keyframes ping-slow {
          0% { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(1.6); opacity: 0; }
        }
      </style>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

// Marker untuk Infrastruktur Statis (Kolam Retensi)
const createStaticInfraIcon = () => {
  return L.divIcon({
    className: 'clear-default',
    html: `
      <div style="width: 28px; height: 28px; background: var(--surface-card); border: 2px solid var(--brand-600); border-radius: 6px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <div style="width: 10px; height: 10px; background: var(--brand-500); border-radius: 2px;"></div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

interface GISMapProps {
  hardwareStatus: 'ONLINE' | 'OFFLINE' | 'WARNING';
}

export default function GISMap({ hardwareStatus }: GISMapProps) {
  const [mounted, setMounted] = useState(false);
  const [coverageRadius, setCoverageRadius] = useState(2000); // 2km default coverage area

  useEffect(() => {
    setMounted(true);
    // Subtle pulsing effect for the coverage area instead of harsh radar sweeps
    const interval = setInterval(() => {
      setCoverageRadius(prev => prev === 2000 ? 2050 : 2000);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  return (
    <MapContainer 
      center={KENDARI_CENTER} 
      zoom={14} 
      style={{ height: '100%', width: '100%', backgroundColor: 'var(--surface-inset)', borderRadius: 'inherit', zIndex: 0 }} 
      zoomControl={true}
    >
      <ScaleControl position="bottomleft" imperial={false} metric={true} />

      <LayersControl position="topright">
        
        {/* Base Layer: Modern Light Map (Google style) */}
        <LayersControl.BaseLayer checked name="Light Map">
          <TileLayer 
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" 
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
        </LayersControl.BaseLayer>

        {/* Alternative Layer: Satellite Imagery */}
        <LayersControl.BaseLayer name="Satellite">
          <TileLayer 
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" 
            attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
          />
        </LayersControl.BaseLayer>

        {/* Overlay: River Trase */}
        <LayersControl.Overlay checked name="Trase Sungai Wanggu">
          <Polygon 
            positions={WANGGU_RIVER_TRACK}
            pathOptions={{ 
              color: 'var(--brand-500)', 
              weight: 4, 
              fillColor: 'var(--brand-200)', 
              fillOpacity: 0.3, 
              lineJoin: 'round',
            }}
          />
        </LayersControl.Overlay>

        {/* Overlay: Sensor Coverage Area */}
        {hardwareStatus !== 'OFFLINE' && (
          <LayersControl.Overlay checked name="Radius Komunikasi Node">
            <Circle 
              center={JEMBATAN_WANGGU_AWLR} 
              radius={coverageRadius} 
              pathOptions={{ 
                color: 'var(--brand-300)', 
                weight: 1, 
                fillColor: 'var(--brand-50)', 
                fillOpacity: 0.2,
                dashArray: '5, 10'
              }} 
            />
          </LayersControl.Overlay>
        )}

      </LayersControl>

      {/* Target Markers */}
      <Marker position={KOLAM_RETENSI_BOULEVARD} icon={createStaticInfraIcon()}>
        <Popup className="enterprise-popup">
          <div style={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            INFRA: KOLAM RETENSI BWS IV
          </div>
        </Popup>
      </Marker>

      <Marker position={JEMBATAN_WANGGU_AWLR} icon={createPrimaryNodeIcon(hardwareStatus)}>
        <Popup className="enterprise-popup">
          <div style={{ fontFamily: 'var(--font-jetbrains), monospace', fontSize: '11px', fontWeight: 700, color: hardwareStatus === 'WARNING' ? 'var(--ews-awas)' : 'var(--brand-600)' }}>
            NODE: AWLR_WGG_01 [{hardwareStatus}]
          </div>
        </Popup>
      </Marker>

      {/* ── CSS KHUSUS UNTUK POPUP LEAFLET ENTERPRISE ── */}
      <style dangerouslySetInnerHTML={{__html: `
        .enterprise-popup .leaflet-popup-content-wrapper {
          background: var(--surface-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-sm);
          padding: 2px 4px;
        }
        .enterprise-popup .leaflet-popup-content {
          margin: 8px 12px;
          line-height: 1.4;
        }
        .enterprise-popup .leaflet-popup-tip {
          background: var(--surface-card);
          border: 1px solid var(--border-subtle);
          border-top: none;
          border-left: none;
        }
        .leaflet-control-layers-toggle {
          background-color: var(--surface-card) !important;
          border-radius: var(--radius-sm) !important;
          border: 1px solid var(--border-subtle) !important;
        }
        .leaflet-bar a {
          background-color: var(--surface-card) !important;
          color: var(--text-primary) !important;
          border-bottom: 1px solid var(--border-subtle) !important;
        }
        .leaflet-bar a:hover {
          background-color: var(--surface-inset) !important;
        }
      `}} />
    </MapContainer>
  );
}