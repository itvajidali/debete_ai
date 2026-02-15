import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Message } from '@/lib/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { Bot, Zap, Volume2, Square } from 'lucide-react';

interface ChatBubbleProps {
    message: Message;
    preferredVoice: SpeechSynthesisVoice | null;
}

export function ChatBubble({ message, preferredVoice }: ChatBubbleProps) {
    const isProponent = message.role === 'proponent';
    const [isPlaying, setIsPlaying] = useState(false);
    const [speech, setSpeech] = useState<SpeechSynthesisUtterance | null>(null);

    // State for Highlighting
    const [highlightIndex, setHighlightIndex] = useState(-1);
    const [spokenText, setSpokenText] = useState("");

    useEffect(() => {
        // Cleanup speech on unmount
        return () => {
            if (speech) {
                window.speechSynthesis.cancel();
            }
        };
    }, [speech]);

    useEffect(() => {
        if (!isPlaying) setHighlightIndex(-1);
    }, [isPlaying]);

    const handleSpeak = async () => {
        if (isPlaying) {
            // Stop logic
            const audio = document.getElementById(`audio-${message.id}`) as HTMLAudioElement;
            if (audio) {
                audio.pause();
                audio.currentTime = 0;
            }
            if (speech) window.speechSynthesis.cancel();

            setIsPlaying(false);
            setHighlightIndex(-1);
            return;
        }

        setIsPlaying(true);
        setSpokenText(message.content);

        // 1. Try browser TTS first (preferred for highlighting support)
        // Note: Edge TTS (Server) doesn't support word boundary events easily via simple MP3.
        // So given the user wants highlighting, we MUST use Browser TTS or a more complex player.
        // Let's stick to Browser TTS for now as it supports onboundary.

        // If user REALLY wants the high quality voice, we lose highlighting.
        // But let's try to support highlighting on browser voice first.

        const utterance = new SpeechSynthesisUtterance(message.content);
        utterance.lang = 'hi-IN';
        utterance.rate = 1.0;

        if (preferredVoice) {
            utterance.voice = preferredVoice;
            if (preferredVoice.name.includes('Google')) utterance.pitch = 0.9;
        } else {
            // Fallback Logic
            const voices = window.speechSynthesis.getVoices();
            let selectedVoice = voices.find(v => v.name.includes('Hemant') && v.lang.includes('hi'))
                || voices.find(v => v.name.includes('Male') && v.lang.includes('hi'));
            if (!selectedVoice) selectedVoice = voices.find(v => v.lang.includes('hi'));

            if (selectedVoice) {
                utterance.voice = selectedVoice;
                if (selectedVoice.name.includes('Google')) utterance.pitch = 0.8;
            }
        }

        utterance.onboundary = (event) => {
            if (event.name === 'word') {
                setHighlightIndex(event.charIndex);
            }
        };

        utterance.onend = () => {
            setIsPlaying(false);
            setHighlightIndex(-1);
        };

        utterance.onerror = (e) => {
            console.error("TTS Error", e);
            setIsPlaying(false);
        };

        setSpeech(utterance);
        window.speechSynthesis.speak(utterance);
    };

    // Helper to render highlighted text
    // Simple approach: Render plain text with the current word highlighted.
    // We switch from Markdown to this view when playing.
    const renderContent = () => {
        if (isPlaying && highlightIndex >= 0) {
            // Find the word at highlightIndex
            // logic: find next space after charIndex
            const text = message.content;
            const before = text.substring(0, highlightIndex);
            const remainder = text.substring(highlightIndex);
            const nextSpace = remainder.search(/\s/);
            const wordLength = nextSpace === -1 ? remainder.length : nextSpace;
            const word = remainder.substring(0, wordLength);
            const after = remainder.substring(wordLength);

            return (
                <div className="whitespace-pre-wrap text-zinc-300">
                    <span className="text-zinc-500">{before}</span>
                    <span className="bg-yellow-500/20 text-yellow-200 font-bold px-0.5 rounded transition-all">{word}</span>
                    <span className="text-zinc-500">{after}</span>
                </div>
            );
        }

        return (
            <div className="text-zinc-300 markdown-content text-left">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 mb-2 text-zinc-400">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1 mb-2 text-zinc-400">{children}</ol>,
                        strong: ({ children }) => <strong className="font-semibold text-zinc-100">{children}</strong>
                    }}
                >
                    {message.content}
                </ReactMarkdown>
            </div>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
                "flex w-full mb-8",
                isProponent ? "justify-start" : "justify-end"
            )}
        >
            <div className={cn(
                "flex max-w-2xl gap-4",
                isProponent ? "flex-row" : "flex-row-reverse"
            )}>
                {/* Avatar Indicator */}
                <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border",
                    isProponent
                        ? "bg-emerald-950/30 border-emerald-900 text-emerald-500"
                        : "bg-rose-950/30 border-rose-900 text-rose-500"
                )}>
                    {isProponent ? <Zap size={14} /> : <Bot size={14} />}
                </div>

                <div className={cn(
                    "flex flex-col",
                    isProponent ? "items-start" : "items-end"
                )}>
                    <div className="flex items-center gap-2 mb-2">
                        <span className={cn(
                            "text-xs font-semibold tracking-wide uppercase",
                            isProponent ? "text-emerald-500" : "text-rose-500"
                        )}>
                            {isProponent ? "Proponent" : "Opponent"}
                        </span>
                        <span className="text-zinc-600 text-[10px] font-mono">
                            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {/* Audio Button */}
                        <button
                            onClick={handleSpeak}
                            className={cn(
                                "p-1.5 rounded-md transition-all flex items-center gap-1",
                                isPlaying
                                    ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
                            )}
                            title={isPlaying ? "Stop Speaking" : "Listen (Hindi)"}
                        >
                            {isPlaying ? <Square size={14} className="fill-current" /> : <Volume2 size={14} />}
                            {isPlaying && <span className="text-[10px] font-bold">STOP</span>}
                        </button>
                    </div>

                    <div className={cn(
                        "p-5 rounded-lg border text-sm leading-relaxed shadow-sm min-w-[200px]",
                        isProponent
                            ? "bg-zinc-900/40 border-zinc-800 rounded-tl-none"
                            : "bg-zinc-900/40 border-zinc-800 rounded-tr-none text-right"
                    )}>
                        {renderContent()}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
