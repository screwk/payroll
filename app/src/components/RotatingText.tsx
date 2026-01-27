'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, Transition } from 'motion/react';

interface RotatingTextProps {
    texts: string[];
    mainClassName?: string;
    staggerFrom?: "first" | "last" | "center" | number;
    initial?: any;
    animate?: any;
    exit?: any;
    staggerDuration?: number;
    splitLevelClassName?: string;
    transition?: Transition;
    rotationInterval?: number;
}

export default function RotatingText({
    texts,
    mainClassName = "",
    staggerFrom = "last",
    initial = { y: "100%" },
    animate = { y: 0 },
    exit = { y: "-120%" },
    staggerDuration = 0.025,
    splitLevelClassName = "",
    transition = { type: "spring", damping: 30, stiffness: 400 },
    rotationInterval = 2000
}: RotatingTextProps) {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prevIndex) => (prevIndex + 1) % texts.length);
        }, rotationInterval);
        return () => clearInterval(interval);
    }, [texts, rotationInterval]);

    const getStaggerDelay = (i: number, total: number) => {
        if (staggerFrom === "first") return i * staggerDuration;
        if (staggerFrom === "last") return (total - 1 - i) * staggerDuration;
        if (staggerFrom === "center") {
            const center = Math.floor(total / 2);
            return Math.abs(center - i) * staggerDuration;
        }
        if (typeof staggerFrom === 'number') {
            return Math.abs(staggerFrom - i) * staggerDuration;
        }
        return i * staggerDuration;
    };

    return (
        <motion.span
            className={`inline-flex relative overflow-hidden ${mainClassName}`}
            layout
            transition={transition}
        >
            <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                    key={index}
                    className={`flex ${splitLevelClassName}`}
                    layout
                >
                    {texts[index].split("").map((char, i) => (
                        <motion.span
                            key={`${index}-${i}`}
                            initial={initial}
                            animate={animate}
                            exit={exit}
                            transition={{
                                ...transition,
                                delay: getStaggerDelay(i, texts[index].length)
                            }}
                            className="inline-block whitespace-pre"
                        >
                            {char}
                        </motion.span>
                    ))}
                </motion.span>
            </AnimatePresence>
        </motion.span>
    );
}
