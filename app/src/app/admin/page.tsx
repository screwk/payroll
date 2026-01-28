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
  getApprovedCreators,
  approveCreator,
  revokeCreator,
  ApprovedCreator,
} from "@/lib/raffleStorage";
import { shortenAddress } from "@/types/payroll";
import { IS_MAINNET } from "@/lib/config";

export default function AdminPage() {
  const { publicKey, connected } = useWallet();
  const { isAdmin } = useAdmin();
  const [isCreating, setIsCreating] = useState(false);
  const [existingRaffles, setExistingRaffles] = useState<StoredRaffle[]>([]);
  const [participants, setParticipants] = useState<(Participant & { rafflePrize?: number })[]>([]);
  const [approvedCreators, setApprovedCreators] = useState<ApprovedCreator[]>([]);
  const [activeTab, setActiveTab] = useState<"create" | "raffles" | "history" | "participants" | "community_entries" | "creators">("create");
  const [newCreatorWallet, setNewCreatorWallet] = useState("");
  const [newCreatorName, setNewCreatorName] = useState("");
  const [formData, setFormData] = useState({
    prizeAmount: "",
    ticketPrice: "",
    maxTickets: "",
    durationHours: "",
    isFree: false,
  });

  // Load existing raffles, participants, and creators
  const loadData = async () => {
    const [raffles, parts, creators] = await Promise.all([
      getRaffles(),
      getAllParticipantsForAdmin(),
      getApprovedCreators()
    ]);

    setExistingRaffles(raffles);
    setParticipants(parts);
    setApprovedCreators(creators);
  };

  useEffect(() => {
    loadData();
    // Refresh every 30s
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Approve a new creator
  const handleApproveCreator = async () => {
    if (!publicKey || !newCreatorWallet.trim()) return;

    const result = await approveCreator({
      wallet: newCreatorWallet.trim(),
      approvedBy: publicKey.toString(),
      displayName: newCreatorName.trim() || undefined,
    });

    if (result) {
      setNewCreatorWallet("");
      setNewCreatorName("");
      loadData();
      alert("Creator approved successfully!");
    } else {
      alert("Failed to approve creator. Make sure you're the admin.");
    }
  };

  // Revoke creator access
  const handleRevokeCreator = async (wallet: string) => {
    if (!publicKey) return;
    if (confirm("Are you sure you want to revoke this creator's access?")) {
      const result = await revokeCreator(wallet, publicKey.toString());
      if (result) {
        loadData();
      }
    }
  };

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

      console.log("Raffle created:", newRaffle);

      if (!newRaffle) {
        throw new Error("Failed to create raffle in database. This might be a connection issue with Supabase or an authorization problem.");
      }

      const raffles = await getRaffles();
      setExistingRaffles(raffles);

      setFormData({
        prizeAmount: "",
        ticketPrice: "",
        maxTickets: "",
        durationHours: "",
        isFree: false,
      });

      alert("Raffle created successfully! It will now appear on the homepage.");
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
      const result = await deleteRaffle(id);
      if (result.success) {
        // Optimistic update: clear state first to show immediate action
        setExistingRaffles(prev => prev.filter(r => r.id !== id));
        // Wait a bit and reload to ensure everything is in sync
        setTimeout(loadData, 500);
      } else {
        console.error("Deletion failed:", result.error);
        alert(`Failed to delete: ${result.error}`);
        loadData(); // Sync state anyway
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
              // Count only participants from active (non-drawn) raffles
              const activeRaffleIds = new Set(existingRaffles.filter(r => !r.isDrawn).map(r => r.id));
              const activeEntriesCount = participants.filter(p => activeRaffleIds.has(p.raffleId)).length;

              const communityEntriesCount = participants.filter(p => {
                const r = existingRaffles.find(raf => raf.id === p.raffleId);
                return r && r.raffleType === 'community' && !r.isDrawn;
              }).length;

              return [
                { key: "create", label: "Create", icon: "+" },
                { key: "raffles", label: `Active (${existingRaffles.filter(r => !r.isDrawn).length})`, icon: "🎯" },
                { key: "history", label: `History (${existingRaffles.filter(r => r.isDrawn).length})`, icon: "🏆" },
                { key: "participants", label: `Entries (${activeEntriesCount})`, icon: "👥" },
                { key: "community_entries", label: `Community Entries (${communityEntriesCount})`, icon: "🌍" },
                { key: "creators", label: `Creators (${approvedCreators.filter(c => c.isActive).length})`, icon: "✨" },
              ];
            })().map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`
                  flex-1 px-4 py-3 rounded-lg font-display text-sm transition-all duration-200
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="font-display font-bold text-xl text-gray-900 mb-4">
                Connect Your Wallet
              </h2>
              <p className="text-gray-600 mb-6">
                Connect your admin wallet to access the panel
              </p>
              <WalletMultiButton />
            </div>
          ) : !isAdmin ? (
            <div className="text-center p-12 bg-white/80 backdrop-blur-sm rounded-2xl border border-red-200 shadow-xl">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center">
                <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="font-display font-bold text-xl text-gray-900 mb-4">
                Unauthorized
              </h2>
              <p className="text-gray-600">
                This wallet is not authorized to access the admin panel.
              </p>
              <p className="text-xs text-gray-400 mt-4 font-mono">
                Connected: {publicKey?.toString().slice(0, 12)}...
              </p>
            </div>
          ) : (
            /* Admin Content with Tabs */
            <div className="space-y-6">
              {/* CREATE TAB */}
              {activeTab === "create" && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Create Raffle Card */}
                  <div className="p-8 bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-xl">
                    <h2 className="font-display font-bold text-2xl text-gray-900 mb-6 flex items-center gap-3">
                      <span className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                        <span className="text-emerald-600 text-xl">+</span>
                      </span>
                      Create New Raffle
                    </h2>

                    <div className="space-y-6">
                      {/* Free Toggle */}
                      <label className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200">
                        <input
                          type="checkbox"
                          name="isFree"
                          checked={formData.isFree}
                          onChange={handleChange}
                          className="w-5 h-5 rounded border-gray-300 bg-white text-emerald-600 focus:ring-emerald-500"
                        />
                        <div>
                          <p className="font-display font-bold text-gray-900">Free Giveaway</p>
                          <p className="text-sm text-gray-500">
                            Users can enter without paying for tickets
                          </p>
                        </div>
                      </label>

                      {/* Prize Amount */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Prize Amount (SOL)
                        </label>
                        <input
                          type="number"
                          name="prizeAmount"
                          value={formData.prizeAmount}
                          onChange={handleChange}
                          placeholder="e.g., 50"
                          step="0.001"
                          min="0"
                          required
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900
                                 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                          This amount will be deposited from your wallet when creating the raffle
                        </p>
                      </div>

                      {/* Ticket Price */}
                      {!formData.isFree && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Ticket Price (SOL)
                          </label>
                          <input
                            type="number"
                            name="ticketPrice"
                            value={formData.ticketPrice}
                            onChange={handleChange}
                            placeholder="e.g., 0.5"
                            step="0.001"
                            min="0"
                            required={!formData.isFree}
                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900
                                   placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                          />
                        </div>
                      )}

                      {/* Max Tickets */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Maximum Tickets
                        </label>
                        <input
                          type="number"
                          name="maxTickets"
                          value={formData.maxTickets}
                          onChange={handleChange}
                          placeholder="e.g., 100"
                          min="1"
                          required
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900
                                 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        />
                      </div>

                      {/* Duration */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Duration (Hours)
                        </label>
                        <input
                          type="number"
                          name="durationHours"
                          value={formData.durationHours}
                          onChange={handleChange}
                          placeholder="e.g., 24"
                          min="1"
                          required
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900
                                 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        />
                      </div>

                      {/* Preview */}
                      {formData.prizeAmount && formData.maxTickets && (
                        <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl">
                          <p className="text-sm text-gray-600 mb-2 font-medium">Raffle Preview</p>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Prize</p>
                              <p className="font-display font-bold text-orange-600">{formData.prizeAmount} SOL</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Ticket Price</p>
                              <p className="font-display font-bold text-gray-900">
                                {formData.isFree ? "FREE" : `${formData.ticketPrice || "0"} SOL`}
                              </p>
                            </div>
                            {!formData.isFree && formData.ticketPrice && (
                              <>
                                <div>
                                  <p className="text-gray-500">Max Revenue</p>
                                  <p className="font-display font-bold text-gray-900">
                                    {(parseFloat(formData.ticketPrice) * parseInt(formData.maxTickets)).toFixed(2)} SOL
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Potential Profit</p>
                                  <p className="font-display font-bold text-emerald-600">
                                    {(
                                      parseFloat(formData.ticketPrice) * parseInt(formData.maxTickets) -
                                      parseFloat(formData.prizeAmount)
                                    ).toFixed(2)} SOL
                                  </p>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={isCreating}
                        className={`
                      w-full py-4 rounded-xl font-display font-bold text-lg uppercase tracking-wider
                      transition-all duration-200 text-white
                      ${isCreating
                            ? "bg-gray-400 cursor-wait"
                            : "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-[1.02]"
                          }
                    `}
                      >
                        {isCreating ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Creating Raffle...
                          </span>
                        ) : (
                          "Create Raffle"
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Tips */}
                  <div className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-lg">
                    <h3 className="font-display font-bold text-lg text-gray-900 mb-4">Tips</h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• Set ticket prices that will generate profit when all tickets are sold</li>
                      <li>• Free giveaways are great for community building</li>
                      <li>• Longer durations give more time for participants to join</li>
                      <li>• Prize amount is locked in the smart contract until draw</li>
                    </ul>
                  </div>
                </form>
              )}

              {/* RAFFLES TAB - Only active (non-drawn) raffles */}
              {activeTab === "raffles" && (
                <div className="p-6 bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-xl">
                  <h3 className="font-display font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Active Raffles ({existingRaffles.filter(r => !r.isDrawn).length})
                  </h3>
                  {existingRaffles.filter(r => !r.isDrawn).length > 0 ? (
                    <div className="space-y-3">
                      {existingRaffles.filter(r => !r.isDrawn).map((raffle) => {
                        const endTime = new Date(raffle.endTime);
                        const isEnded = endTime < new Date();
                        const isFull = raffle.ticketsSold >= raffle.maxTickets;
                        const timeLeft = isEnded ? "Ended" : isFull ? "FULL" : `${Math.ceil((endTime.getTime() - Date.now()) / 3600000)}h left`;
                        const raffleParticipants = participants.filter(p => p.raffleId === raffle.id);
                        // Can draw if: has participants, not drawn yet, and (ended OR full OR admin wants to force)
                        const canDraw = !raffle.isDrawn && raffle.ticketsSold > 0;

                        return (
                          <div
                            key={raffle.id}
                            className={`p-4 rounded-xl border ${raffle.isDrawn
                              ? "bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-300"
                              : isEnded
                                ? "bg-gray-50 border-gray-200"
                                : "bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200"
                              }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className={`px-2 py-1 rounded-full text-xs font-semibold ${raffle.isDrawn
                                  ? "bg-emerald-200 text-emerald-700"
                                  : isFull
                                    ? "bg-purple-200 text-purple-700"
                                    : isEnded
                                      ? "bg-gray-200 text-gray-600"
                                      : raffle.isFree
                                        ? "bg-emerald-100 text-emerald-700"
                                        : "bg-orange-100 text-orange-700"
                                  }`}>
                                  {raffle.isDrawn ? "DRAWN" : isFull ? "FULL" : isEnded ? "ENDED" : raffle.isFree ? "FREE" : "LIVE"}
                                </div>
                                <div>
                                  <p className="font-display font-bold text-gray-900">
                                    {raffle.prizeAmount} SOL
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {raffle.ticketsSold}/{raffle.maxTickets} tickets • {raffleParticipants.length} entries • {timeLeft}
                                  </p>
                                  {/* Show winner if drawn */}
                                  {raffle.isDrawn && raffle.winner && (
                                    <p className="text-xs text-emerald-600 font-semibold mt-1">
                                      Winner: {shortenAddress(raffle.winner, 6)}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {/* Draw Winner Button - always visible if can draw */}
                                {canDraw && (
                                  <button
                                    onClick={async () => {
                                      const confirmMsg = isEnded || isFull
                                        ? "Draw a winner now?"
                                        : "Force draw before time ends?";
                                      if (confirm(confirmMsg)) {
                                        const result = await drawWinner(raffle.id);
                                        if (result) {
                                          alert(`🎉 Winner: ${shortenAddress(result.winner || "", 8)}`);
                                          loadData();
                                        }
                                      }
                                    }}
                                    className={`px-3 py-2 text-white text-xs font-semibold rounded-lg hover:shadow-lg transition-all flex items-center gap-1 ${isEnded || isFull
                                      ? "bg-gradient-to-r from-amber-500 to-yellow-500"
                                      : "bg-gradient-to-r from-purple-500 to-indigo-500"
                                      }`}
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                    </svg>
                                    {isEnded ? "Draw Winner" : isFull ? "Draw (Full)" : "Force Draw"}
                                  </button>
                                )}
                                {/* Delete Button */}
                                <button
                                  onClick={() => handleDeleteRaffle(raffle.id)}
                                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete raffle"
                                >
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500">No raffles created yet. Create your first raffle!</p>
                    </div>
                  )}
                </div>
              )}

              {/* HISTORY TAB - Finished (drawn) raffles */}
              {activeTab === "history" && (
                <div className="p-6 bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-xl">
                  <h3 className="font-display font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    Raffle History ({existingRaffles.filter(r => r.isDrawn).length})
                  </h3>
                  {existingRaffles.filter(r => r.isDrawn).length > 0 ? (
                    <div className="space-y-4">
                      {existingRaffles.filter(r => r.isDrawn).map((raffle) => {
                        const raffleParticipants = participants.filter(p => p.raffleId === raffle.id);
                        const winnerEntry = raffleParticipants.find(p => p.wallet === raffle.winner);

                        return (
                          <div
                            key={raffle.id}
                            className="p-5 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200"
                          >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg">
                                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                  </svg>
                                </div>
                                <div>
                                  <p className="font-display font-bold text-2xl text-gray-900">
                                    {raffle.prizeAmount} SOL
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {raffle.isFree ? "Free Giveaway" : `${raffle.ticketPrice} SOL per ticket`}
                                  </p>
                                </div>
                              </div>
                              <div className="px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full">
                                COMPLETED
                              </div>
                            </div>

                            {/* Winner Info */}
                            <div className="p-4 bg-white rounded-lg border border-emerald-200 mb-4">
                              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Winner</p>
                              <p className="font-mono text-lg text-gray-900 break-all">
                                {raffle.winner}
                              </p>
                              {winnerEntry && (
                                <p className="text-sm text-gray-500 mt-1">
                                  Entered with {winnerEntry.tickets} ticket{winnerEntry.tickets > 1 ? 's' : ''}
                                  {winnerEntry.isFree ? ' (Free)' : ` (Paid ${winnerEntry.amountPaid} SOL)`}
                                </p>
                              )}
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-3 text-center">
                              <div className="p-3 bg-white rounded-lg border border-gray-200">
                                <p className="text-xl font-bold text-gray-900">{raffle.ticketsSold}</p>
                                <p className="text-xs text-gray-500">Tickets Sold</p>
                              </div>
                              <div className="p-3 bg-white rounded-lg border border-gray-200">
                                <p className="text-xl font-bold text-gray-900">{raffleParticipants.length}</p>
                                <p className="text-xs text-gray-500">Participants</p>
                              </div>
                              <div className="p-3 bg-white rounded-lg border border-gray-200">
                                <p className="text-xl font-bold text-orange-500">
                                  {raffle.isFree ? '0' : (raffle.ticketsSold * raffle.ticketPrice).toFixed(2)}
                                </p>
                                <p className="text-xs text-gray-500">SOL Collected</p>
                              </div>
                            </div>

                            {/* Date */}
                            <p className="text-xs text-gray-400 mt-4 text-center">
                              Ended: {new Date(raffle.endTime).toLocaleString()}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-500">No finished raffles yet.</p>
                      <p className="text-sm text-gray-400 mt-1">Completed raffles will appear here with winner details.</p>
                    </div>
                  )}
                </div>
              )}

              {/* PARTICIPANTS TAB - Only show entries from active (non-drawn) raffles */}
              {activeTab === "participants" && (() => {
                // Filter to only show participants from active (non-drawn) raffles
                const activeRaffleIds = new Set(existingRaffles.filter(r => !r.isDrawn).map(r => r.id));
                const activeParticipants = participants.filter(p => activeRaffleIds.has(p.raffleId));

                return (
                  <div className="p-6 bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-xl">
                    <h3 className="font-display font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Active Entries ({activeParticipants.length})
                    </h3>
                    {activeParticipants.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-3 px-2 text-[10px] text-gray-400 uppercase tracking-wider font-display">Wallet</th>
                              <th className="text-center py-3 px-2 text-[10px] text-gray-400 uppercase tracking-wider font-display">Raffle</th>
                              <th className="text-center py-3 px-2 text-[10px] text-gray-400 uppercase tracking-wider font-display">Creator</th>
                              <th className="text-center py-3 px-2 text-[10px] text-gray-400 uppercase tracking-wider font-display">Tickets</th>
                              <th className="text-center py-3 px-2 text-[10px] text-gray-400 uppercase tracking-wider font-display">Paid</th>
                              <th className="text-center py-3 px-2 text-[10px] text-gray-400 uppercase tracking-wider font-display">Status</th>
                              <th className="text-right py-3 px-2 text-[10px] text-gray-400 uppercase tracking-wider font-display">Time</th>
                            </tr>
                          </thead>
                          <tbody>
                            {activeParticipants.map((p, index) => {
                              const raffle = existingRaffles.find(r => r.id === p.raffleId);
                              const creatorName = raffle?.creatorDisplayName || shortenAddress(raffle?.createdBy || "", 4);
                              const isCommunity = raffle?.raffleType === "community";

                              return (
                                <tr key={`${p.wallet}-${p.raffleId}-${index}`} className="border-b border-gray-100 hover:bg-orange-50/50 transition-colors">
                                  <td className="py-3 px-2">
                                    <span className="font-mono text-xs text-gray-700">
                                      {shortenAddress(p.wallet, 6)}
                                    </span>
                                  </td>
                                  <td className="py-3 px-2 text-center">
                                    <span className="text-xs text-gray-600">
                                      {p.rafflePrize ? `${p.rafflePrize} SOL` : '-'}
                                    </span>
                                  </td>
                                  <td className="py-3 px-2 text-center">
                                    {isCommunity ? (
                                      <div className="inline-flex flex-col items-center">
                                        <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">Community</span>
                                        <span className="text-[10px] text-gray-500 mt-0.5">{creatorName}</span>
                                      </div>
                                    ) : (
                                      <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">Official</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-2 text-center">
                                    <span className="font-display font-bold text-orange">{p.tickets}</span>
                                  </td>
                                  <td className="py-3 px-2 text-center">
                                    <span className={`text-xs font-semibold ${p.isFree ? 'text-emerald-600' : 'text-gray-700'}`}>
                                      {p.isFree ? 'FREE' : `${p.amountPaid} SOL`}
                                    </span>
                                  </td>
                                  <td className="py-3 px-2 text-center">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${p.status === 'confirmed'
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : p.status === 'pending'
                                        ? 'bg-yellow-100 text-yellow-700'
                                        : 'bg-red-100 text-red-700'
                                      }`}>
                                      {p.status.toUpperCase()}
                                    </span>
                                  </td>
                                  <td className="py-3 px-2 text-right">
                                    <span className="text-[10px] text-gray-500">
                                      {new Date(p.enteredAt).toLocaleString()}
                                    </span>
                                  </td>
                                </tr>
                              )
                            })}
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
                        <p className="text-gray-500">No entries in active raffles.</p>
                        <p className="text-sm text-gray-400 mt-1">Entries from finished raffles are automatically removed.</p>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* COMMUNITY ENTRIES TAB */}
              {activeTab === "community_entries" && (() => {
                // Filter to only show active participants from community raffles
                const activeCommunityRaffleIds = new Set(existingRaffles.filter(r => !r.isDrawn && r.raffleType === "community").map(r => r.id));
                const communityParticipants = participants.filter(p => activeCommunityRaffleIds.has(p.raffleId));

                return (
                  <div className="p-6 bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-xl">
                    <h3 className="font-display font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Community Entries ({communityParticipants.length})
                    </h3>
                    {communityParticipants.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-3 px-2 text-[10px] text-gray-400 uppercase tracking-wider font-display">Wallet</th>
                              <th className="text-center py-3 px-2 text-[10px] text-gray-400 uppercase tracking-wider font-display">Creator Info</th>
                              <th className="text-center py-3 px-2 text-[10px] text-gray-400 uppercase tracking-wider font-display">Tickets</th>
                              <th className="text-center py-3 px-2 text-[10px] text-gray-400 uppercase tracking-wider font-display">Paid</th>
                              <th className="text-center py-3 px-2 text-[10px] text-gray-400 uppercase tracking-wider font-display">Status</th>
                              <th className="text-right py-3 px-2 text-[10px] text-gray-400 uppercase tracking-wider font-display">Time</th>
                            </tr>
                          </thead>
                          <tbody>
                            {communityParticipants.map((p, index) => {
                              const raffle = existingRaffles.find(r => r.id === p.raffleId);
                              const creatorName = raffle?.creatorDisplayName || shortenAddress(raffle?.createdBy || "", 4);

                              return (
                                <tr key={`${p.wallet}-${p.raffleId}-${index}`} className="border-b border-gray-100 hover:bg-purple-50/50 transition-colors">
                                  <td className="py-3 px-2">
                                    <span className="font-mono text-xs text-gray-700">
                                      {shortenAddress(p.wallet, 6)}
                                    </span>
                                  </td>
                                  <td className="py-3 px-2 text-center">
                                    <div className="inline-flex flex-col items-center">
                                      <span className="font-bold text-xs text-purple-700">{creatorName}</span>
                                      <span className="text-[9px] text-gray-400 font-mono">{shortenAddress(raffle?.createdBy || "", 4)}</span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-2 text-center">
                                    <span className="font-display font-bold text-orange">{p.tickets}</span>
                                  </td>
                                  <td className="py-3 px-2 text-center">
                                    <span className={`text-xs font-semibold ${p.isFree ? 'text-emerald-600' : 'text-gray-700'}`}>
                                      {p.isFree ? 'FREE' : `${p.amountPaid} SOL`}
                                    </span>
                                  </td>
                                  <td className="py-3 px-2 text-center">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${p.status === 'confirmed'
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : p.status === 'pending'
                                        ? 'bg-yellow-100 text-yellow-700'
                                        : 'bg-red-100 text-red-700'
                                      }`}>
                                      {p.status.toUpperCase()}
                                    </span>
                                  </td>
                                  <td className="py-3 px-2 text-right">
                                    <span className="text-[10px] text-gray-500">
                                      {new Date(p.enteredAt).toLocaleString()}
                                    </span>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                          </svg>
                        </div>
                        <p className="text-gray-500">No community entries yet.</p>
                        <p className="text-sm text-gray-400 mt-1">Community raffles are hosted by approved creators.</p>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* CREATORS TAB */}
              {activeTab === "creators" && (
                <div className="space-y-6">
                  {/* Add New Creator */}
                  <div className="p-6 bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-xl">
                    <h3 className="font-display font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      Approve New Creator
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Approved creators can host their own community raffles on the platform.
                    </p>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Wallet Address *
                        </label>
                        <input
                          type="text"
                          value={newCreatorWallet}
                          onChange={(e) => setNewCreatorWallet(e.target.value)}
                          placeholder="Enter Solana wallet address"
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900
                                     placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Display Name (optional)
                        </label>
                        <input
                          type="text"
                          value={newCreatorName}
                          onChange={(e) => setNewCreatorName(e.target.value)}
                          placeholder="e.g., SolanaWhale"
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900
                                     placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <button
                        onClick={handleApproveCreator}
                        disabled={!newCreatorWallet.trim()}
                        className={`
                          w-full py-3 rounded-xl font-display font-bold text-sm uppercase tracking-wider
                          transition-all duration-200 text-white
                          ${!newCreatorWallet.trim()
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 shadow-lg shadow-purple-500/30"
                          }
                        `}
                      >
                        Approve Creator
                      </button>
                    </div>
                  </div>

                  {/* Approved Creators List */}
                  <div className="p-6 bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-xl">
                    <h3 className="font-display font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Approved Creators ({approvedCreators.filter(c => c.isActive).length})
                    </h3>
                    {approvedCreators.length > 0 ? (
                      <div className="space-y-3">
                        {approvedCreators.map((creator) => (
                          <div
                            key={creator.wallet}
                            className={`p-4 rounded-xl border ${creator.isActive
                              ? "bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200"
                              : "bg-gray-50 border-gray-200 opacity-60"
                              }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${creator.isActive
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                    }`}>
                                    {creator.isActive ? "ACTIVE" : "REVOKED"}
                                  </span>
                                  {creator.displayName && (
                                    <span className="font-display font-bold text-gray-900">
                                      {creator.displayName}
                                    </span>
                                  )}
                                </div>
                                <p className="font-mono text-xs text-gray-600 break-all">
                                  {creator.wallet}
                                </p>
                                <p className="text-[10px] text-gray-400 mt-1">
                                  Approved: {new Date(creator.approvedAt).toLocaleDateString()}
                                </p>
                              </div>
                              {creator.isActive && (
                                <button
                                  onClick={() => handleRevokeCreator(creator.wallet)}
                                  className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors text-xs font-semibold"
                                >
                                  Revoke
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
                          <svg className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                          </svg>
                        </div>
                        <p className="text-gray-500">No approved creators yet.</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Approve wallets above to let them create community raffles.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Info Card */}
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                    <h4 className="font-display font-bold text-sm text-purple-900 mb-2">
                      How Community Raffles Work
                    </h4>
                    <ul className="text-xs text-purple-700 space-y-1">
                      <li>• Approved creators can create raffles from <span className="font-mono">/community/create</span></li>
                      <li>• Community raffles are marked with a purple "Community" badge</li>
                      <li>• Official PAYROLL raffles show an orange "Official" badge</li>
                      <li>• Users can filter raffles by type on the homepage</li>
                      <li>• Creators can set their display name which shows on their raffles</li>
                    </ul>
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
