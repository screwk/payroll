"use client";

import { motion } from 'motion/react';

const STATS = [
    { label: "Total Paid Out (SOL)", value: "700k+", icon: "$$" },
    { label: "Payout Speed", value: "Instant", icon: "24h" },
    { label: "Verified Transactions", value: "150k", icon: "Tx" },
];

export default function Stats() {
    return (
        <section className="bg-white py-24 px-4 sm:px-6 lg:px-8 border-t border-gray-100">
            <div className="max-w-7xl mx-auto">
                <p className="text-center font-bold text-gray-500 uppercase tracking-widest mb-16 text-sm">
                    Trusted by standard <span className="text-black">Solana Protocol</span>
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-10 md:gap-12 text-center">
                    {STATS.map((stat, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.2, type: "spring" }}
                            className="p-6 sm:p-8 border-b sm:border-b-0 md:border-r border-gray-100 last:border-0 hover:bg-gray-50 transition-colors cursor-default"
                        >
                            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 text-orange-600 font-bold text-lg sm:text-xl">
                                {stat.icon}
                            </div>
                            <h3 className="text-4xl sm:text-5xl md:text-6xl font-black mb-2 text-black tracking-tighter">{stat.value}</h3>
                            <p className="font-bold text-gray-400 uppercase tracking-wider text-xs sm:text-sm">{stat.label}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
