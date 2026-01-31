'use client';

import { motion, AnimatePresence } from 'motion/react';
import { Trophy, ExternalLink, Calendar, Ticket } from 'lucide-react';

const WINNERS = [
    {
        id: "new-1",
        wallet: "8smU...N9mL",
        prize: "1.0 SOL Prize",
        prizeValue: "1.0 SOL",
        date: "Jan 31, 2026",
        txHash: "5G82KiYH7YrQqfCxmMMQn17gRVUxEh5KvYwxYGDCvb7grAUETfgsyy7qnnzzZ8BogML31VLRNfzzDACFdMRTgTCo",
        avatar: "💎"
    },
    {
        id: "new-2",
        wallet: "AbmE...2T8H",
        prize: "0.4 SOL Prize",
        prizeValue: "0.4 SOL",
        date: "Jan 30, 2026",
        txHash: "4GkMcPpWz6HyegxNasEAjsJgRahhta5MWKcBCXsEG2XGsEdqwZJ5X8xB3zX5FT3GDCcjhe7PbiEPby41zaPmBTVx",
        avatar: "🔥"
    },
    {
        id: "new-3",
        wallet: "D9jh...g9DT",
        prize: "0.3 SOL Prize",
        prizeValue: "0.3 SOL",
        date: "Jan 29, 2026",
        txHash: "4iUg46fYhu4zEUGzidQLVS825tBatksvvfQh3h8KorxPp3PeqtRZosfb4nuf6s4PvqyeFxaMNDrPQ6rqBocqb91r",
        avatar: "🚀"
    },
    {
        id: "new-4",
        wallet: "HWz8...hxKU",
        prize: "0.3 SOL Prize",
        prizeValue: "0.3 SOL",
        date: "Jan 28, 2026",
        txHash: "4SceudJ7R4RiFL43HkYhhQrNFxTppYxZ5GQbd6CqN5Wx8eRUXHvJT9jmLZBUqJSPoGTh7jDoKMzjPUqbHBu1iN8S",
        avatar: "⚡"
    }
];

export default function WinnersSection() {
    return (
        <section id="winners" className="scroll-mt-20">
            {/* Header */}
            <div className="bg-black pt-12 sm:pt-24 pb-24 sm:pb-32 px-4 sm:px-6 lg:px-8 relative overflow-visible">
                <div className="max-w-7xl mx-auto relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="flex items-center gap-3 sm:gap-4 mb-4"
                    >
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-orange-500 flex items-center justify-center shrink-0">
                            <Trophy size={24} className="text-white sm:hidden" />
                            <Trophy size={32} className="text-white hidden sm:block" />
                        </div>
                        <h2 className="text-4xl sm:text-5xl md:text-7xl font-black uppercase tracking-tighter text-white">
                            Winners
                        </h2>
                    </motion.div>
                    <p className="text-white/60 text-base sm:text-lg max-w-xl font-serif leading-relaxed">
                        All winners are selected using verifiable on-chain randomness. Every draw is transparent and can be verified on the Solana blockchain.
                    </p>
                </div>

                {/* Mascot - Responsive positioning */}
                <motion.div
                    className="absolute right-[-20px] sm:right-0 bottom-0 z-20 pointer-events-none"
                    initial={{ x: 100, opacity: 0, scale: 0.8 }}
                    whileInView={{ x: 0, opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{
                        duration: 0.8,
                        ease: "easeOut",
                        opacity: { duration: 0.6 },
                        scale: { duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }
                    }}
                >
                    {/* Glow effect behind mascot */}
                    <motion.div
                        className="absolute inset-0 bg-orange-500/30 blur-3xl rounded-full"
                        animate={{
                            opacity: [0.3, 0.5, 0.3],
                            scale: [1, 1.1, 1],
                        }}
                        transition={{
                            duration: 3,
                            ease: "easeInOut",
                            repeat: Infinity,
                        }}
                    />

                    <motion.img
                        src="/boneco-base.svg"
                        alt="Payroll Mascot"
                        className="relative h-[150px] sm:h-[300px] md:h-[400px] lg:h-[500px] opacity-80 sm:opacity-100 object-contain drop-shadow-2xl"
                        animate={{
                            y: [0, -7, 0],
                        }}
                        transition={{
                            duration: 3.5,
                            ease: "easeInOut",
                            repeat: Infinity,
                        }}
                    />
                </motion.div>
            </div>

            {/* Stats Summary */}
            <div className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8 bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                        {[
                            { label: "Total Paid Out", value: "60+ SOL" },
                            { label: "This Week", value: "80+" },
                            { label: "Avg. Win Value", value: "0.7 SOL" }
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
                                        <span>{winner.txHash.length > 15 ? `${winner.txHash.slice(0, 4)}...${winner.txHash.slice(-4)}` : winner.txHash}</span>
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
