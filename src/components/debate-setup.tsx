import { useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface DebateSetupProps {
    onStart: (topic: string) => void;
}

const SUGGESTIONS = [
    "Is AI conscious?",
    "Universal Basic Income",
    "Mars Colonization",
    "Remote Work vs Office"
];

export function DebateSetup({ onStart }: DebateSetupProps) {
    const [topic, setTopic] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (topic.trim()) onStart(topic);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-2xl mx-auto px-6">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full space-y-8"
            >
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-medium">
                        <Sparkles size={12} />
                        <span>AI Debate Protocol</span>
                    </div>
                    <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                        Debate AI
                    </h1>
                    <p className="text-zinc-400 text-lg">
                        Enter a topic to initiate a debate between two advanced models.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-rose-500/20 rounded-lg blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
                    <div className="relative flex items-center bg-zinc-900 border border-zinc-800 rounded-lg focus-within:ring-1 focus-within:ring-zinc-700 transition-all shadow-sm">
                        <input
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="What should they debate?"
                            className="w-full bg-transparent px-6 py-4 text-lg text-white placeholder:text-zinc-600 focus:outline-none"
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={!topic.trim()}
                            className="mr-2 p-2 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ArrowRight size={20} />
                        </button>
                    </div>
                </form>

                <div className="pt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {SUGGESTIONS.map((s) => (
                        <button
                            key={s}
                            onClick={() => onStart(s)}
                            className="px-4 py-3 text-sm font-medium text-zinc-400 bg-zinc-900/50 border border-zinc-800/50 rounded-lg hover:bg-zinc-900 hover:text-zinc-200 hover:border-zinc-700 transition-all text-center truncate"
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
