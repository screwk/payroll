'use client';

import { motion } from 'motion/react';

interface MarqueeProps {
    items: string[];
    speed?: number;
    className?: string;
}

export default function Marquee({ items, speed = 40, className = "" }: MarqueeProps) {
    return (
        <div className={`bg-black py-4 overflow-hidden whitespace-nowrap relative z-20 border-y border-white/10 ${className}`}>
            <motion.div
                className="inline-flex items-center gap-12 sm:gap-24"
                animate={{ x: [0, -1000] }}
                transition={{
                    x: {
                        repeat: Infinity,
                        repeatType: "loop",
                        duration: speed,
                        ease: "linear",
                    },
                }}
            >
                {/* Double the items to ensure seamless loop */}
                {[...items, ...items, ...items, ...items].map((item, idx) => (
                    <span
                        key={idx}
                        className="text-white/40 text-sm sm:text-base font-black uppercase tracking-widest flex items-center gap-4"
                    >
                        <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                        {item}
                    </span>
                ))}
            </motion.div>
        </div>
    );
}
