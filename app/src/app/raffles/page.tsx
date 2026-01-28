"use client";

import { useState, useEffect, useCallback } from "react";
import { sortRafflesByPrize } from "@/lib/raffleEngine";
import { getRafflesForDisplay } from "@/lib/raffleStorage";
import BentoGrid from "@/components/BentoGrid";
import PageTransition from "@/components/PageTransition";
import { RaffleDisplay } from "@/types/payroll";
import { motion } from "motion/react";

export default function RafflesPage() {
    const [filter, setFilter] = useState<"all" | "official" | "community" | "live" | "free" | "ended">("all");
    const [raffles, setRaffles] = useState<RaffleDisplay[]>([]);

    // Load raffles from storage
    const loadRaffles = useCallback(async () => {
        const storedRaffles = await getRafflesForDisplay();
        setRaffles(sortRafflesByPrize(storedRaffles));
    }, []);

    useEffect(() => {
        loadRaffles();
        const interval = setInterval(loadRaffles, 15000); // Polling every 15s
        return () => clearInterval(interval);
    }, [loadRaffles]);

    return (
        <PageTransition>
            <div className="min-h-screen pt-24 bg-offwhite">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-orange-500 rounded-2xl p-8 sm:p-12 text-white relative overflow-hidden"
                    >
                        {/* Decoration */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full -mr-32 -mt-32" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 blur-2xl rounded-full -ml-24 -mb-24" />

                        <div className="relative z-10">
                            <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter mb-4">
                                All <span className="text-black">Raffles</span>
                            </h1>
                            <p className="text-white/80 max-w-xl font-serif text-lg">
                                Browse all active and past raffles. Enter for a chance to win exclusive NFTs and SOL prizes with verifiable on-chain randomness.
                            </p>
                        </div>
                    </motion.div>
                </div>

                <BentoGrid raffles={raffles} filter={filter} setFilter={setFilter} />

                <footer className="bg-[#111] text-white py-12 px-4 mt-20">
                    <div className="max-w-7xl mx-auto text-center">
                        <img src="/logo.svg" alt="PAYROLL" className="h-8 w-auto mx-auto mb-6 opacity-50" />
                        <p className="text-gray-500 text-xs text-sans">
                            © 2025 PAYROLL Platform. All rights reserved.
                        </p>
                    </div>
                </footer>
            </div>
        </PageTransition>
    );
}
