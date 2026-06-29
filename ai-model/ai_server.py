import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import numpy as np
import pickle
from tensorflow.keras.models import load_model
from fastapi.middleware.cors import CORSMiddleware

# Inisialisasi API Server
app = FastAPI(title="AWLR AI Microservice")

# Izinkan Next.js mengakses API ini (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Buka untuk semua origin (localhost)
    allow_methods=["*"],
    allow_headers=["*"],
)

# Variabel Global untuk menyimpan otak AI di RAM
model = None
scaler_fitur = None
scaler_target = None

@app.on_event("startup")
def load_ai_assets():
    global model, scaler_fitur, scaler_target
    try:
        # 1. Memuat Jaringan Saraf (Model)
        model = load_model('lstm_awlr_model.h5')
        
        # 2. Memuat Timbangan Data (Scalers)
        with open('scaler_fitur.pkl', 'rb') as f:
            scaler_fitur = pickle.load(f)
        with open('scaler_target.pkl', 'rb') as f:
            scaler_target = pickle.load(f)
            
        print("SUCCESS: Otak AI dan Scaler Berhasil Dimuat ke RAM Server!")
    except Exception as e:
        print(f"ERROR: Gagal memuat AI: {e}")
        print("Pastikan Anda sudah me-RUN sel terakhir di Jupyter Notebook untuk menyimpan model.")

# Struktur Data yang diharapkan dari Next.js
class SensorData(BaseModel):
    # Next.js wajib mengirim array berisi 14 array (14 hari terakhir)
    # Contoh format: [ [Debit_H1, Hujan_H1], [Debit_H2, Hujan_H2], ... (sampai 14) ]
    history_14_days: list 

@app.post("/predict")
def predict_debit(data: SensorData):
    if len(data.history_14_days) != 14:
        raise HTTPException(status_code=400, detail="Data harus berisi tepat 14 hari terakhir!")
    
    # 1. Konversi data JSON dari Next.js menjadi Numpy Array
    input_mentah = np.array(data.history_14_days)
    
    # 2. Pura-pura membuat dataframe atau langsung di-scale
    # Bentuk input_mentah adalah (14, 2). Kita scale pakai scaler_fitur
    input_scaled = scaler_fitur.transform(input_mentah)
    
    # 3. Bentuk menjadi format 3D untuk LSTM: (1 Sample, 14 Timesteps, 2 Features)
    input_3d = input_scaled.reshape(1, 14, 2)
    
    # 4. Berpikir & Memprediksi!
    prediksi_scaled = model.predict(input_3d)
    
    # 5. Kembalikan ke angka Debit Air nyata (m3/detik)
    prediksi_asli = scaler_target.inverse_transform(prediksi_scaled)
    
    # 6. Kirim jawaban kembali ke Next.js
    return {
        "status": "success",
        "prediksi_debit_air": float(prediksi_asli[0][0])
    }

if __name__ == "__main__":
    # Jalankan server di port 5000
    print("Menjalankan AI Server di http://localhost:5000")
    uvicorn.run(app, host="0.0.0.0", port=5000)
