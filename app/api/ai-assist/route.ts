import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { systemPrompt, messages } = await req.json();

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

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: formattedMessages,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2, // Temperatur rendah agar AI lebih presisi dan analitis (tidak berhalusinasi)
      }
    });

    return NextResponse.json({ content: response.text });
  } catch (error: any) {
    console.error('Gemini Error:', error);
    return NextResponse.json({ content: "Maaf, mesin AI sedang mengalami gangguan saat menganalisis data." }, { status: 500 });
  }
}
