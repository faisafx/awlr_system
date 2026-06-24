import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { systemPrompt, messages, selectedModel } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { content: "Kunci API Gemini (GEMINI_API_KEY) belum disetel di server (.env.local). Silakan tambahkan terlebih dahulu agar saya bisa beroperasi." },
        { status: 200 }
      );
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Format history chat agar sesuai dengan spesifikasi Google Gen AI (role: 'user' | 'model')
    const formattedMessages = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const targetModel = selectedModel || 'gemini-2.0-flash';

    const response = await ai.models.generateContent({
      model: targetModel,
      contents: formattedMessages,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.75,
        maxOutputTokens: 1024,
      }
    });

    let responseText = response.text || "";

    // Intercept WhatsApp Intent
    const waMatch = responseText.match(/\[KIRIM_WA:\s*([\s\S]*?)\]/i);
    if (waMatch) {
      const waMessage = waMatch[1].trim() + "\n\n_(Pesan ini dikirim oleh Operator melalui AI Assistant Command Center)_";
      
      try {
        const token = process.env.FONNTE_TOKEN;
        const target = process.env.WHATSAPP_TARGET;
        
        if (token && target && token !== 'your_fonnte_token_here') {
          const formData = new URLSearchParams();
          formData.append('target', target);
          formData.append('message', waMessage);
          formData.append('delay', '1');
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 seconds timeout

          const waResponse = await fetch('https://api.fonnte.com/send', {
            method: 'POST',
            headers: { Authorization: token },
            body: formData,
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (!waResponse.ok) throw new Error('Fonnte API returned ' + waResponse.status);
          
          responseText = responseText.replace(waMatch[0], "\n\n✅ *Berhasil mengirimkan perintah ini ke grup WhatsApp warga.*");
        } else {
          responseText = responseText.replace(waMatch[0], "\n\n⚠️ *Perintah kirim WA dibatalkan: Konfigurasi Fonnte di .env belum lengkap.*");
        }
      } catch (err) {
        console.error("AI WA Error:", err);
        responseText = responseText.replace(waMatch[0], "\n\n❌ *Gagal menghubungi server WhatsApp.*");
      }
    }

    return NextResponse.json({ content: responseText });
  } catch (error: any) {
    console.error('Gemini Error:', error);
    if (error?.status === 429) {
      return NextResponse.json({ content: "⚠️ Kuota API gratis telah habis atau limit rate tercapai (Error 429). Silakan tunggu sebentar lalu coba lagi." }, { status: 200 });
    }
    if (error?.status === 503) {
      return NextResponse.json({ content: "⚠️ Server Google Gemini sedang penuh (High Demand). Silakan coba lagi dalam beberapa detik." }, { status: 200 });
    }
    return NextResponse.json({ content: "⚠️ Maaf, mesin AI sedang mengalami gangguan koneksi ke server Google. Silakan coba model lain atau cek koneksi." }, { status: 200 });
  }
}
