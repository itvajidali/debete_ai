import { motion } from 'framer-motion';

export function TypingIndicator() {
    return (
        <div className="flex items-center gap-2 px-4 py-2">
            <span className="text-xs font-bold tracking-widest text-indigo-300 uppercase animate-pulse mr-2">
                Analyzing
            </span>
            <div className="flex space-x-1">
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        className="w-2 h-2 bg-indigo-400 rounded-full"
                        animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.3, 1, 0.3],
                            boxShadow: [
                                "0 0 0px rgba(129, 140, 248, 0)",
                                "0 0 10px rgba(129, 140, 248, 0.5)",
                                "0 0 0px rgba(129, 140, 248, 0)"
                            ]
                        }}
                        transition={{
                            duration: 1,
                            repeat: Infinity,
                            delay: i * 0.2,
                            ease: "easeInOut"
                        }}
                    />
                ))}
            </div>
        </div>
    );
}
