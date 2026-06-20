'use client';

import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts/core';

interface PredictionChartProps {
  historical: { timestamp: number; value: number }[];
  forecast: { timestamp: number; value: number; upperConfidence: number; lowerConfidence: number }[];
  metricLabel?: string;
  unit?: string;
  baseColor?: string;
  max?: number;
}

export default function PredictionChart({ historical, forecast, metricLabel = 'TMA', unit = 'm', baseColor = '#14b8a6', max = 5 }: PredictionChartProps) {
  const option = useMemo(() => {
    const historySeries = historical.map(item => [item.timestamp, item.value]);
    const lastHistoryPoint = historySeries[historySeries.length - 1] ?? [Date.now(), 0];
    
    const forecastSeries = [
      lastHistoryPoint,
      ...forecast.map(item => [item.timestamp, item.value])
    ];

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
        data: [`${metricLabel} Aktual (Histori)`, 'Prediksi LSTM (6 Jam Depan)', 'Rentang Keyakinan'],
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
        max: max,
        name: `${metricLabel} (${unit})`,
        nameTextStyle: { color: '#64748b', fontSize: 10 },
        axisLabel: { color: '#94a3b8', fontSize: 10 },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.03)', type: 'dashed' } }
      },
      series: [
        {
          name: `${metricLabel} Aktual (Histori)`,
          type: 'line',
          data: historySeries,
          smooth: true,
          showSymbol: false,
          lineStyle: { color: baseColor, width: 2.5 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: baseColor.replace('rgb', 'rgba').replace(')', ', 0.15)').replace('#14b8a6', 'rgba(20, 184, 166, 0.15)') },
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
          lineStyle: { color: '#a855f7', width: 2.5, type: 'dashed' },
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
          areaStyle: { color: 'rgba(168, 85, 247, 0.06)' },
          showSymbol: false
        }
      ]
    };
  }, [historical, forecast, metricLabel, unit, baseColor, max]);

  return <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />;
}