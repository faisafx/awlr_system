'use client';

import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts/core';

interface PredictionChartProps {
  historical: { timestamp: number; value: number }[];
  forecast: { timestamp: number; value: number; upperConfidence: number; lowerConfidence: number }[];
}

export default function PredictionChart({ historical, forecast }: PredictionChartProps) {
  const option = useMemo(() => {
    // Satukan format data untuk konsumsi koordinat x,y ECharts [Timestamp, Value]
    const historySeries = historical.map(item => [item.timestamp, item.value]);
    
    // Titik sambung: ambil titik terakhir dari histori agar garis grafis tidak terputus
    const lastHistoryPoint = historySeries[historySeries.length - 1];
    const forecastSeries = [
      lastHistoryPoint,
      ...forecast.map(item => [item.timestamp, item.value])
    ];

    // Upper dan Lower Bounds untuk area ketidakpastian (Confidence Band)
    const upperSeries = [
      [lastHistoryPoint[0], lastHistoryPoint[1]],
      ...forecast.map(item => [item.timestamp, item.upperConfidence])
    ];
    const lowerSeries = [
      [lastHistoryPoint[0], lastHistoryPoint[1]],
      ...forecast.map(item => [item.timestamp, item.lowerConfidence])
    ];

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'line', lineStyle: { color: 'rgba(255,255,255,0.15)', type: 'dashed' } },
        backgroundColor: 'rgba(9, 15, 29, 0.95)',
        borderColor: 'rgba(255,255,255,0.08)',
        textStyle: { color: '#f1f5f9', fontSize: 11, fontFamily: 'monospace' }
      },
      legend: {
        data: ['TMA Aktual (Histori)', 'Prediksi LSTM (6 Jam Depan)', 'Rentang Keyakinan'],
        top: 0,
        textStyle: { color: '#94a3b8', fontSize: 11 }
      },
      grid: { top: '15%', left: '3%', right: '3%', bottom: '5%', containLabel: true },
      xAxis: {
        type: 'time',
        axisLabel: { color: '#64748b', fontSize: 10 },
        splitLine: { show: false },
        axisLine: { lineStyle: { color: '#1e293b' } }
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 5,
        name: 'TMA (Meter)',
        nameTextStyle: { color: '#64748b', fontSize: 10 },
        axisLabel: { color: '#94a3b8', fontSize: 10 },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.03)', type: 'dashed' } }
      },
      series: [
        {
          name: 'TMA Aktual (Histori)',
          type: 'line',
          data: historySeries,
          smooth: true,
          showSymbol: false,
          lineStyle: { color: '#14b8a6', width: 2.5 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(20, 184, 166, 0.15)' },
              { offset: 1, color: 'rgba(20, 184, 166, 0)' }
            ])
          }
        },
        {
          name: 'Prediksi LSTM (6 Jam Depan)',
          type: 'line',
          data: forecastSeries,
          smooth: true,
          showSymbol: true,
          symbolSize: 6,
          lineStyle: { color: '#a855f7', width: 2.5, type: 'dashed' }, // Warna ungu neon untuk visualisasi AI
          itemStyle: { color: '#c084fc' }
        },
        {
          name: 'Rentang Keyakinan Upper',
          type: 'line',
          data: upperSeries,
          lineStyle: { opacity: 0 },
          stack: 'confidence-band',
          showSymbol: false
        },
        {
          name: 'Rentang Keyakinan',
          type: 'line',
          data: lowerSeries,
          lineStyle: { opacity: 0 },
          stack: 'confidence-band',
          areaStyle: { color: 'rgba(168, 85, 247, 0.06)' }, // Efek bayangan transparansi prediksi
          showSymbol: false
        }
      ]
    };
  }, [historical, forecast]);

  return <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />;
}