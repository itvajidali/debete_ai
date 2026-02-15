'use client';

import { useState, useRef, useEffect } from 'react';
import { DebateSetup } from '@/components/debate-setup';
import { ChatBubble } from '@/components/chat-bubble';
import { TypingIndicator } from '@/components/typing-indicator';
import { VoiceSelector } from '@/components/voice-selector';
import { Play, Pause, RotateCcw, MessageSquare } from 'lucide-react';
import { Message, Role } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function Home() {
  const [topic, setTopic] = useState('');
  const [isDebating, setIsDebating] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [turn, setTurn] = useState<Role>('proponent');
  const [isThinking, setIsThinking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Audio State
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [error, setError] = useState<string | null>(null);

  const startDebate = (newTopic: string) => {
    setTopic(newTopic);
    setIsDebating(true);
    setMessages([]);
    setTurn('proponent');
    setIsPaused(false);
    setError(null);
    processTurn('proponent', [], newTopic);
  };

  const processTurn = async (currentTurn: Role, history: Message[], currentTopic: string) => {
    setIsThinking(true);
    setError(null);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: currentTopic,
          messages: history,
          turn: currentTurn,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Network response was not ok');
      }

      const data = await response.json();

      const newMessage: Message = {
        id: crypto.randomUUID(),
        role: currentTurn,
        content: data.content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, newMessage]);

      // NEW: Stop the loop if the API signals conclusion
      if (data.isConclusion) {
        setIsPaused(true); // Stop the auto-timer
      } else {
        setTurn(currentTurn === 'proponent' ? 'opponent' : 'proponent');
      }

    } catch (err: any) {
      console.error('Error processing turn:', err);
      setError(err.message || "Something went wrong. Is Ollama running?");
      setIsPaused(true); // Pause on error
    } finally {
      setIsThinking(false);
    }
  };

  useEffect(() => {
    if (isDebating && !isPaused && !isThinking && messages.length > 0) {
      const timer = setTimeout(() => {
        processTurn(turn, messages, topic);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [messages, isPaused, isThinking, isDebating, turn, topic]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  if (!isDebating) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col pt-20">
        <DebateSetup onStart={startDebate} />
      </main>
    );
  }

  return (
    <main className="flex flex-col h-screen bg-zinc-950 text-zinc-200 overflow-hidden">

      {/* Minimal Header */}
      <header className="h-14 border-b border-zinc-900 flex items-center justify-between px-6 bg-zinc-950/80 backdrop-blur-sm z-20">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-950">
            <MessageSquare size={14} className="fill-current" />
          </div>
          <span className="font-semibold text-sm tracking-tight">{topic}</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Voice Selector */}
          <VoiceSelector
            selectedVoice={selectedVoice}
            onVoiceChange={setSelectedVoice}
          />

          <div className="w-px h-4 bg-zinc-800" />

          <div className="flex items-center gap-4 text-xs font-medium">
            {/* ... Turn Indicators ... */}
            <div className={cn(
              "flex items-center gap-2 transition-opacity duration-300",
              turn === 'proponent' ? "opacity-100" : "opacity-30"
            )}>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-500">Proponent</span>
            </div>
            <div className="w-px h-4 bg-zinc-800" />
            <div className={cn(
              "flex items-center gap-2 transition-opacity duration-300",
              turn === 'opponent' ? "opacity-100" : "opacity-30"
            )}>
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-rose-500">Opponent</span>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-0 scroll-smooth">
        <div className="max-w-3xl mx-auto py-12 px-6">
          {messages.map((msg) => (
            <ChatBubble
              key={msg.id}
              message={msg}
              preferredVoice={selectedVoice}
            />
          ))}

          {error && (
            <div className="flex w-full mb-8 justify-center animate-pulse">
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-red-900/50 bg-red-950/30 text-red-400 text-sm">
                <span>⚠️ Error: {error}</span>
                <button onClick={() => processTurn(turn, messages, topic)} className="underline hover:text-red-300 ml-2 font-bold">Retry</button>
              </div>
            </div>
          )}

          {isThinking && (
            <div className={`flex w-full mb-8 ${turn === 'proponent' ? 'justify-start' : 'justify-end'}`}>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-800 bg-zinc-900/50 text-zinc-500 text-xs">
                <TypingIndicator />
                <span>Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-12" />
        </div>
      </div>

      {/* Floating Controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-xl shadow-2xl z-30">
        <button
          onClick={() => setIsPaused(!isPaused)}
          className="p-3 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-300"
          title={isPaused ? "Resume" : "Pause"}
        >
          {isPaused ? <Play size={20} className="fill-current" /> : <Pause size={20} className="fill-current" />}
        </button>

        <div className="w-px h-6 bg-zinc-800" />

        <button
          onClick={() => setIsDebating(false)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-red-950/30 hover:text-red-400 transition-colors text-zinc-400 text-sm font-medium"
        >
          <RotateCcw size={16} />
          <span>End</span>
        </button>
      </div>
    </main>
  );
}
