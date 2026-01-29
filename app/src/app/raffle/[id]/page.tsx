"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { RaffleDisplay, formatTimeRemaining, shortenAddress } from "@/types/payroll";
import {
  getRaffleById,
  getRaffleParticipants,
  buyTickets,
  Participant,
  StoredRaffle,
  toRaffleDisplay
} from "@/lib/raffleStorage";
import { getBalance } from "@/lib/solanaPayment";
import { HOT_WALLET, RPC_ENDPOINT, IS_MAINNET, FREE_RAFFLE_MAX_TICKETS_PER_WALLET } from "@/lib/config";
import { Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from "@solana/web3.js";

export default function RaffleDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { publicKey, connected, sendTransaction } = useWallet();

  const [raffle, setRaffle] = useState<RaffleDisplay | null>(null);
  const [raffleCreator, setRaffleCreator] = useState<string | null>(null); // Wallet that receives payments
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [timeRemaining, setTimeRemaining] = useState("");
  const [userTickets, setUserTickets] = useState(0);
  const [isUrgent, setIsUrgent] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  // Load raffle data
  const loadRaffle = useCallback(async () => {
    const found = await getRaffleById(id);

    if (found) {
      const raffleDisplay = toRaffleDisplay(found);
      setRaffle(raffleDisplay);
      setRaffleCreator(found.creatorWallet);

      const parts = await getRaffleParticipants(id);
      setParticipants(parts);

      // Count user tickets
      if (publicKey) {
        const userParticipation = parts.find(
          p => p.wallet === publicKey.toString()
        );
        setUserTickets(userParticipation?.quantity || 0);
      }
    }
  }, [id, publicKey]);

  useEffect(() => {
    loadRaffle();

    // Listen for updates
    const handleUpdate = () => loadRaffle();
    window.addEventListener("rafflesUpdated", handleUpdate);
    window.addEventListener("participantsUpdated", handleUpdate);

    return () => {
      window.removeEventListener("rafflesUpdated", handleUpdate);
      window.removeEventListener("participantsUpdated", handleUpdate);
    };
  }, [loadRaffle]);

  // Update timer
  useEffect(() => {
    if (!raffle) return;
    const interval = setInterval(() => {
      setTimeRemaining(formatTimeRemaining(raffle.endTime));
      const diff = raffle.endTime.getTime() - Date.now();
      setIsUrgent(diff > 0 && diff < 3600000);
    }, 1000);
    return () => clearInterval(interval);
  }, [raffle]);

  // Get wallet balance
  useEffect(() => {
    if (publicKey) {
      getBalance(publicKey).then(setWalletBalance).catch(console.error);
    }
  }, [publicKey]);

  // Handle purchase
  const handlePurchase = async () => {
    if (!connected || !publicKey || !raffle) {
      setError("Please connect your wallet first");
      return;
    }

    const totalCost = raffle.isFree ? 0 : raffle.ticketPrice * quantity;

    // For FREE raffles, check if wallet already has max tickets
    if (raffle.isFree) {
      if (userTickets >= FREE_RAFFLE_MAX_TICKETS_PER_WALLET) {
        setError(`You already have ${userTickets} free ticket${userTickets > 1 ? 's' : ''}. Maximum ${FREE_RAFFLE_MAX_TICKETS_PER_WALLET} per wallet for free raffles.`);
        return;
      }
      if (userTickets + quantity > FREE_RAFFLE_MAX_TICKETS_PER_WALLET) {
        setError(`You can only get ${FREE_RAFFLE_MAX_TICKETS_PER_WALLET - userTickets} more free ticket${FREE_RAFFLE_MAX_TICKETS_PER_WALLET - userTickets > 1 ? 's' : ''}.`);
        return;
      }
    }

    // Check balance - Removed to allow wallet interaction
    // if (!raffle.isFree && walletBalance !== null && walletBalance < totalCost) {
    //   setError(`Insufficient balance. You need ${totalCost} SOL but have ${walletBalance.toFixed(4)} SOL`);
    //   return;
    // }

    // Check if raffle is still active
    if (raffle.endTime < new Date()) {
      setError("This raffle has ended");
      return;
    }

    // Check available tickets
    if (raffle.ticketsSold + quantity > raffle.maxTickets) {
      setError(`Only ${raffle.maxTickets - raffle.ticketsSold} tickets remaining`);
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      let txSignature: string = "";

      if (!raffle.isFree) {
        // 1. Send SOL to Hot Wallet
        const connection = new Connection(RPC_ENDPOINT);
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: new PublicKey(HOT_WALLET),
            lamports: totalCost * LAMPORTS_PER_SOL,
          })
        );

        txSignature = await sendTransaction(transaction, connection);

        // Wait for confirmation
        await connection.confirmTransaction(txSignature, "confirmed");
      }

      // 2. Record the entry in Supabase
      const success = await buyTickets({
        userWallet: publicKey.toString(),
        raffleId: id,
        quantity: quantity,
        txSignature: txSignature,
      });

      if (!success) throw new Error("Failed to record your tickets in the database.");

      setSuccess(`Successfully purchased ${quantity} ticket${quantity > 1 ? 's' : ''} for ${totalCost} SOL!`);

      // Reload data
      loadRaffle();
      setQuantity(1);

      // Refresh balance
      getBalance(publicKey).then(setWalletBalance).catch(console.error);

    } catch (err: any) {
      console.error("Purchase error:", err);
      setError(err.message || "Transaction failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!raffle) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-3 h-3 bg-orange rounded-full animate-bounce" />
            <div className="w-3 h-3 bg-orange-bright rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
            <div className="w-3 h-3 bg-gold rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
          </div>
          <p className="text-gray-500">Loading raffle...</p>
        </div>
      </div>
    );
  }

  const isEnded = raffle.endTime.getTime() < Date.now();
  const progressPercent = (raffle.ticketsSold / raffle.maxTickets) * 100;
  const totalCost = raffle.isFree ? 0 : raffle.ticketPrice * quantity;

  // For free raffles, check if user already has max tickets
  const hasMaxFreeTickets = raffle.isFree && userTickets >= FREE_RAFFLE_MAX_TICKETS_PER_WALLET;
  const canPurchase = connected && !isEnded && raffle.ticketsSold < raffle.maxTickets && !hasMaxFreeTickets;

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="relative pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
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

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Hero Prize Card */}
              <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-lg">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange via-orange-bright to-orange" />

                <div className="relative p-8 sm:p-12">
                  {/* Status badges */}
                  <div className="flex items-center gap-3 mb-8">
                    {raffle.isFree && (
                      <div className="px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full">
                        <span className="font-display font-bold text-xs text-white uppercase tracking-[0.15em]">
                          Free Entry
                        </span>
                      </div>
                    )}
                    {isEnded ? (
                      <div className="px-4 py-1.5 bg-gray-100 rounded-full border border-gray-200">
                        <span className="font-display text-xs text-gray-500 uppercase tracking-wider">Ended</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-4 py-1.5 bg-orange/10 rounded-full border border-orange/20">
                        <div className="relative">
                          <div className="absolute inset-0 bg-orange rounded-full animate-ping opacity-75" />
                          <div className="relative w-2.5 h-2.5 rounded-full bg-orange" />
                        </div>
                        <span className="font-display text-xs text-orange uppercase tracking-wider">Live Now</span>
                      </div>
                    )}
                    <div className="ml-auto flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${IS_MAINNET ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {IS_MAINNET ? 'Mainnet' : 'Devnet'}
                      </span>
                    </div>
                  </div>

                  {/* Prize Display */}
                  <div className="text-center mb-10">
                    <p className="text-sm text-gray-500 uppercase tracking-[0.3em] mb-4">Prize Pool</p>
                    <div className="relative inline-block">
                      <div className="relative flex items-baseline justify-center gap-3">
                        <span className="font-display font-bold text-8xl sm:text-9xl text-orange">
                          {raffle.prizeAmount}
                        </span>
                        <span className="font-display font-bold text-3xl text-orange/70">SOL</span>
                      </div>
                    </div>
                  </div>

                  {/* Countdown Timer */}
                  <div className="max-w-md mx-auto mb-10">
                    <div className="relative p-6 rounded-2xl bg-gray-50 border border-gray-200">
                      <div className="relative text-center">
                        <p className="text-xs text-gray-400 uppercase tracking-[0.2em] mb-3">
                          {isEnded ? "Raffle Ended" : "Drawing In"}
                        </p>
                        <p className={`font-mono text-4xl sm:text-5xl font-bold tracking-wider ${isUrgent ? 'text-red-500' : 'text-gray-800'}`}>
                          {timeRemaining}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Winner Display */}
                  {raffle.isDrawn && raffle.winner && (
                    <div className="max-w-md mx-auto mb-10">
                      <div className={`
                        relative p-6 rounded-2xl border-2
                        ${raffle.winner === publicKey?.toString()
                          ? "bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-400"
                          : "bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-300"
                        }
                      `}>
                        <div className="text-center">
                          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg">
                            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                            </svg>
                          </div>
                          <p className="text-xs text-gray-500 uppercase tracking-[0.2em] mb-2">
                            Winner
                          </p>
                          {raffle.winner === publicKey?.toString() ? (
                            <>
                              <p className="font-display font-bold text-2xl text-emerald-600 mb-2">
                                YOU WON!
                              </p>
                              <p className="text-emerald-700">
                                Congratulations! You won {raffle.prizeAmount} SOL!
                              </p>
                            </>
                          ) : (
                            <p className="font-mono text-lg text-gray-800">
                              {shortenAddress(raffle.winner, 8)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Stats Grid */}
                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { label: "Ticket Price", value: raffle.isFree ? "FREE" : `${raffle.ticketPrice} SOL`, highlight: raffle.isFree },
                      { label: "Tickets Sold", value: `${raffle.ticketsSold}/${raffle.maxTickets}` },
                      { label: "Participants", value: participants.length.toString() },
                      { label: "Your Tickets", value: userTickets.toString(), highlight: userTickets > 0 },
                    ].map((stat, i) => (
                      <div key={i} className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">{stat.label}</p>
                        <p className={`font-display font-bold text-lg ${stat.highlight ? 'text-orange' : 'text-gray-800'}`}>
                          {stat.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-6">
                    <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="relative h-full rounded-full overflow-hidden transition-all duration-1000"
                        style={{ width: `${progressPercent}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-orange to-orange-bright" />
                      </div>
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                      <span>{Math.round(progressPercent)}% sold</span>
                      <span>{raffle.maxTickets - raffle.ticketsSold} remaining</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Participants Table */}
              <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="relative p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-display font-bold text-xl text-gray-800">Participants</h3>
                    <span className="px-3 py-1 bg-orange/10 rounded-full text-xs text-orange font-display">
                      {participants.length} wallet{participants.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {participants.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="text-left py-3 px-4 text-[10px] text-gray-400 uppercase tracking-wider font-display">Wallet</th>
                            <th className="text-center py-3 px-4 text-[10px] text-gray-400 uppercase tracking-wider font-display">Tickets</th>
                            <th className="text-center py-3 px-4 text-[10px] text-gray-400 uppercase tracking-wider font-display">Paid</th>
                            <th className="text-right py-3 px-4 text-[10px] text-gray-400 uppercase tracking-wider font-display">Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {participants
                            .sort((a, b) => b.quantity - a.quantity)
                            .map((participant, index) => (
                              <tr
                                key={participant.txSignature}
                                className="border-b border-gray-100 hover:bg-orange/5 transition-colors"
                              >
                                <td className="py-4 px-4">
                                  <div className="flex items-center gap-3">
                                    <div className={`
                                      w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                                      ${index === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white' :
                                        index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white' :
                                          index === 2 ? 'bg-gradient-to-br from-orange-300 to-orange-400 text-white' :
                                            'bg-gray-100 text-gray-500'}
                                    `}>
                                      {index + 1}
                                    </div>
                                    <span className="font-mono text-sm text-gray-700">
                                      {shortenAddress(participant.wallet, 6)}
                                    </span>
                                    {participant.wallet === publicKey?.toString() && (
                                      <span className="px-2 py-0.5 bg-orange/10 text-orange text-xs rounded-full">You</span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-4 px-4 text-center">
                                  <span className="font-display font-bold text-orange">{participant.quantity}</span>
                                </td>
                                <td className="py-4 px-4 text-center">
                                  <span className={`text-sm ${raffle.isFree ? 'text-emerald-600' : 'text-gray-700'}`}>
                                    {raffle.isFree ? 'FREE' : `${(participant.quantity * raffle.ticketPrice).toFixed(3)} SOL`}
                                  </span>
                                </td>
                                <td className="py-4 px-4 text-right">
                                  <span className="text-xs text-gray-500">
                                    {new Date(participant.createdAt).toLocaleTimeString()}
                                  </span>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-500">No participants yet. Be the first to enter!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Purchase Card */}
              <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange via-orange-bright to-orange" />

                <div className="p-6">
                  <h3 className="font-display font-bold text-xl text-gray-800 mb-6">
                    {raffle.isFree ? "Enter for Free" : "Buy Tickets"}
                  </h3>

                  {!connected ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">Connect your wallet to enter</p>
                      <WalletMultiButton />
                    </div>
                  ) : isEnded ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-500">This raffle has ended</p>
                    </div>
                  ) : hasMaxFreeTickets ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
                        <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-emerald-600 font-semibold mb-2">You're already entered!</p>
                      <p className="text-gray-500 text-sm">
                        You have {userTickets} free ticket{userTickets > 1 ? 's' : ''}.
                        <br />
                        Max {FREE_RAFFLE_MAX_TICKETS_PER_WALLET} per wallet for free raffles.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Quantity Selector - Only for paid raffles */}
                      {!raffle.isFree && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Number of Tickets
                          </label>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setQuantity(Math.max(1, quantity - 1))}
                              className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-600 transition-colors"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              value={quantity}
                              onChange={(e) => setQuantity(Math.max(1, Math.min(raffle.maxTickets - raffle.ticketsSold, parseInt(e.target.value) || 1)))}
                              className="flex-1 h-12 text-center text-xl font-bold text-gray-800 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
                            />
                            <button
                              onClick={() => setQuantity(Math.min(raffle.maxTickets - raffle.ticketsSold, quantity + 1))}
                              className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-600 transition-colors"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Free raffle info */}
                      {raffle.isFree && (
                        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                          <p className="text-emerald-700 text-sm font-medium text-center">
                            Free Entry - {FREE_RAFFLE_MAX_TICKETS_PER_WALLET} ticket per wallet
                          </p>
                        </div>
                      )}

                      {/* Cost Summary */}
                      {!raffle.isFree && (
                        <div className="p-4 bg-gray-50 rounded-xl">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-600">Price per ticket</span>
                            <span className="font-mono text-gray-800">{raffle.ticketPrice} SOL</span>
                          </div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-600">Quantity</span>
                            <span className="font-mono text-gray-800">×{quantity}</span>
                          </div>
                          <div className="h-px bg-gray-200 my-3" />
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-gray-800">Total</span>
                            <span className="font-display font-bold text-xl text-orange">{totalCost} SOL</span>
                          </div>
                          {walletBalance !== null && (
                            <p className="text-xs text-gray-500 mt-2">
                              Your balance: {walletBalance.toFixed(4)} SOL
                            </p>
                          )}
                        </div>
                      )}

                      {/* Error/Success Messages */}
                      {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                          <p className="text-red-600 text-sm">{error}</p>
                        </div>
                      )}
                      {success && (
                        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                          <p className="text-emerald-600 text-sm">{success}</p>
                        </div>
                      )}

                      {/* Purchase Button */}
                      <button
                        onClick={handlePurchase}
                        disabled={!canPurchase || isProcessing}
                        className={`
                          relative w-full py-4 rounded-xl font-display font-bold text-lg uppercase tracking-wider
                          overflow-hidden transition-all duration-300 text-white
                          ${!canPurchase || isProcessing
                            ? "bg-gray-300 cursor-not-allowed"
                            : "bg-gradient-to-r from-orange via-orange-bright to-orange shadow-lg shadow-orange/30 hover:shadow-orange/50 hover:scale-[1.02]"
                          }
                        `}
                      >
                        {isProcessing ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Processing...
                          </span>
                        ) : raffle.isFree ? (
                          "Enter Free"
                        ) : (
                          `Pay ${totalCost} SOL`
                        )}
                      </button>

                      {/* Payment info */}
                      <p className="text-xs text-gray-500 text-center">
                        {raffle.isFree
                          ? "No payment required for free entries"
                          : `Payment goes to: ${raffleCreator ? shortenAddress(raffleCreator, 6) : "..."}`
                        }
                      </p>
                      {!raffle.isFree && raffle.raffleType === "community" && (
                        <p className="text-xs text-purple-500 text-center mt-1">
                          Community raffle by {raffle.creatorDisplayName || shortenAddress(raffleCreator || "", 4)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Rules Card */}
              <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="relative p-6">
                  <h3 className="font-display font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Raffle Rules
                  </h3>
                  <ul className="space-y-3">
                    {[
                      "One wallet can purchase multiple tickets",
                      "More tickets = higher chance to win",
                      "Winner receives full prize pool",
                      "All transactions are on-chain and final",
                    ].map((rule, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                        <span className="w-5 h-5 rounded-full bg-orange/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-orange text-xs">{i + 1}</span>
                        </span>
                        {rule}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
