// ─────────────────────────────────────────────────────────────────────────────
// File: components/map/JarvisMap.tsx
// Description: J.A.R.V.I.S HUD Style Leaflet Map for Sungai Wanggu.
// Features: Holographic Crosshairs, Radar Sweeps, and Hex Grid Overlays.
// ─────────────────────────────────────────────────────────────────────────────

'use client';

import { MapContainer, TileLayer, Marker, Popup, Polygon, Circle, LayersControl } from 'react-leaflet';
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

// ── J.A.R.V.I.S HUD CUSTOM ICONS ──────────────────────────────────────────────
const createHudTargetIcon = (status: 'ONLINE' | 'OFFLINE' | 'WARNING') => {
  const color = status === 'WARNING' ? '#ef4444' : status === 'OFFLINE' ? '#64748b' : '#06b6d4';
  const glow = status === 'WARNING' ? 'rgba(239, 68, 68, 0.5)' : status === 'OFFLINE' ? 'transparent' : 'rgba(6, 182, 212, 0.5)';
  
  return L.divIcon({
    className: 'clear-default',
    html: `
      <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 100%; height: 100%; border: 1px solid ${color}; border-radius: 50%; border-top-color: transparent; border-bottom-color: transparent; animation: spin 4s linear infinite; box-shadow: 0 0 10px ${glow};"></div>
        <div style="width: 8px; height: 8px; background-color: ${color}; border-radius: 50%; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite; box-shadow: 0 0 15px ${color};"></div>
        <div style="position: absolute; width: 2px; height: 10px; background-color: ${color}; top: -5px;"></div>
        <div style="position: absolute; width: 2px; height: 10px; background-color: ${color}; bottom: -5px;"></div>
        <div style="position: absolute; width: 10px; height: 2px; background-color: ${color}; left: -5px;"></div>
        <div style="position: absolute; width: 10px; height: 2px; background-color: ${color}; right: -5px;"></div>
      </div>
      <style>
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes ping { 75%, 100% { transform: scale(2.5); opacity: 0; } }
      </style>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

const createHexIcon = () => {
  return L.divIcon({
    className: 'clear-default',
    html: `
      <div style="width: 30px; height: 30px; background: rgba(59, 130, 246, 0.2); border: 1.5px solid #3b82f6; clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%); display: flex; align-items: center; justify-content: center; box-shadow: 0 0 15px rgba(59, 130, 246, 0.5);">
        <div style="width: 4px; height: 4px; background: #60a5fa; border-radius: 50%; box-shadow: 0 0 8px #93c5fd;"></div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

interface JarvisMapProps {
  hardwareStatus: 'ONLINE' | 'OFFLINE' | 'WARNING';
}

export default function JarvisMap({ hardwareStatus }: JarvisMapProps) {
  const [mounted, setMounted] = useState(false);
  const [radarRadius, setRadarRadius] = useState(100);

  useEffect(() => {
    setMounted(true);
    // Radar ping animation
    const interval = setInterval(() => {
      setRadarRadius(prev => prev >= 2500 ? 100 : prev + 300);
    }, 150);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  return (
    <MapContainer center={KENDARI_CENTER} zoom={14} style={{ height: '100%', width: '100%', backgroundColor: '#020617' }} zoomControl={false}>
      {/* Base Layer: CartoDB Dark Matter (Perfect for HUDs) */}
      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

      {/* Simulated Hexagonal Grid Overlay for Tech Aesthetic */}
      <TileLayer 
        url="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMjBMMTAgMEwzMCAwTDQwIDIwTDMwIDQwTDEwIDQwWSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDYsIDE4MiwgMjEyLCAwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9zdmc+" 
        opacity={0.8} 
      />

      {/* Holographic River Trace */}
      <Polygon 
        positions={WANGGU_RIVER_TRACK}
        pathOptions={{ color: '#06b6d4', weight: 2, fillColor: 'transparent', opacity: 0.8, dashArray: '4 8' }}
      />

      {/* Radar Sweep Effect at Node */}
      {hardwareStatus !== 'OFFLINE' && (
        <Circle 
          center={JEMBATAN_WANGGU_AWLR} 
          radius={radarRadius} 
          pathOptions={{ color: '#06b6d4', weight: 1, fillColor: 'transparent', opacity: 1 - (radarRadius / 2500) }} 
        />
      )}

      {/* Target Markers */}
      <Marker position={KOLAM_RETENSI_BOULEVARD} icon={createHexIcon()}>
        <Popup className="hud-popup"><span style={{ fontFamily: 'monospace', color: '#60a5fa' }}>// INFRA: RETENTION_POND_01</span></Popup>
      </Marker>

      <Marker position={JEMBATAN_WANGGU_AWLR} icon={createHudTargetIcon(hardwareStatus)}>
        <Popup className="hud-popup"><span style={{ fontFamily: 'monospace', color: '#06b6d4' }}>// NODE: AWLR_WGG_01</span></Popup>
      </Marker>
    </MapContainer>
  );
}