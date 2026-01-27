'use client';

import { useState, useMemo } from 'react';
import { ArrowRight, Clock, Users, Flame, AlertCircle, Sparkles, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RaffleDisplay } from '@/types/payroll';
import RaffleFilter from './RaffleFilter';
import Link from 'next/link';

interface BentoGridProps {
    raffles: RaffleDisplay[];
    filter: string;
    setFilter: (filter: any) => void;
}

export default function BentoGrid({ raffles, filter, setFilter }: BentoGridProps) {
    const activeRaffles = raffles.filter(r => !r.isDrawn);

    const filteredRaffles = useMemo(() => {
        return activeRaffles.filter((raffle) => {
            const isEnded = raffle.endTime.getTime() < Date.now();
            switch (filter) {
                case "official":
                    return !raffle.raffleType || raffle.raffleType === "official";
                case "community":
                    return raffle.raffleType === "community";
                case "live":
                    return !isEnded;
                case "free":
                    return raffle.isFree && !isEnded;
                case "ended":
                    return isEnded;
                default:
                    return true;
            }
        });
    }, [activeRaffles, filter]);

    const counts = useMemo(() => {
        return {
            all: activeRaffles.length,
            official: activeRaffles.filter(r => !r.raffleType || r.raffleType === "official").length,
            community: activeRaffles.filter(r => r.raffleType === "community").length,
            live: activeRaffles.filter(r => r.endTime.getTime() > Date.now()).length,
            free: activeRaffles.filter(r => r.isFree && r.endTime.getTime() > Date.now()).length,
            ended: activeRaffles.filter(r => r.endTime.getTime() < Date.now()).length,
        };
    }, [activeRaffles]);

    return (
        <section id="raffles" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-offwhite">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-6 sm:mb-8 text-center sm:text-left">
                    <div>
                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-gray-500 font-bold uppercase tracking-widest text-xs sm:text-sm mb-2"
                        >
                            Select a Pool - Buy Tickets - Win
                        </motion.p>
                        <h2 className="text-4xl sm:text-5xl md:text-7xl font-black uppercase tracking-tighter text-black">
                            Active <span className="text-orange-500">Raffles</span>
                        </h2>
                    </div>
                </div>

                {/* Filter */}
                <div className="mb-8 sm:mb-10 flex justify-center">
                    <RaffleFilter
                        activeFilter={filter}
                        onFilterChange={setFilter}
                        counts={counts}
                    />
                </div>

                {/* Raffles Grid */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={filter}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 auto-rows-auto"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {filteredRaffles.length > 0 ? (
                            filteredRaffles.map((raffle, index) => (
                                <RaffleCard key={raffle.id} raffle={raffle} index={index} />
                            ))
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="col-span-full py-16 text-center"
                            >
                                <p className="text-gray-400 font-bold uppercase tracking-wide">
                                    No raffles found in this category
                                </p>
                            </motion.div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </section>
    );
}

// Separate RaffleCard component
function RaffleCard({ raffle, index }: { raffle: RaffleDisplay; index: number }) {
    const percentSold = (raffle.participantCount / raffle.maxTickets) * 100;
    const isHot = percentSold > 80;
    const isEnded = raffle.endTime.getTime() < Date.now();

    // Formatting time remaining
    const getTimeRemaining = () => {
        if (isEnded) return 'Ended';
        const diff = raffle.endTime.getTime() - Date.now();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours > 0) {
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            return `${hours}H ${minutes}M`;
        }
        const minutes = Math.floor(diff / (1000 * 60));
        return `${minutes}M`;
    };

    const isOfficial = !raffle.raffleType || raffle.raffleType === 'official';
    const colorClass = isOfficial ? 'bg-orange-500 text-white' : 'bg-white text-black border-2 border-gray-100';

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, type: "spring", damping: 20 }}
            whileHover={{ scale: 1.02, y: -5 }}
            className={`p-5 sm:p-8 relative group overflow-hidden flex flex-col justify-between rounded-xl ${colorClass} ${isEnded ? 'opacity-70' : ''}`}
        >
            {/* Badges */}
            <div className="absolute top-0 right-0 p-3 sm:p-4 flex flex-col items-end gap-1.5">
                <div className="flex gap-1.5 flex-wrap justify-end">
                    {isOfficial && !isEnded && (
                        <div className="bg-yellow-400 text-black px-2 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1">
                            <Sparkles size={12} />
                            <span>Official</span>
                        </div>
                    )}
                    {raffle.isFree && !isEnded && (
                        <div className="bg-green-500 text-white px-2 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1">
                            <Gift size={12} />
                            <span>Free</span>
                        </div>
                    )}
                    {isHot && !isEnded && (
                        <div className="bg-red-500 text-white px-2 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 animate-pulse">
                            <Flame size={12} fill="currentColor" />
                            <span>HOT</span>
                        </div>
                    )}
                </div>
                <div className={`backdrop-blur-md px-2 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 whitespace-nowrap ${isEnded ? 'bg-black/50 text-white' : 'bg-white/10'}`}>
                    <Clock size={12} />
                    {getTimeRemaining()}
                </div>
            </div>

            {/* Content */}
            <div className="mt-10 sm:mt-8 relative z-10">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase opacity-60 px-2 py-0.5 bg-black/10 rounded">
                        {isOfficial ? 'Premium' : 'Community'}
                    </span>
                </div>
                <h3 className="font-black uppercase tracking-tight leading-none mb-3 sm:mb-4 text-2xl sm:text-3xl">
                    {raffle.prizeAmount} SOL
                </h3>

                {/* Progress Bar Section */}
                <div className="mt-4 sm:mt-6">
                    <div className="flex justify-between text-[10px] font-bold uppercase mb-2 opacity-80">
                        <span className="flex items-center gap-1">
                            <Users size={14} /> Spots Sold
                        </span>
                        <span>{raffle.participantCount} / {raffle.maxTickets} ({Math.round(percentSold)}%)</span>
                    </div>
                    <div className="w-full h-2 sm:h-3 bg-black/10 rounded-full overflow-hidden">
                        <motion.div
                            className={`h-full ${isEnded ? 'bg-gray-500' : isOfficial ? '!bg-white' : isHot ? 'bg-red-500' : 'bg-orange-500'}`}
                            initial={{ width: 0 }}
                            whileInView={{ width: `${percentSold}%` }}
                            transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                        />
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-6 sm:mt-8 flex justify-between items-end relative z-10">
                <div>
                    <p className="text-[10px] font-bold uppercase opacity-60 mb-1">Entry Price</p>
                    <p className="font-black text-xl sm:text-2xl">
                        {raffle.isFree ? 'FREE' : `${raffle.ticketPrice} SOL`}
                    </p>
                </div>
                <Link href={`/raffle/${raffle.id}`}>
                    <motion.button
                        whileHover={{ scale: isEnded ? 1 : 1.1 }}
                        whileTap={{ scale: isEnded ? 1 : 0.9 }}
                        className={`px-4 sm:px-6 py-2 sm:py-3 font-bold uppercase text-xs sm:text-sm rounded-full transition-colors flex items-center gap-2 ${isEnded
                            ? 'bg-gray-600 text-white cursor-default'
                            : isOfficial
                                ? 'bg-white text-black hover:bg-black hover:text-white'
                                : 'bg-black text-white hover:bg-orange-500'
                            }`}
                    >
                        {isEnded ? 'View Results' : 'Buy Ticket'}
                    </motion.button>
                </Link>
            </div>
        </motion.div>
    );
}
