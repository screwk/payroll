"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useAdmin } from "@/providers/AdminProvider";

import {
  createRaffle,
  getRaffles,
  deleteRaffle,
  drawWinner,
  StoredRaffle,
  getAllParticipantsForAdmin,
  Participant,
} from "@/lib/raffleStorage";
import { shortenAddress } from "@/types/payroll";
import { IS_MAINNET } from "@/lib/config";

export default function AdminPage() {
  const { publicKey, connected } = useWallet();
  const { isAdmin, isOwner } = useAdmin();
  const [isCreating, setIsCreating] = useState(false);
  const [existingRaffles, setExistingRaffles] = useState<StoredRaffle[]>([]);
  const [participants, setParticipants] = useState<(Participant & { rafflePrize?: number })[]>([]);
  const [activeTab, setActiveTab] = useState<"create" | "raffles" | "history" | "participants" | "financial">("create");
  const [formData, setFormData] = useState({
    prizeAmount: "",
    ticketPrice: "",
    maxTickets: "",
    durationHours: "",
    isFree: false,
  });

  // Load existing raffles and participants
  const loadData = async () => {
    try {
      const [raffles, parts] = await Promise.all([
        getRaffles(),
        getAllParticipantsForAdmin(),
      ]);

      setExistingRaffles(raffles || []);
      setParticipants(parts || []);
    } catch (err) {
      console.error("Failed to load admin data:", err);
    }
  };

  useEffect(() => {
    loadData();
    // Refresh every 30s
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !publicKey) return;

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

      if (!newRaffle) {
        throw new Error("Failed to create raffle in database.");
      }

      setFormData({
        prizeAmount: "",
        ticketPrice: "",
        maxTickets: "",
        durationHours: "",
        isFree: false,
      });

      alert("Raffle created successfully!");
      loadData();
    } catch (error: any) {
      console.error("Failed to create raffle:", error);
      alert(error.message || "Failed to create raffle");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteRaffle = async (id: string) => {
    if (confirm("Are you sure you want to delete this raffle?")) {
      const result = await deleteRaffle(id, publicKey?.toString());
      if (result.success) {
        setExistingRaffles(prev => prev.filter(r => r.id !== id));
        setTimeout(loadData, 500);
      } else {
        alert(`Failed to delete: ${result.error}`);
        loadData();
      }
    }
  };

  // Calculate stats
  const totalRevenue = participants.reduce((sum, p) => sum + p.amountPaid, 0);
  const totalTicketsSold = participants.reduce((sum, p) => sum + p.tickets, 0);
  const uniqueWallets = new Set(participants.map(p => p.wallet)).size;

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
          {/* Page Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold mb-4">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Admin Access • {IS_MAINNET ? 'Mainnet' : 'Devnet'}
            </div>
            <h1 className="font-display font-bold text-4xl text-gray-900 mb-4">
              Admin Panel
            </h1>
            <p className="text-gray-600">
              Create and manage raffles for your community
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 text-center">
              <p className="text-3xl font-bold text-orange">{totalRevenue.toFixed(2)}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider">SOL Received</p>
            </div>
            <div className="p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 text-center">
              <p className="text-3xl font-bold text-gray-900">{totalTicketsSold}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Tickets Sold</p>
            </div>
            <div className="p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 text-center">
              <p className="text-3xl font-bold text-gray-900">{uniqueWallets}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Unique Wallets</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 p-1 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 mb-8 overflow-x-auto">
            {(() => {
              const activeRaffleIds = new Set(existingRaffles.filter(r => !r.isDrawn).map(r => r.id));
              const activeEntriesCount = participants.filter(p => activeRaffleIds.has(p.raffleId)).length;

              const tabs = [
                { key: "create", label: "Create", icon: "+" },
                { key: "raffles", label: `Active (${existingRaffles.filter(r => !r.isDrawn).length})`, icon: "🎯" },
                { key: "history", label: `History (${existingRaffles.filter(r => r.isDrawn).length})`, icon: "🏆" },
                { key: "participants", label: `Entries (${activeEntriesCount})`, icon: "👥" },
              ];

              if (isOwner) {
                tabs.push({ key: "financial", label: "Financial", icon: "💰" });
              }

              return tabs;
            })().map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`
                  flex-1 px-4 py-3 rounded-lg font-display text-sm transition-all duration-200 whitespace-nowrap
                  ${activeTab === tab.key
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }
                `}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Auth Check */}
          {!connected ? (
            <div className="text-center p-12 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-xl">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="font-display font-bold text-xl text-gray-900 mb-4">Connect Your Wallet</h2>
              <p className="text-gray-600 mb-6">Connect your admin wallet to access the panel</p>
              <WalletMultiButton />
            </div>
          ) : (!isAdmin && !isOwner) ? (
            <div className="text-center p-12 bg-white/80 backdrop-blur-sm rounded-2xl border border-red-200 shadow-xl">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center">
                <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="font-display font-bold text-xl text-gray-900 mb-4">Unauthorized</h2>
              <p className="text-gray-600">This wallet is not authorized to access the admin panel.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* CREATE TAB */}
              {activeTab === "create" && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="p-8 bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-xl">
                    <h2 className="font-display font-bold text-2xl text-gray-900 mb-6 flex items-center gap-3">
                      <span className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">+</span>
                      Create New Raffle
                    </h2>
                    <div className="space-y-6">
                      <label className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200">
                        <input type="checkbox" name="isFree" checked={formData.isFree} onChange={handleChange} className="w-5 h-5 rounded border-gray-300 bg-white text-emerald-600 focus:ring-emerald-500" />
                        <div>
                          <p className="font-display font-bold text-gray-900">Free Giveaway</p>
                          <p className="text-sm text-gray-500">Users enter without paying. <span className="text-orange-600 font-bold">Prize deposit still required.</span></p>
                        </div>
                      </label>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Prize Amount (SOL)</label>
                        <input type="number" name="prizeAmount" value={formData.prizeAmount} onChange={handleChange} placeholder="e.g., 50" step="0.001" min="0" required className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500" />
                        <p className="text-xs text-gray-500 mt-2">Required for ALL raffles. Locked in escrow.</p>
                      </div>
                      {!formData.isFree && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Ticket Price (SOL)</label>
                          <input type="number" name="ticketPrice" value={formData.ticketPrice} onChange={handleChange} placeholder="e.g., 0.5" step="0.001" min="0" required={!formData.isFree} className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500" />
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Max Tickets</label>
                          <input type="number" name="maxTickets" value={formData.maxTickets} onChange={handleChange} placeholder="100" min="1" required className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Duration (Hours)</label>
                          <input type="number" name="durationHours" value={formData.durationHours} onChange={handleChange} placeholder="24" min="1" required className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" />
                        </div>
                      </div>
                      <button type="submit" disabled={isCreating} className={`w-full py-4 rounded-xl font-display font-bold text-lg text-white transition-all ${isCreating ? "bg-gray-400" : "bg-gradient-to-r from-orange-500 to-amber-500 hover:scale-[1.02] shadow-lg"}`}>
                        {isCreating ? "Processing..." : "Create Raffle"}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* ACTIVE RAFFLES TAB */}
              {activeTab === "raffles" && (
                <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-xl">
                  <h3 className="font-display font-bold text-lg mb-4">Active Raffles</h3>
                  <div className="space-y-3">
                    {existingRaffles.filter(r => !r.isDrawn).map(raffle => (
                      <div key={raffle.id} className="p-4 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-between">
                        <div>
                          <p className="font-bold">{raffle.prizeAmount} SOL</p>
                          <p className="text-xs text-gray-500">{raffle.ticketsSold}/{raffle.maxTickets} sold</p>
                        </div>
                        <div className="flex gap-2">
                          {raffle.ticketsSold > 0 && (
                            <button onClick={async () => {
                              const result = await drawWinner(raffle.id);
                              if (result) { alert("Winner drawn!"); loadData(); }
                            }} className="px-3 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600 font-bold">
                              Draw Winner
                            </button>
                          )}
                          <button onClick={() => handleDeleteRaffle(raffle.id)} className="p-2 text-red-500 hover:bg-red-50 rounded">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </div>
                    ))}
                    {existingRaffles.filter(r => !r.isDrawn).length === 0 && <p className="text-center py-6 text-gray-500">No active raffles.</p>}
                  </div>
                </div>
              )}

              {/* HISTORY TAB */}
              {activeTab === "history" && (
                <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-xl">
                  <h3 className="font-display font-bold text-lg mb-4">History</h3>
                  <div className="space-y-4">
                    {existingRaffles.filter(r => r.isDrawn).map(raffle => (
                      <div key={raffle.id} className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                        <div className="flex justify-between items-center mb-2">
                          <p className="font-bold">{raffle.prizeAmount} SOL</p>
                          <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold">COMPLETED</span>
                        </div>
                        <p className="text-xs text-gray-600 font-mono break-all">Winner: {raffle.winner}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PARTICIPANTS TAB */}
              {activeTab === "participants" && (
                <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-xl">
                  <h3 className="font-display font-bold text-lg mb-4">Live Entries</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-200 text-gray-400">
                          <th className="py-2 text-left">Wallet</th>
                          <th className="py-2 text-center">Raffle</th>
                          <th className="py-2 text-center">Tickets</th>
                          <th className="py-2 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {participants.filter(p => existingRaffles.find(r => r.id === p.raffleId && !r.isDrawn)).map((p, i) => (
                          <tr key={i} className="border-b border-gray-50">
                            <td className="py-2 font-mono">{shortenAddress(p.wallet, 6)}</td>
                            <td className="py-2 text-center">{p.rafflePrize} SOL</td>
                            <td className="py-2 text-center font-bold">{p.tickets}</td>
                            <td className="py-2 text-right"><span className="text-emerald-600 uppercase font-bold text-[10px]">{p.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* FINANCIAL TAB */}
              {activeTab === "financial" && isOwner && (
                <div className="space-y-6">
                  <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-xl">
                    <h3 className="font-display font-bold text-lg text-gray-900 mb-6 flex items-center gap-2">💰 Financial Dashboard</h3>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 text-center">
                        <p className="text-2xl font-bold text-orange-600">{totalRevenue.toFixed(2)}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-tighter">Total Gross Income (SOL)</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-center">
                        <p className="text-2xl font-bold">{existingRaffles.filter(r => !r.isDrawn).length}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-tighter">Active Raffle Escrows</p>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-left border-b border-gray-200 text-gray-400">
                            <th className="pb-3 px-2">Prize</th>
                            <th className="pb-3 px-2">Escrow Address</th>
                            <th className="pb-3 px-2">Status</th>
                            <th className="pb-3 px-2 text-right">Emergency</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {existingRaffles.map(raffle => (
                            <tr key={raffle.id} className="hover:bg-gray-50">
                              <td className="py-3 px-2 font-bold">{raffle.prizeAmount} SOL</td>
                              <td className="py-3 px-2 font-mono"><a href={`https://solscan.io/account/${raffle.id}?cluster=${IS_MAINNET ? 'mainnet' : 'devnet'}`} target="_blank" className="text-orange-500">View on Solscan</a></td>
                              <td className="py-3 px-2"><span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${raffle.isDrawn ? 'bg-gray-100 text-gray-400' : 'bg-green-100 text-green-700'}`}>{raffle.isDrawn ? 'DRAWN' : 'ESCROW'}</span></td>
                              <td className="py-3 px-2 text-right"><button onClick={() => alert("Rescue functionality via Contract directly.")} className="px-2 py-1 bg-red-50 text-red-600 rounded text-[10px] font-bold">Rescue SOL</button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                    <p className="text-sm font-bold text-red-900 mb-1">Owner Security Alert</p>
                    <p className="text-[11px] text-red-700">The Financial Control tab is restricted to the hardcoded Owner. Rescue tools should only be used if the automated draw mechanism fails.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
