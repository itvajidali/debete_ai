import { useState, useEffect } from 'react';
import { Settings2, Volume2 } from 'lucide-react';

interface VoiceSelectorProps {
    selectedVoice: SpeechSynthesisVoice | null;
    onVoiceChange: (voice: SpeechSynthesisVoice) => void;
}

export function VoiceSelector({ selectedVoice, onVoiceChange }: VoiceSelectorProps) {
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const loadVoices = () => {
            const all = window.speechSynthesis.getVoices();
            // Filter for Hindi or relevant voices
            const hindi = all.filter(v => v.lang.includes('hi') || v.name.includes('Hindi') || v.name.includes('India'));
            setVoices(hindi);

            // Auto-select first if none selected
            if (!selectedVoice && hindi.length > 0) {
                onVoiceChange(hindi[0]);
            }
        };

        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }, [selectedVoice, onVoiceChange]);

    if (voices.length === 0) return null;

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-zinc-200 text-xs font-medium transition-colors"
            >
                <Settings2 size={14} />
                <span>{selectedVoice?.name.split(' ')[0] || "Select Voice"}</span>
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 max-h-60 overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-50 p-1">
                    <div className="px-2 py-1.5 text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                        Available Hindi Voices
                    </div>
                    {voices.map((voice) => (
                        <button
                            key={voice.name}
                            onClick={() => {
                                onVoiceChange(voice);
                                setIsOpen(false);
                            }}
                            className={`w-full text-left px-2 py-2 text-xs rounded-md flex items-center justify-between group ${selectedVoice?.name === voice.name
                                    ? 'bg-zinc-800 text-emerald-400'
                                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                                }`}
                        >
                            <span className="truncate">{voice.name}</span>
                            {selectedVoice?.name === voice.name && <Volume2 size={12} />}
                        </button>
                    ))}
                    <div className="px-2 py-2 text-[10px] text-zinc-600 border-t border-zinc-800 mt-1">
                        Tip: "Microsoft Online" or "Google" voices are best.
                    </div>
                </div>
            )}
        </div>
    );
}
