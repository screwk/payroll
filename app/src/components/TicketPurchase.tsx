"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { RaffleDisplay } from "@/types/payroll";

interface TicketPurchaseProps {
  raffle: RaffleDisplay;
  onPurchase: (quantity: number) => Promise<void>;
  userTickets?: number;
  isLoading?: boolean;
}

export default function TicketPurchase({
  raffle,
  onPurchase,
  userTickets = 0,
  isLoading = false,
}: TicketPurchaseProps) {
  const { connected } = useWallet();
  const [quantity, setQuantity] = useState(1);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const maxPurchasable = raffle.maxTickets - raffle.ticketsSold;
  const totalCost = raffle.ticketPrice * quantity;

  const handlePurchase = async () => {
    if (!connected || isPurchasing) return;
    setIsPurchasing(true);
    try {
      await onPurchase(quantity);
      setQuantity(1);
    } catch (error) {
      console.error("Purchase failed:", error);
    } finally {
      setIsPurchasing(false);
    }
  };

  const incrementQuantity = () => {
    if (quantity < maxPurchasable) setQuantity(quantity + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  if (raffle.isEnded) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="relative p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-500 font-display">This raffle has ended</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="relative p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange/10 border border-orange/20 mb-3">
            <svg className="w-6 h-6 text-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
          </div>
          <h3 className="font-display font-bold text-xl text-text mb-1">
            {raffle.isFree ? "Enter Raffle" : "Buy Tickets"}
          </h3>
          <p className="text-sm text-text-muted">
            {raffle.isFree ? "Reserve your free entry" : `${maxPurchasable} tickets remaining`}
          </p>
        </div>

        {/* Quantity Selector */}
        {!raffle.isFree && (
          <div className="mb-6">
            <label className="block text-xs text-text-dim uppercase tracking-wider mb-3">Select Quantity</label>
            <div className="flex items-center gap-3">
              <button
                onClick={decrementQuantity}
                disabled={quantity <= 1}
                className="w-14 h-14 rounded-xl bg-elevated/50 border border-muted/30 text-text font-bold text-2xl
                           hover:border-orange/50 hover:text-orange transition-all
                           disabled:opacity-30 disabled:cursor-not-allowed"
              >
                -
              </button>
              <div className="flex-1 text-center py-3 bg-elevated/30 rounded-xl border border-muted/20">
                <span className="font-display font-bold text-4xl text-text">{quantity}</span>
                <p className="text-[10px] text-text-dim uppercase tracking-wider mt-1">tickets</p>
              </div>
              <button
                onClick={incrementQuantity}
                disabled={quantity >= maxPurchasable}
                className="w-14 h-14 rounded-xl bg-elevated/50 border border-muted/30 text-text font-bold text-2xl
                           hover:border-orange/50 hover:text-orange transition-all
                           disabled:opacity-30 disabled:cursor-not-allowed"
              >
                +
              </button>
            </div>

            {/* Quick select */}
            <div className="flex gap-2 mt-4">
              {[1, 5, 10, 25].map((num) => (
                <button
                  key={num}
                  onClick={() => setQuantity(Math.min(num, maxPurchasable))}
                  disabled={num > maxPurchasable}
                  className={`
                    flex-1 py-2.5 rounded-lg font-display text-sm transition-all
                    ${quantity === num
                      ? "bg-gradient-to-r from-orange to-amber text-white shadow-[0_2px_10px_rgba(255,140,0,0.3)]"
                      : "bg-elevated/30 text-text-muted hover:bg-orange/10 hover:text-orange border border-muted/20"
                    }
                    disabled:opacity-30 disabled:cursor-not-allowed
                  `}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Cost Summary */}
        {!raffle.isFree && (
          <div className="mb-6 p-4 rounded-xl bg-elevated/30 border border-muted/20">
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="text-text-muted">Ticket Price</span>
              <span className="font-mono text-text">{raffle.ticketPrice} SOL</span>
            </div>
            <div className="flex items-center justify-between mb-3 text-sm">
              <span className="text-text-muted">Quantity</span>
              <span className="font-mono text-text">x{quantity}</span>
            </div>

            {/* Divider */}
            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-dashed border-muted/30" />
              </div>
              <div className="relative flex justify-center">
                <div className="w-3 h-3 bg-elevated rotate-45 border-t border-l border-muted/30" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-display font-bold text-text">Total</span>
              <div className="text-right">
                <span className="font-display font-bold text-2xl bg-gradient-to-r from-orange to-gold bg-clip-text text-transparent">
                  {totalCost.toFixed(4)}
                </span>
                <span className="font-display font-bold text-lg text-orange ml-1">SOL</span>
              </div>
            </div>
          </div>
        )}

        {/* Purchase Button */}
        {connected ? (
          <button
            onClick={handlePurchase}
            disabled={isPurchasing || isLoading || maxPurchasable === 0}
            className={`
              relative w-full py-4 rounded-xl font-display font-bold text-lg uppercase tracking-wider
              overflow-hidden transition-all duration-300 group
              ${isPurchasing || isLoading
                ? "bg-muted/30 text-text-dim cursor-wait"
                : maxPurchasable === 0
                  ? "bg-muted/30 text-text-dim cursor-not-allowed"
                  : "bg-gradient-to-r from-orange via-orange-bright to-orange text-white shadow-[0_4px_20px_rgba(255,140,0,0.4)] hover:shadow-[0_4px_30px_rgba(255,140,0,0.6)] hover:scale-[1.02]"
              }
            `}
          >
            {/* Shine effect */}
            {!isPurchasing && !isLoading && maxPurchasable > 0 && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            )}

            <span className="relative flex items-center justify-center gap-2">
              {isPurchasing || isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </>
              ) : maxPurchasable === 0 ? (
                "Sold Out"
              ) : raffle.isFree ? (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Enter for Free
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Buy {quantity} Ticket{quantity > 1 ? "s" : ""}
                </>
              )}
            </span>
          </button>
        ) : (
          <div className="space-y-4">
            <div className="text-center p-4 rounded-xl bg-elevated/30 border border-dashed border-orange/30">
              <svg className="w-8 h-8 text-orange mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <p className="text-sm text-text-muted">
                Connect wallet to {raffle.isFree ? "enter" : "purchase"}
              </p>
            </div>
            <WalletMultiButton className="!w-full !justify-center" />
          </div>
        )}

        {/* Disclaimer */}
        <p className="mt-4 text-[10px] text-text-dim text-center leading-relaxed">
          By {raffle.isFree ? "entering" : "purchasing"}, you agree to the raffle terms.
          {!raffle.isFree && " All transactions are final and non-refundable."}
        </p>
      </div>

      {/* Bottom accent */}
      <div className="h-1 bg-gradient-to-r from-transparent via-orange/50 to-transparent" />
    </div>
  );
}
