'use client';

import { motion, AnimatePresence } from 'motion/react';
import { Trophy, ExternalLink, Calendar, Ticket } from 'lucide-react';

const WINNERS = [
    {
        id: 1,
        wallet: "8xK4...9nPq",
        prize: "Bored Ape #7821",
        prizeValue: "85 SOL",
        date: "Jan 26, 2024",
        txHash: "5kX9...mN3r",
        avatar: "🦍"
    },
    {
        id: 2,
        wallet: "3mRt...7vKs",
        prize: "100 SOL Jackpot",
        prizeValue: "100 SOL",
        date: "Jan 25, 2024",
        txHash: "8nL2...pQ4w",
        avatar: "💰"
    },
    {
        id: 3,
        wallet: "9pLw...2xBn",
        prize: "DeGods #1337",
        prizeValue: "45 SOL",
        date: "Jan 24, 2024",
        txHash: "2vM8...kR7t",
        avatar: "👻"
    },
    {
        id: 4,
        wallet: "5kNr...8mTx",
        prize: "Mad Lads #666",
        prizeValue: "32 SOL",
        date: "Jan 23, 2024",
        txHash: "7wP3...nS9q",
        avatar: "😈"
    }
];

export default function WinnersSection() {
    return (
        <section id="winners" className="scroll-mt-20">
            {/* Header */}
            <div className="bg-black py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="flex items-center gap-3 sm:gap-4 mb-4"
                    >
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-orange-500 flex items-center justify-center shrink-0">
                            <Trophy size={32} className="text-white" />
                        </div>
                        <h2 className="text-4xl sm:text-5xl md:text-7xl font-black uppercase tracking-tighter text-white">
                            Winners
                        </h2>
                    </motion.div>
                    <p className="text-white/60 text-base sm:text-lg max-w-2xl font-serif">
                        All winners are selected using verifiable on-chain randomness. Every draw is transparent and can be verified on the Solana blockchain.
                    </p>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8 bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                        {[
                            { label: "Total Winners", value: "12,847" },
                            { label: "Total Paid Out", value: "700K+ SOL" },
                            { label: "This Week", value: "234" },
                            { label: "Avg. Win Value", value: "54.5 SOL" }
                        ].map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="text-center p-3 sm:p-4"
                            >
                                <p className="text-2xl sm:text-3xl md:text-4xl font-black text-black">{stat.value}</p>
                                <p className="text-gray-500 font-bold uppercase text-[10px] sm:text-xs tracking-wider mt-1">{stat.label}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Winners List */}
            <div className="pt-8 sm:pt-12 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8 bg-offwhite">
                <div className="max-w-7xl mx-auto">
                    <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight mb-6 sm:mb-8">Recent Winners</h3>

                    <div className="space-y-3 sm:space-y-4">
                        {WINNERS.map((winner, index) => (
                            <motion.div
                                key={winner.id}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ scale: 1.01, x: 5 }}
                                className="bg-white p-4 sm:p-6 border-2 border-gray-100 hover:border-orange-500 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4"
                            >
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-orange-100 flex items-center justify-center text-2xl sm:text-3xl shrink-0">
                                        {winner.avatar}
                                    </div>
                                    <div>
                                        <p className="font-black text-base sm:text-lg">{winner.wallet}</p>
                                        <p className="text-gray-500 text-xs sm:text-sm flex items-center gap-1 sm:gap-2">
                                            <Calendar size={14} />
                                            {winner.date}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex-1 md:text-center">
                                    <p className="font-black text-lg sm:text-xl text-orange-500">{winner.prize}</p>
                                    <p className="text-gray-400 font-bold text-xs sm:text-sm">Worth {winner.prizeValue}</p>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                                    <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-500 font-mono">
                                        <Ticket size={16} />
                                        <span>{winner.txHash}</span>
                                    </div>
                                    <motion.a
                                        href={`https://solscan.io/tx/${winner.txHash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        className="bg-black text-white p-2 sm:p-3 hover:bg-orange-500 transition-colors shrink-0"
                                    >
                                        <ExternalLink size={18} />
                                    </motion.a>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Load More */}
                    <div className="text-center mt-8 sm:mt-12">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-black text-white px-6 sm:px-8 py-3 sm:py-4 font-black uppercase tracking-tight text-sm sm:text-base hover:bg-orange-500 transition-colors"
                        >
                            Load More Winners
                        </motion.button>
                    </div>
                </div>
            </div>
        </section>
    );
}
