'use client';

import { motion } from 'motion/react';

const RAFFLE_FILTERS = [
    { id: 'all', label: 'All Raffles', icon: '🎰' },
    { id: 'official', label: 'Official', icon: '✨' },
    { id: 'community', label: 'Community', icon: '👥' },
    { id: 'live', label: 'Live Now', icon: '🟢' },
    { id: 'free', label: 'Free Entry', icon: '🎟️' },
    { id: 'ended', label: 'Ended', icon: '🏁' },
];

interface RaffleFilterProps {
    activeFilter: string;
    onFilterChange: (filter: any) => void;
    counts?: Record<string, number>;
}

export default function RaffleFilter({ activeFilter, onFilterChange, counts }: RaffleFilterProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
        >
            <div className="overflow-x-auto pb-4 -mb-4 scrollbar-hide">
                <div className="inline-flex items-center gap-1 sm:gap-2 p-1.5 sm:p-2 bg-white rounded-full shadow-lg border border-gray-100">
                    {RAFFLE_FILTERS.map((filter) => {
                        const isActive = activeFilter === filter.id;
                        const count = counts?.[filter.id];

                        return (
                            <button
                                key={filter.id}
                                onClick={() => onFilterChange(filter.id)}
                                className={`
                                    px-4 sm:px-6 py-2.5 sm:py-3 rounded-full font-bold text-xs sm:text-sm uppercase tracking-wide
                                    transition-all duration-200 whitespace-nowrap flex items-center gap-1.5 sm:gap-2
                                    ${isActive
                                        ? 'bg-black text-white'
                                        : 'text-gray-500 hover:text-black hover:bg-gray-50'
                                    }
                                `}
                            >
                                {filter.icon && (
                                    <span className="text-sm sm:text-base">{filter.icon}</span>
                                )}
                                <span>{filter.label}</span>
                                {count !== undefined && count > 0 && (
                                    <span className={`
                                        ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold
                                        ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}
                                    `}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
}
