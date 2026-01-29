"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Link from "next/link";
import { createRaffle } from "@/lib/raffleStorage";
import { IS_MAINNET } from "@/lib/config";

export default function CreateRafflePage() {
    const { publicKey, connected } = useWallet();
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({
        prizeAmount: "",
        ticketPrice: "",
        maxTickets: "",
        durationHours: "",
        isFree: false,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!connected || !publicKey) return;

        setIsCreating(true);
        try {
            const newRaffle = await createRaffle({
                prizeAmount: parseFloat(formData.prizeAmount),
                ticketPrice: formData.isFree ? 0 : parseFloat(formData.ticketPrice),
                maxTickets: parseInt(formData.maxTickets),
                durationHours: parseInt(formData.durationHours),
                isFree: formData.isFree,
                createdBy: publicKey.toString(),
            });

            if (newRaffle) {
                setFormData({
                    prizeAmount: "",
                    ticketPrice: "",
                    maxTickets: "",
                    durationHours: "",
                    isFree: false,
                });
                alert("Raffle created successfully! It will now appear on the homepage.");
            }
        } catch (error: any) {
            console.error("Failed to create raffle:", error);
            alert(error.message || "Failed to create raffle. Ensure you have enough SOL for the prize deposit.");
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
                                            <p className="text-xs text-gray-500 font-medium">Users don't pay. <span className="text-orange-600 font-bold">You must still deposit the prize.</span></p>
                                        </div>
                                    </label>

                                    {/* Prize Amount */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Prize Amount (SOL)</label>
                                        <input type="number" name="prizeAmount" value={formData.prizeAmount} onChange={handleChange} placeholder="5.0" step="0.01" min="0.01" required className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500" />
                                        <p className="text-xs text-gray-500 mt-1">This amount will be transferred from your wallet to escrow immediately.</p>
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
                                            <input type="number" name="durationHours" value={formData.durationHours} onChange={handleChange} placeholder="24" min="1" required className="w-full px-4 py-3 border border-gray-200 rounded-xl" />
                                        </div>
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
