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
    // Di lingkungan produksi, ini akan menembak ke Python Core AI Service
    // const response = await fetch('http://python-ai-engine:8000/api/v1/predict/wanggu');
    // const aiData: LstmEngineResponse = await response.json();

    // ── SIMULASI INGENIERING PAYLOAD LSTM (MOCKING DATA YANG SAMA DENGAN OUTPUT PYTHON) ──
    const now = Date.now();
    const historical: { timestamp: number; value: number }[] = [];
    const forecast: { timestamp: number; value: number; upperConfidence: number; lowerConfidence: number }[] = [];
    
    // Generate 12 Jam Data Historis Belakang (Interval 1 Jam)
    let baseValue = 2.15;
    for (let i = 12; i >= 0; i--) {
      baseValue += (Math.random() * 0.15 - 0.07);
      historical.push({
        timestamp: now - (i * 60 * 60 * 1000),
        value: Number(baseValue.toFixed(2))
      });
    }

    // Generate 6 Jam Data Prediksi ke Depan (LSTM Sliding Window Output)
    let forecastValue = baseValue;
    for (let i = 1; i <= 6; i++) {
      // Simulasikan tren kenaikan air di masa depan (Skenario Waspada Banjir)
      forecastValue += (Math.random() * 0.25 - 0.05); 
      const spread = i * 0.08; // Akurasi berkurang seiring bertambahnya waktu ke depan
      
      forecast.push({
        timestamp: now + (i * 60 * 60 * 1000),
        value: Number(forecastValue.toFixed(2)),
        upperConfidence: Number((forecastValue + spread).toFixed(2)),
        lowerConfidence: Number((forecastValue - spread).toFixed(2))
      });
    }

    const mockAiResponse: LstmEngineResponse = {
      status: 'success',
      metrics: {
        mae: 0.042,
        rmse: 0.058,
        executionTimeMs: 124,
      },
      historical,
      forecast
    };

    return NextResponse.json(mockAiResponse);
  } catch (error) {
    return NextResponse.json({ status: 'error', message: 'Gagal menghubungi LSTM Inference Engine' }, { status: 500 });
  }
}