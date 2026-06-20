import { NextResponse } from 'next/server';

// Interface representasi payload dari Python FastAPI Engine
interface LstmEngineResponse {
  status: string;
  metrics: {
    mae: number;  // Mean Absolute Error
    rmse: number; // Root Mean Squared Error
    executionTimeMs: number;
  };
  historical: { timestamp: number; value: number }[];
  forecast: { timestamp: number; value: number; upperConfidence: number; lowerConfidence: number }[];
}

export async function GET() {
  try {
    const now = Date.now();
    
    // Fungsi pembantu untuk membuat data mockup LSTM
    const generateMockSeries = (
      baseVal: number, 
      trendOffset: number, 
      volatility: number, 
      mae: number, 
      rmse: number, 
      execMs: number
    ) => {
      const historical: { timestamp: number; value: number }[] = [];
      const forecast: { timestamp: number; value: number; upperConfidence: number; lowerConfidence: number }[] = [];
      
      let baseValue = baseVal;
      for (let i = 12; i >= 0; i--) {
        baseValue += (Math.random() * volatility - (volatility / 2));
        historical.push({
          timestamp: now - (i * 60 * 60 * 1000),
          value: Number(baseValue.toFixed(2))
        });
      }

      let forecastValue = baseValue;
      for (let i = 1; i <= 6; i++) {
        forecastValue += (Math.random() * volatility - (volatility / 2)) + trendOffset; 
        const spread = i * (mae * 1.5); 
        
        forecast.push({
          timestamp: now + (i * 60 * 60 * 1000),
          value: Number(forecastValue.toFixed(2)),
          upperConfidence: Number((forecastValue + spread).toFixed(2)),
          lowerConfidence: Number((forecastValue - spread).toFixed(2))
        });
      }

      return {
        metrics: { mae, rmse, executionTimeMs: execMs },
        historical,
        forecast
      };
    };

    // Simulasi TMA (Tinggi Muka Air - satuan meter)
    const tmaData = generateMockSeries(2.15, 0.05, 0.15, 0.042, 0.058, 124);
    
    // Simulasi Debit Air (satuan m3/s)
    const debitData = generateMockSeries(45.5, 2.5, 8.0, 1.25, 1.84, 138);

    return NextResponse.json({
      status: 'success',
      data: {
        tma: tmaData,
        debit: debitData
      }
    });
  } catch (error) {
    return NextResponse.json({ status: 'error', message: 'Gagal menghubungi LSTM Inference Engine' }, { status: 500 });
  }
}