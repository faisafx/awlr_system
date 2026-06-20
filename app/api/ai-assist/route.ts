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

    const targetModel = selectedModel || 'gemini-flash-latest';

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
          
          await fetch('https://api.fonnte.com/send', {
            method: 'POST',
            headers: { Authorization: token },
            body: formData
          });
          
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
      return NextResponse.json({ content: "⚠️ Kuota API gratis telah habis atau limit rate tercapai (Error 429). Silakan tunggu sebentar lalu coba lagi, atau pilih model AI yang lain di pengaturan atas." }, { status: 200 });
    }
    return NextResponse.json({ content: "⚠️ Maaf, mesin AI sedang mengalami gangguan saat menganalisis data. Silakan coba lagi." }, { status: 200 });
  }
}
