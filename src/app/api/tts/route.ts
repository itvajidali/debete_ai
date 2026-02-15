import { NextRequest, NextResponse } from 'next/server';
import { generateSpeech } from '@/lib/edge-tts';

export async function POST(req: NextRequest) {
    try {
        const { text, voice } = await req.json();

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        // Default to Madhur (Male) if not specified or Generic
        const targetVoice = voice || 'hi-IN-MadhurNeural';

        const audioBuffer = await generateSpeech(text, targetVoice);

        // Return binary audio
        return new NextResponse(audioBuffer as any, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Length': audioBuffer.length.toString(),
            },
        });

    } catch (error: any) {
        console.error('TTS Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
