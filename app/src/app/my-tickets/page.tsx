"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

import { getUserEntries } from "@/lib/raffleStorage";
import { formatTimeRemaining, shortenAddress } from "@/types/payroll";

interface UserEntry {
  wallet: string;
  raffleId: string;
  tickets: number;
  amountPaid: number;
  isFree: boolean;
  txSignature: string | null;
  enteredAt: string;
  status: string;
  rafflePrize: number;
  raffleEndTime: string;
  isWinner: boolean;
  raffleIsDrawn: boolean;
}

export default function MyTicketsPage() {
  const { publicKey, connected } = useWallet();
  const [entries, setEntries] = useState<UserEntry[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "won" | "lost">("all");

  const loadEntries = useCallback(async () => {
    if (!publicKey) {
      setEntries([]);
      return;
    }

    // Get user entries
    const rawEntries = await getUserEntries(publicKey.toString());

    // Map to UserEntry interface
    const mappedEntries: UserEntry[] = rawEntries.map(entry => {
      const raffle = entry.raffle;
      return {
        wallet: entry.wallet,
        raffleId: entry.raffleId,
        tickets: entry.quantity,
        amountPaid: raffle ? raffle.ticketPrice * entry.quantity : 0,
        isFree: raffle ? raffle.ticketPrice === 0 : false,
        txSignature: entry.txSignature,
        enteredAt: entry.createdAt,
        status: raffle ? raffle.status : 'unknown',
        rafflePrize: raffle ? raffle.prizeAmount : 0,
        raffleEndTime: raffle ? raffle.endTime : new Date().toISOString(),
        isWinner: raffle ? raffle.winnerWallet === entry.wallet : false,
        raffleIsDrawn: raffle ? raffle.status !== 'active' && raffle.status !== 'waiting_deposit' : false,
      };
    });

    setEntries(mappedEntries);
  }, [publicKey]);

  useEffect(() => {
    loadEntries();

    // Refresh periodically
    const interval = setInterval(loadEntries, 15000); // Every 15 seconds

    return () => {
      clearInterval(interval);
    };
  }, [loadEntries]);

  const filteredEntries = entries.filter((entry) => {
    // A raffle is finished if it's been drawn, regardless of end time
    const isFinished = entry.raffleIsDrawn;

    switch (filter) {
      case "active":
        return !isFinished; // Only truly active if not drawn yet
      case "won":
        return entry.isWinner;
      case "lost":
        return isFinished && !entry.isWinner;
      default:
        return true;
    }
  });

  const stats = {
    totalEntries: entries.length,
    totalSpent: entries.reduce((sum, e) => sum + e.amountPaid, 0),
    totalWins: entries.filter(e => e.isWinner).length,
    totalWinnings: entries.filter(e => e.isWinner).reduce((sum, e) => sum + e.rafflePrize, 0),
  };

  return (
    <div className="min-h-screen">


      <main className="relative pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 className="font-display font-bold text-4xl text-gray-900 mb-4">
              My Tickets
            </h1>
            <p className="text-gray-600">
              View all your raffle entries and winnings
            </p>
          </div>

          {!connected ? (
            <div className="text-center p-12 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-xl">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <h2 className="font-display font-bold text-xl text-gray-900 mb-4">
                Connect Your Wallet
              </h2>
              <p className="text-gray-600 mb-6">
                Connect your wallet to view your tickets
              </p>
              <WalletMultiButton />
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 text-center">
                  <p className="text-3xl font-bold text-orange">{stats.totalEntries}</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Total Entries</p>
                </div>
                <div className="p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 text-center">
                  <p className="text-3xl font-bold text-gray-900">{stats.totalSpent.toFixed(2)}</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">SOL Spent</p>
                </div>
                <div className="p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-emerald-200 bg-emerald-50/50 text-center">
                  <p className="text-3xl font-bold text-emerald-600">{stats.totalWins}</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Wins</p>
                </div>
                <div className="p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-emerald-200 bg-emerald-50/50 text-center">
                  <p className="text-3xl font-bold text-emerald-600">{stats.totalWinnings.toFixed(2)}</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">SOL Won</p>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-2 p-1 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 mb-8">
                {[
                  { key: "all", label: "All Entries" },
                  { key: "active", label: "Active" },
                  { key: "won", label: "Won", highlight: true },
                  { key: "lost", label: "Lost" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key as typeof filter)}
                    className={`
                      flex-1 px-4 py-3 rounded-lg font-display text-sm transition-all duration-200
                      ${filter === tab.key
                        ? tab.highlight
                          ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg"
                          : "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      }
                    `}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Entries List */}
              {filteredEntries.length > 0 ? (
                <div className="space-y-4">
                  {filteredEntries.map((entry, index) => {
                    // Check if the raffle is finished (drawn or time ended)
                    const isDrawn = entry.raffleIsDrawn;
                    const isTimeEnded = new Date(entry.raffleEndTime) < new Date();
                    const isFinished = isDrawn; // A raffle is finished when it's drawn
                    const timeLeft = isFinished
                      ? (entry.isWinner ? "WON!" : "LOST")
                      : isTimeEnded
                        ? "Drawing..."
                        : formatTimeRemaining(new Date(entry.raffleEndTime));

                    return (
                      <Link
                        key={`${entry.raffleId}-${index}`}
                        href={`/raffle/${entry.raffleId}`}
                      >
                        <div className={`
                          p-6 rounded-2xl border transition-all duration-200 hover:scale-[1.01] cursor-pointer
                          ${entry.isWinner
                            ? "bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-300 shadow-lg shadow-emerald-100"
                            : isFinished && !entry.isWinner
                              ? "bg-gray-50 border-gray-200"
                              : "bg-white/90 border-gray-200 hover:border-orange/40 hover:shadow-lg"
                          }
                        `}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              {/* Status Badge */}
                              <div className={`
                                w-12 h-12 rounded-xl flex items-center justify-center
                                ${entry.isWinner
                                  ? "bg-emerald-500 text-white"
                                  : isFinished
                                    ? "bg-gray-300 text-gray-600"
                                    : "bg-orange/10 text-orange"
                                }
                              `}>
                                {entry.isWinner ? (
                                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                  </svg>
                                ) : (
                                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                                  </svg>
                                )}
                              </div>

                              {/* Info */}
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-display font-bold text-xl text-gray-900">
                                    {entry.rafflePrize} SOL
                                  </span>
                                  {entry.isWinner && (
                                    <span className="px-2 py-0.5 bg-emerald-500 text-white text-xs font-bold rounded-full uppercase">
                                      Winner!
                                    </span>
                                  )}
                                  {entry.isFree && (
                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                                      Free
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                  <span>{entry.tickets} ticket{entry.tickets > 1 ? 's' : ''}</span>
                                  <span>•</span>
                                  <span>{entry.isFree ? 'Free entry' : `${entry.amountPaid} SOL`}</span>
                                  <span>•</span>
                                  <span>{new Date(entry.enteredAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>

                            {/* Right side */}
                            <div className="text-right">
                              <div className={`
                                px-3 py-1 rounded-full text-xs font-semibold
                                ${isFinished
                                  ? entry.isWinner
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-red-100 text-red-600"
                                  : isTimeEnded
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-orange/10 text-orange"
                                }
                              `}>
                                {timeLeft}
                              </div>
                              {entry.txSignature && (
                                <p className="text-xs text-gray-400 mt-2 font-mono">
                                  tx: {entry.txSignature.slice(0, 8)}...
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Winner celebration */}
                          {entry.isWinner && (
                            <div className="mt-4 pt-4 border-t border-emerald-200">
                              <div className="flex items-center justify-between">
                                <p className="text-emerald-700 font-semibold">
                                  Congratulations! You won {entry.rafflePrize} SOL!
                                </p>
                                <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 transition-colors">
                                  Claim Prize
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Lost indicator */}
                          {isFinished && !entry.isWinner && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <p className="text-gray-500 text-sm text-center">
                                This raffle has ended. Better luck next time!
                              </p>
                            </div>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                  </div>
                  <h3 className="font-display font-bold text-xl text-gray-900 mb-2">
                    {filter === "all" ? "No Tickets Yet" : `No ${filter} tickets`}
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {filter === "all"
                      ? "Enter a raffle to see your tickets here"
                      : "Try a different filter"
                    }
                  </p>
                  {filter === "all" && (
                    <Link
                      href="/"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                      </svg>
                      View Raffles
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
