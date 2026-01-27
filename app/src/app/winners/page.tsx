"use client";

import Link from "next/link";

// Mock winners data
const MOCK_WINNERS = [
    { id: "4", prize: 10, winner: "7nYz...4kPq", date: "2024-01-20", ticketNumber: 145 },
    { id: "5", prize: 25, winner: "9aBc...3R4S", date: "2024-01-18", ticketNumber: 89 },
    { id: "6", prize: 50, winner: "HjKL...8Z9A", date: "2024-01-15", ticketNumber: 234 },
];

export default function WinnersPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <main className="pt-24 pb-16 px-4">
                <div className="max-w-4xl mx-auto">
                    {/* Back Link */}
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-gray-500 hover:text-orange transition-colors mb-8 group"
                    >
                        <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span className="font-display text-sm uppercase tracking-wider">Back to Raffles</span>
                    </Link>

                    {/* Page Header */}
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange/10 border border-orange/20 mb-4">
                            <svg className="w-8 h-8 text-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                        </div>
                        <h1 className="font-display font-bold text-4xl text-gray-800 mb-2">Winners</h1>
                        <p className="text-gray-500">Recent raffle winners and prize payouts</p>
                    </div>

                    {/* Winners List */}
                    <div className="space-y-4">
                        {MOCK_WINNERS.map((winner) => (
                            <div
                                key={winner.id}
                                className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex items-center gap-6"
                            >
                                {/* Trophy Icon */}
                                <div className="flex-shrink-0 w-14 h-14 rounded-full bg-gradient-to-br from-gold to-amber flex items-center justify-center">
                                    <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                                    </svg>
                                </div>

                                {/* Winner Info */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-mono text-sm text-gray-800">{winner.winner}</span>
                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-display rounded-full">
                                            Verified
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        Raffle #{winner.id} • Ticket #{winner.ticketNumber} • {winner.date}
                                    </p>
                                </div>

                                {/* Prize Amount */}
                                <div className="text-right">
                                    <p className="font-display font-bold text-2xl text-orange">{winner.prize}</p>
                                    <p className="text-xs text-gray-400 uppercase tracking-wider">SOL Won</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
