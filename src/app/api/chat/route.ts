import { NextResponse } from 'next/server';
import { genAI } from '@/lib/gemini'; // Priority 1
import { groq } from '@/lib/groq';     // Priority 2
import { ollama } from '@/lib/ollama'; // Priority 3
import { Message } from '@/lib/types';

export async function POST(req: Request) {
    try {
        const { topic, messages, turn } = await req.json();

        if (!topic || !turn) {
            return NextResponse.json({ error: 'Missing topic or turn' }, { status: 400 });
        }

        let systemPrompt = "";

        // Check if the topic is religious/Islamic
        const isIslamicContext = /allah|god|islam|quran|hadees|hadith|prophet|religion/i.test(topic);

        // Detect Debate Stage
        const turnCount = messages.length;
        // Limit set to 10 turns as requested
        const isConclusion = turnCount >= 10;

        let modeInstruction = "";
        if (isConclusion) {
            modeInstruction = `
            **CURRENT STAGE: CONCLUSION**
            - Do NOT continue arguing.
            - Summarize your stance and respect the opponent's view.
            - End with a final thought on Human Nature/Truth.
            - **Language**: HINDI (Devanagari/Hinglish).`;
        } else {
            modeInstruction = `
            **CURRENT STAGE: DEBATE**
            - Argue your point passionately but logically.
            - **Language**: PURE HINDI (Devanagari).
            `;
        }

        if (turn === 'proponent') {
            if (isIslamicContext) {
                systemPrompt = `You are an Islamic Scholar. Argue IN FAVOR of: "${topic}".
                ${modeInstruction}
                **Strict Rules:**
                1. **Language**: RESPONSE MUST BE IN HINDI.
                2. **Source**: Cite **Authentic Quran (Surah:No) & Sahih Hadith** only.
                3. **Tone**: Human, emotional, referencing "Insani Fitrat" (Human Nature).
                4. **Format**: Short Bullet Points.
                Example:
                * इंसान की फितरत है... (Ref: Quran 30:30)`;
            } else {
                systemPrompt = `You are the PROPONENT. Argue IN FAVOR of: "${topic}".
                ${modeInstruction}
                **Strict Rules:**
                1. **Language**: RESPONSE MUST BE IN HINDI.
                2. **Tone**: Relatable, Human-centric.
                3. **Format**: Short Bullet Points.`;
            }
        } else {
            if (isIslamicContext) {
                systemPrompt = `You are a Critical Thinker. Provide EXTERNAL CONTEXT on: "${topic}".
                 ${modeInstruction}
                 **Strict Rules:**
                 1. **Language**: RESPONSE MUST BE IN HINDI.
                 2. **Tone**: Practical, Logical, Observant of Human Flaws.
                 3. **Format**: Short Bullet Points.
                 4. **Goal**: Explain the scientific/worldly reality.`;
            } else {
                systemPrompt = `You are the OPPONENT. Argue AGAINST: "${topic}".
                ${modeInstruction}
                **Strict Rules:**
                1. **Language**: RESPONSE MUST BE IN HINDI.
                2. **Format**: Short Bullet Points.`;
            }
        }

        // history for Gemini (Needs specific format)
        // Gemini doesn't use standard OpenAI message format exactly in the simple generateContent, 
        // but let's use a simple prompt construction for maximum compatibility across providers.
        const fullPrompt = `${systemPrompt}\n\nCONVERSATION HISTORY:\n${messages.map((m: any) => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}\n\n${turn.toUpperCase()}: (Your response)`;

        console.log(`[API] Processing turn for: ${turn}, Topic: ${topic}`);

        // STRATEGY: Gemini -> Groq -> Ollama

        // 1. Try GEMINI (Free, High Limits, Cloud)
        try {
            console.log('[API] Attempting Gemini...');
            // Broad list of potential model names to try
            const modelNames = [
                "gemini-2.5-flash-lite",
                "gemini-2.5-flash-preview-09-2025",
                "gemini-3-flash-preview",
                "gemini-pro-latest",
                "gemini-1.5-flash-latest"
            ];

            let text = "";
            let geminiSuccess = false;

            for (const modelName of modelNames) {
                try {
                    // console.log(`[API] Trying Gemini Model: ${modelName}`);
                    const model = genAI.getGenerativeModel({ model: modelName });
                    const result = await model.generateContent(fullPrompt);
                    const response = await result.response;
                    text = response.text();
                    geminiSuccess = true;
                    console.log(`[API] Served via Gemini (${modelName})`);
                    break; // Success! Exit loop
                } catch (e: any) {
                    // console.warn(`[API] Gemini ${modelName} failed`);
                    // Continue to next model
                }
            }

            if (!geminiSuccess) throw new Error("All Gemini models failed (404/Error)");

            return NextResponse.json({
                content: text,
                isConclusion: isConclusion
            });
        } catch (geminiError: any) {
            console.warn('[API] Gemini All Models failed. Falling back to Groq...', geminiError.message);

            // 2. Try GROQ (Fast, Cloud, Rate Limited)
            try {
                console.log('[API] Attempting Groq...');
                const conversation = [
                    { role: "system", content: systemPrompt },
                    ...messages.map((m: any) => ({ role: "user", content: `${m.role.toUpperCase()}: ${m.content}` })),
                    { role: "user", content: `${turn.toUpperCase()}:` }
                ];
                const completion = await groq.chat.completions.create({
                    model: "llama-3.3-70b-versatile",
                    messages: conversation as any,
                    temperature: 0.7,
                    max_tokens: 1024,
                });
                const text = completion.choices[0]?.message?.content || "";
                console.log('[API] Served via Groq');
                return NextResponse.json({ content: text });
            } catch (groqError: any) {
                console.warn('[API] Groq failed:', groqError.message);

                // 3. Try OLLAMA (Local, Offline, Hardware Dependent)
                try {
                    console.log('[API] Attempting Local Ollama...');
                    // Use a smaller model if possible, or fallback to mistral
                    const completion = await ollama.chat.completions.create({
                        model: "mistral",
                        messages: [{ role: "user", content: fullPrompt }], // Simple prompt for Ollama reliability
                        temperature: 0.7,
                        max_tokens: 1024,
                    });
                    const text = completion.choices[0]?.message?.content || "";
                    console.log('[API] Served via Local Ollama');
                    return NextResponse.json({ content: text });
                } catch (ollamaError: any) {
                    throw new Error(`ALL Providers failed. Gemini: ${geminiError.message}. Groq: ${groqError.message}. Ollama: ${ollamaError.message}`);
                }
            }
        }

    } catch (error: any) {
        console.error('Error in chat API:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate response', details: error.toString() },
            { status: 500 }
        );
    }
}
