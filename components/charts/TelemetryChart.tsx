// ─────────────────────────────────────────────────────────────────────────────
// File: components/charts/TelemetryChart.tsx
// Description: Advanced dual-axis ECharts instance for EWS Telemetry.
// Features: DataZoom, Sensor Fusion (QDY30A vs A02YYUW), Rainfall Bars, 
//           and PUPR standard Siaga 1-3 MarkLines.
// ─────────────────────────────────────────────────────────────────────────────

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts/core';

interface DataPoint {
  time: number;
  hydro: number;
  ultra: number;
  rain: number;
}

export default function TelemetryChart() {
  const [data, setData] = useState<DataPoint[]>([]);

  // 1. Generator Data Historis & Real-time (Simulasi Array untuk Chart)
  useEffect(() => {
    const generateHistoricalData = () => {
      const initialData: DataPoint[] = [];
      let now = new Date().getTime();
      let baseHydro = 1.8;
      
      // Buat 100 titik data ke belakang (interval 4 detik)
      for (let i = 100; i >= 0; i--) {
        baseHydro = baseHydro + (Math.random() * 0.04 - 0.02);
        const ultra = baseHydro + (Math.random() * 0.05 - 0.025);
        // Hujan acak sesekali
        const rain = Math.random() > 0.8 ? Math.random() * 15 : 0; 
        
        initialData.push({
          time: now - i * 4000,
          hydro: Number(baseHydro.toFixed(2)),
          ultra: Number(ultra.toFixed(2)),
          rain: Number(rain.toFixed(1))
        });
      }
      return initialData;
    };

    setData(generateHistoricalData());

    // Simulasi penambahan data setiap 4 detik (Nantinya diganti dengan array dari MQTT ESP32)
    const interval = setInterval(() => {
      setData((prev) => {
        const lastHydro = prev[prev.length - 1].hydro;
        const nextHydro = Number((lastHydro + (Math.random() * 0.04 - 0.02)).toFixed(2));
        const nextUltra = Number((nextHydro + (Math.random() * 0.06 - 0.03)).toFixed(2));
        const rain = Math.random() > 0.8 ? Number((Math.random() * 15).toFixed(1)) : 0;

        const newDataPoint = {
          time: new Date().getTime(),
          hydro: nextHydro,
          ultra: nextUltra,
          rain: rain
        };

        // Simpan hanya 100 titik data terakhir agar memori browser tidak bocor
        return [...prev.slice(1), newDataPoint];
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // 2. Konfigurasi Apache ECharts (Government Grade Options)
  const option = useMemo(() => {
    return {
      // Styling dasar agar menyatu dengan Dark Mode Tailwind (slate-950/900)
      backgroundColor: 'transparent',
      
      // Tooltip lintas sumbu (Crosshair)
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross', crossStyle: { color: '#64748b' } },
        backgroundColor: 'rgba(15, 23, 42, 0.9)', // slate-900
        borderColor: 'rgba(255,255,255,0.1)',
        textStyle: { color: '#f1f5f9', fontSize: 11, fontFamily: 'monospace' },
      },
      
      // Posisi Legenda
      legend: {
        data: ['TMA Hydrostatic', 'TMA Ultrasonic', 'Curah Hujan'],
        top: 0,
        type: 'scroll',
        itemGap: 10,
        textStyle: { color: '#94a3b8', fontSize: 10 },
        icon: 'circle'
      },
      
      // Margin Grid Chart
      grid: {
        top: 40,
        left: '2%',
        right: '2%',
        bottom: '15%',
        containLabel: true
      },

      // Fitur Zooming / Panning
      dataZoom: [
        { type: 'inside', start: 0, end: 100 },
        { 
          type: 'slider', 
          show: true, 
          bottom: 0, 
          height: 12,
          borderColor: 'transparent',
          fillerColor: 'rgba(20, 184, 166, 0.2)', // teal-500
          textStyle: { color: 'transparent' }
        }
      ],

      // Sumbu X: Waktu (Otomatis mem-parsing timestamp millisecond)
      xAxis: [
        {
          type: 'time',
          boundaryGap: false,
          axisLabel: { 
            color: '#64748b', 
            fontSize: 10,
            formatter: '{HH}:{mm}:{ss}' // Format Waktu
          },
          splitLine: { show: false },
          axisLine: { lineStyle: { color: '#334155' } }
        }
      ],

      // Sumbu Y: Kiri (Ketinggian Air), Kanan (Curah Hujan)
      yAxis: [
        {
          type: 'value',
          name: 'TMA (Meter)',
          nameTextStyle: { color: '#64748b', fontSize: 10, padding: [0, 20, 0, 0] },
          min: 0,
          max: 5, // Set maksimal tiang duga
          axisLabel: { color: '#94a3b8', fontSize: 10 },
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)', type: 'dashed' } }
        },
        {
          type: 'value',
          name: 'Hujan (mm)',
          nameTextStyle: { color: '#64748b', fontSize: 10, padding: [0, 0, 0, 20] },
          min: 0,
          max: 50,
          axisLabel: { color: '#94a3b8', fontSize: 10 },
          splitLine: { show: false }
        }
      ],

      // Seri Data
      series: [
        {
          name: 'Curah Hujan',
          type: 'bar',
          yAxisIndex: 1, // Menggunakan Sumbu Y Kanan
          data: data.map(item => [item.time, item.rain]),
          itemStyle: { 
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(14, 165, 233, 0.8)' }, // sky-500
              { offset: 1, color: 'rgba(14, 165, 233, 0.1)' }
            ]),
            borderRadius: [2, 2, 0, 0]
          },
          barWidth: '40%'
        },
        {
          name: 'TMA Ultrasonic',
          type: 'line',
          data: data.map(item => [item.time, item.ultra]),
          smooth: true,
          showSymbol: false,
          lineStyle: { color: '#3b82f6', width: 1.5, type: 'dashed' }, // blue-500 dashed
        },
        {
          name: 'TMA Hydrostatic',
          type: 'line',
          data: data.map(item => [item.time, item.hydro]),
          smooth: true,
          showSymbol: false,
          lineStyle: { color: '#14b8a6', width: 2 }, // teal-500
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(20, 184, 166, 0.3)' },
              { offset: 1, color: 'rgba(20, 184, 166, 0.0)' }
            ])
          },
          // ── MARK LINES: Standar Threshold Peringatan Dini PUPR ──
          markLine: {
            symbol: ['none', 'none'],
            label: { position: 'insideStartTop', fontSize: 9, color: '#fff', padding: [0, 0, 0, 10] },
            lineStyle: { width: 1.5 },
            data: [
              { 
                yAxis: 3.5, 
                name: 'Siaga 1 (AWAS)', 
                lineStyle: { color: '#f43f5e', type: 'solid' }, // rose-500
                label: { formatter: 'SIAGA 1 (3.5m)' }
              },
              { 
                yAxis: 2.8, 
                name: 'Siaga 2 (SIAGA)', 
                lineStyle: { color: '#f97316', type: 'dashed' }, // orange-500
                label: { formatter: 'SIAGA 2 (2.8m)' }
              },
              { 
                yAxis: 2.0, 
                name: 'Siaga 3 (WASPADA)', 
                lineStyle: { color: '#eab308', type: 'dotted' }, // yellow-500
                label: { formatter: 'SIAGA 3 (2.0m)' }
              }
            ]
          }
        }
      ]
    };
  }, [data]);

  return (
    <div className="w-full h-full relative">
      <ReactECharts 
        option={option} 
        style={{ height: '100%', width: '100%' }} 
        notMerge={true}
        lazyUpdate={true}
      />
    </div>
  );
}