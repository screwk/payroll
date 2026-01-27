"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Link from "next/link";

import {
  createRaffle,
  canCreateRaffles,
  getCreatorInfo,
  updateCreatorDisplayName,
  getRafflesByCreator,
  ApprovedCreator,
} from "@/lib/raffleStorage";
import { shortenAddress, RaffleDisplay } from "@/types/payroll";

export default function CommunityCreatePage() {
  const { publicKey, connected } = useWallet();
  const [isCreating, setIsCreating] = useState(false);
  const [canCreate, setCanCreate] = useState(false);
  const [creatorInfo, setCreatorInfo] = useState<ApprovedCreator | null>(null);
  const [myRaffles, setMyRaffles] = useState<RaffleDisplay[]>([]);
  const [activeTab, setActiveTab] = useState<"create" | "my-raffles" | "profile">("create");
  const [displayName, setDisplayName] = useState("");
  const [formData, setFormData] = useState({
    prizeAmount: "",
    ticketPrice: "",
    maxTickets: "",
    durationHours: "",
    isFree: false,
  });

  // Check if wallet can create and load data
  useEffect(() => {
    const init = async () => {
      if (connected && publicKey) {
        const walletAddress = publicKey.toString();
        const authorized = await canCreateRaffles(walletAddress);
        setCanCreate(authorized);

        if (authorized) {
          const info = await getCreatorInfo(walletAddress);
          setCreatorInfo(info);
          setDisplayName(info?.displayName || "");
          const raffles = await getRafflesByCreator(walletAddress);
          setMyRaffles(raffles);
        }
      } else {
        setCanCreate(false);
        setCreatorInfo(null);
        setMyRaffles([]);
      }
    };
    init();
  }, [connected, publicKey]);

  // Refresh raffles periodically
  useEffect(() => {
    if (!connected || !publicKey) return;

    const refreshRaffles = async () => {
      const raffles = await getRafflesByCreator(publicKey.toString());
      setMyRaffles(raffles);
    };

    const interval = setInterval(refreshRaffles, 15000);
    return () => clearInterval(interval);
  }, [connected, publicKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate || !publicKey) return;

    setIsCreating(true);
    try {
      const newRaffle = await createRaffle({
        prizeAmount: parseFloat(formData.prizeAmount),
        ticketPrice: formData.isFree ? 0 : parseFloat(formData.ticketPrice),
        maxTickets: parseInt(formData.maxTickets),
        durationHours: parseInt(formData.durationHours),
        isFree: formData.isFree,
        createdBy: publicKey.toString(),
        displayName: displayName || undefined,
      });

      if (newRaffle) {
        setFormData({
          prizeAmount: "",
          ticketPrice: "",
          maxTickets: "",
          durationHours: "",
          isFree: false,
        });
        const raffles = await getRafflesByCreator(publicKey.toString());
        setMyRaffles(raffles);
        alert("Raffle created successfully! It will now appear on the homepage.");
      } else {
        alert("Failed to create raffle. You may not be authorized.");
      }
    } catch (error) {
      console.error("Failed to create raffle:", error);
      alert("Failed to create raffle");
    } finally {
      setIsCreating(false);
    }
  };

  const handleSaveDisplayName = async () => {
    if (!publicKey) return;
    const updated = await updateCreatorDisplayName(publicKey.toString(), displayName);
    if (updated) {
      setCreatorInfo(updated);
      alert("Display name updated!");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const stats = {
    totalRaffles: myRaffles.length,
    activeRaffles: myRaffles.filter(r => !r.isDrawn && r.endTime.getTime() > Date.now()).length,
    completedRaffles: myRaffles.filter(r => r.isDrawn).length,
    totalPrizes: myRaffles.reduce((sum, r) => sum + r.prizeAmount, 0),
  };

  return (
    <div className="min-h-screen">
      

      <main className="relative pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Back Link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-orange transition-colors mb-6 group"
          >
            <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-display text-sm uppercase tracking-wider">Back to Raffles</span>
          </Link>

          {/* Page Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold mb-4">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Community Creator
            </div>
            <h1 className="font-display font-bold text-4xl text-gray-900 mb-4">
              Create Community Raffle
            </h1>
            <p className="text-gray-600">
              Host your own raffles and earn from ticket sales
            </p>
          </div>

          {/* Not Connected */}
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
                Connect your wallet to check if you're an approved creator
              </p>
              <WalletMultiButton />
            </div>
          ) : !canCreate ? (
            /* Not Authorized */
            <div className="text-center p-12 bg-white/80 backdrop-blur-sm rounded-2xl border border-purple-200 shadow-xl">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-purple-50 flex items-center justify-center">
                <svg className="w-10 h-10 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="font-display font-bold text-xl text-gray-900 mb-4">
                Not an Approved Creator
              </h2>
              <p className="text-gray-600 mb-4">
                Your wallet is not yet approved to create community raffles.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Contact the PAYROLL team to become an approved creator and start hosting your own raffles!
              </p>
              <p className="text-xs text-gray-400 font-mono">
                Wallet: {shortenAddress(publicKey?.toString() || "", 8)}
              </p>
            </div>
          ) : (
            /* Authorized Creator Content */
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-4 gap-3">
                <div className="p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 text-center">
                  <p className="text-2xl font-bold text-purple-600">{stats.totalRaffles}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total</p>
                </div>
                <div className="p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 text-center">
                  <p className="text-2xl font-bold text-green-600">{stats.activeRaffles}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Active</p>
                </div>
                <div className="p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 text-center">
                  <p className="text-2xl font-bold text-gray-600">{stats.completedRaffles}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Completed</p>
                </div>
                <div className="p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 text-center">
                  <p className="text-2xl font-bold text-orange">{stats.totalPrizes}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">SOL Prizes</p>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1 p-1 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200">
                {[
                  { key: "create", label: "Create Raffle", icon: "+" },
                  { key: "my-raffles", label: `My Raffles (${myRaffles.length})`, icon: "🎯" },
                  { key: "profile", label: "Profile", icon: "👤" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as typeof activeTab)}
                    className={`
                      flex-1 px-4 py-3 rounded-lg font-display text-sm transition-all duration-200
                      ${activeTab === tab.key
                        ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      }
                    `}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* CREATE TAB */}
              {activeTab === "create" && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="p-8 bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-xl">
                    <h2 className="font-display font-bold text-2xl text-gray-900 mb-6 flex items-center gap-3">
                      <span className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <span className="text-purple-600 text-xl">+</span>
                      </span>
                      New Community Raffle
                    </h2>

                    <div className="space-y-6">
                      {/* Free Toggle */}
                      <label className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200">
                        <input
                          type="checkbox"
                          name="isFree"
                          checked={formData.isFree}
                          onChange={handleChange}
                          className="w-5 h-5 rounded border-gray-300 bg-white text-purple-600 focus:ring-purple-500"
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
                          placeholder="e.g., 10"
                          step="0.001"
                          min="0"
                          required
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900
                                     placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        />
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
                                       placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
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
                                     placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
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
                          max="168"
                          required
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900
                                     placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        />
                        <p className="text-xs text-gray-500 mt-1">Maximum 168 hours (7 days)</p>
                      </div>

                      {/* Preview */}
                      {formData.prizeAmount && formData.maxTickets && (
                        <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl">
                          <p className="text-sm text-gray-600 mb-2 font-medium">Raffle Preview</p>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Prize</p>
                              <p className="font-display font-bold text-purple-600">{formData.prizeAmount} SOL</p>
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
                                  <p className="font-display font-bold text-green-600">
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
                            : "bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-[1.02]"
                          }
                        `}
                      >
                        {isCreating ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Creating...
                          </span>
                        ) : (
                          "Create Community Raffle"
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* MY RAFFLES TAB */}
              {activeTab === "my-raffles" && (
                <div className="p-6 bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-xl">
                  <h3 className="font-display font-bold text-lg text-gray-900 mb-4">
                    My Raffles
                  </h3>
                  {myRaffles.length > 0 ? (
                    <div className="space-y-3">
                      {myRaffles.map((raffle) => {
                        const isEnded = raffle.endTime.getTime() < Date.now();
                        return (
                          <Link href={`/raffle/${raffle.id}`} key={raffle.id}>
                            <div className={`p-4 rounded-xl border transition-all hover:scale-[1.01] ${raffle.isDrawn
                              ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
                              : isEnded
                                ? "bg-gray-50 border-gray-200"
                                : "bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200"
                              }`}>
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${raffle.isDrawn
                                      ? "bg-green-200 text-green-700"
                                      : isEnded
                                        ? "bg-gray-200 text-gray-600"
                                        : "bg-purple-200 text-purple-700"
                                      }`}>
                                      {raffle.isDrawn ? "COMPLETED" : isEnded ? "ENDED" : "LIVE"}
                                    </span>
                                    {raffle.isFree && (
                                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-semibold">
                                        FREE
                                      </span>
                                    )}
                                  </div>
                                  <p className="font-display font-bold text-xl text-gray-900">
                                    {raffle.prizeAmount} SOL
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {raffle.ticketsSold}/{raffle.maxTickets} tickets sold
                                  </p>
                                </div>
                                <div className="text-right">
                                  {raffle.isDrawn && raffle.winner && (
                                    <p className="text-xs text-green-600 font-semibold">
                                      Winner: {shortenAddress(raffle.winner, 4)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500">You haven't created any raffles yet.</p>
                      <button
                        onClick={() => setActiveTab("create")}
                        className="mt-4 px-6 py-2 bg-purple-100 text-purple-700 rounded-lg font-display text-sm hover:bg-purple-200 transition-colors"
                      >
                        Create Your First Raffle
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* PROFILE TAB */}
              {activeTab === "profile" && (
                <div className="p-6 bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-xl">
                  <h3 className="font-display font-bold text-lg text-gray-900 mb-6">
                    Creator Profile
                  </h3>

                  <div className="space-y-6">
                    {/* Wallet Address */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Wallet Address
                      </label>
                      <p className="font-mono text-sm text-gray-600 p-3 bg-gray-100 rounded-lg break-all">
                        {publicKey?.toString()}
                      </p>
                    </div>

                    {/* Display Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Display Name
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Enter your display name"
                          className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900
                                     placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <button
                          onClick={handleSaveDisplayName}
                          className="px-6 py-3 bg-purple-500 text-white rounded-xl font-display text-sm hover:bg-purple-600 transition-colors"
                        >
                          Save
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        This name will be shown on your raffles
                      </p>
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                          ✓ Approved Creator
                        </span>
                        {creatorInfo?.approvedAt && (
                          <span className="text-xs text-gray-500">
                            Since {new Date(creatorInfo.approvedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
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
