"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Link from "next/link";
import { createRaffle, updateRaffleSignature } from "@/lib/raffleStorage";
import { HOT_WALLET, RPC_ENDPOINT } from "@/lib/config";
import { Connection, SystemProgram, Transaction, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

export default function CreateRafflePage() {
    const { publicKey, connected, sendTransaction } = useWallet();
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        prizeAmount: "",
        ticketPrice: "",
        maxTickets: "100",
        durationHours: "24",
        isFree: false,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!connected || !publicKey) return;

        const prize = parseFloat(formData.prizeAmount);
        const price = formData.isFree ? 0 : parseFloat(formData.ticketPrice);

        const duration = parseInt(formData.durationHours);

        // Validation: Ticket price cannot be more than 50% of prize
        if (!formData.isFree && price > prize * 0.5) {
            alert("Security Rule: Ticket price cannot be more than 50% of the prize amount.");
            return;
        }

        // Validation: Max duration 48 hours
        if (duration > 48) {
            alert("Maximum duration is 48 hours (2 days).");
            return;
        }

        setIsCreating(true);
        try {
            // 1. Create record in Supabase (status: waiting_deposit)
            const newRaffle = await createRaffle({
                title: formData.title,
                description: formData.description,
                prizeAmount: prize,
                ticketPrice: price,
                maxTickets: parseInt(formData.maxTickets),
                durationHours: parseInt(formData.durationHours),
                creatorWallet: publicKey.toString(),
            });

            if (!newRaffle) throw new Error("Failed to initialize raffle record.");

            // 2. Perform Solana Transfer (Deposit Prize to Hot Wallet)
            const connection = new Connection(RPC_ENDPOINT);
            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: publicKey,
                    toPubkey: new PublicKey(HOT_WALLET),
                    lamports: prize * LAMPORTS_PER_SOL,
                })
            );

            const signature = await sendTransaction(transaction, connection);

            // 3. Update record with signature (Server will monitor this and set to 'active')
            await updateRaffleSignature(newRaffle.id, signature);

            setFormData({
                title: "",
                description: "",
                prizeAmount: "",
                ticketPrice: "",
                maxTickets: "100",
                durationHours: "24",
                isFree: false,
            });
            alert("Raffle created! Once the deposit of " + prize + " SOL is confirmed, it will go live.");

        } catch (error: any) {
            console.error("Failed to create raffle:", error);
            alert(error.message || "Failed to create raffle. Check your wallet balance.");
        } finally {
            setIsCreating(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    return (
        <div className="min-h-screen">
            <main className="relative pt-24 pb-16 px-4">
                <div className="max-w-2xl mx-auto">
                    <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-orange transition-colors mb-6 group">
                        <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span className="font-display text-sm uppercase tracking-wider">Back to Raffles</span>
                    </Link>

                    <div className="text-center mb-8">
                        <h1 className="font-display font-bold text-4xl text-gray-900 mb-4">Launch a Raffle</h1>
                        <p className="text-gray-600">Anyone can create a raffle. Prize deposit is mandatory.</p>
                    </div>

                    {!connected ? (
                        <div className="text-center p-12 bg-white rounded-2xl border border-gray-200 shadow-xl">
                            <h2 className="font-display font-bold text-xl mb-4">Connect Wallet to Start</h2>
                            <WalletMultiButton />
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="p-8 bg-white rounded-2xl border border-gray-200 shadow-xl">
                                <div className="space-y-6">
                                    {/* Free Toggle */}
                                    <label className="flex items-center gap-4 p-4 bg-emerald-50 rounded-xl cursor-pointer border border-emerald-100">
                                        <input type="checkbox" name="isFree" checked={formData.isFree} onChange={handleChange} className="w-5 h-5 rounded border-gray-300 text-emerald-600" />
                                        <div>
                                            <p className="font-bold text-gray-900">Free Giveaway</p>
                                            <p className="text-xs text-gray-500 font-medium">Users don&apos;t pay. <span className="text-orange-600 font-bold">You must still deposit the prize.</span></p>
                                        </div>
                                    </label>

                                    {/* Title & Description */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Raffle Title</label>
                                        <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="Mega Raffle #1" required className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                        <input type="text" name="description" value={formData.description} onChange={handleChange} placeholder="Join this amazing raffle!" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500" />
                                    </div>

                                    {/* Prize Amount */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Prize Amount (SOL)</label>
                                        <input type="number" name="prizeAmount" value={formData.prizeAmount} onChange={handleChange} placeholder="1.0" step="0.01" min="0.01" required className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500" />
                                        <p className="text-xs text-gray-500 mt-1">This amount will be transferred to escrow to guarantee the prize.</p>
                                    </div>

                                    {!formData.isFree && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Ticket Price (SOL)</label>
                                            <input type="number" name="ticketPrice" value={formData.ticketPrice} onChange={handleChange} placeholder="0.1" step="0.01" min="0" required={!formData.isFree} className="w-full px-4 py-3 border border-gray-200 rounded-xl" />
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Max Tickets</label>
                                            <input type="number" name="maxTickets" value={formData.maxTickets} onChange={handleChange} placeholder="100" min="1" required className="w-full px-4 py-3 border border-gray-200 rounded-xl" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Hours)</label>
                                            <input type="number" name="durationHours" value={formData.durationHours} onChange={handleChange} placeholder="24" min="1" max="48" required className="w-full px-4 py-3 border border-gray-200 rounded-xl" />
                                            <p className="text-[10px] text-gray-400 mt-1">Maximum: 48 hours (2 days)</p>
                                        </div>
                                    </div>

                                    {/* Platform Rules Notice */}
                                    <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 space-y-2">
                                        <p className="text-xs font-bold text-orange-800 flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            Platform Rules
                                        </p>
                                        <ul className="text-[10px] text-orange-700 list-disc ml-4 space-y-1">
                                            <li>Prize payouts are processed within <strong>24 hours</strong> after the raffle ends.</li>
                                            <li>Raffles with at least <strong>2 participants</strong> are drawn automatically at the deadline.</li>
                                            <li><strong>NO REFUNDS</strong> once the raffle is created and prize deposited.</li>
                                        </ul>
                                    </div>

                                    <button type="submit" disabled={isCreating} className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-bold text-lg shadow-lg hover:scale-[1.01] transition-all">
                                        {isCreating ? "Creating Raffle & Depositing Prize..." : "Launch Raffle"}
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}
                </div>
            </main>
        </div>
    );
}
