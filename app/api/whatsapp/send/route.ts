import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const token = process.env.FONNTE_TOKEN;
    const target = process.env.WHATSAPP_TARGET;

    if (!token || !target || token === 'your_fonnte_token_here') {
      console.warn('[WhatsApp] Token Fonnte atau Target belum disetting di .env');
      return NextResponse.json({ 
        success: false, 
        message: 'Token Fonnte belum disetting. Pesan diabaikan.' 
      }, { status: 200 });
    }

    const formData = new URLSearchParams();
    formData.append('target', target);
    formData.append('message', message);
    formData.append('delay', '2'); 

    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        Authorization: token,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok || !data.status) {
      console.error('[WhatsApp] Gagal mengirim pesan:', data);
      return NextResponse.json({ error: data.reason || 'Gagal mengirim pesan ke WhatsApp' }, { status: 500 });
    }

    console.log('[WhatsApp] Pesan sukses dikirim ke', target);
    return NextResponse.json({ success: true, response: data });

  } catch (error: any) {
    console.error('[WhatsApp] Internal Server Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
