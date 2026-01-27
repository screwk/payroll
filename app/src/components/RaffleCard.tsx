"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { RaffleDisplay, formatTimeRemaining } from "@/types/payroll";

interface RaffleCardProps {
  raffle: RaffleDisplay;
  index?: number;
}

export default function RaffleCard({ raffle, index = 0 }: RaffleCardProps) {
  const [timeRemaining, setTimeRemaining] = useState(formatTimeRemaining(raffle.endTime));
  const [isUrgent, setIsUrgent] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = formatTimeRemaining(raffle.endTime);
      setTimeRemaining(remaining);
      const diff = raffle.endTime.getTime() - Date.now();
      setIsUrgent(diff > 0 && diff < 3600000);
    }, 1000);
    return () => clearInterval(interval);
  }, [raffle.endTime]);

  const progressPercent = (raffle.ticketsSold / raffle.maxTickets) * 100;
  const isEnded = raffle.endTime.getTime() < Date.now();

  return (
    <Link href={`/raffle/${raffle.id}`}>
      <div
        className="group relative opacity-0 animate-[page-enter_0.6s_ease-out_forwards]"
        style={{ animationDelay: `${index * 0.1}s` }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Card Container */}
        <div className={`
          relative overflow-hidden rounded-2xl cursor-pointer
          bg-white
          border border-[var(--color-muted)]
          shadow-sm
          transform transition-all duration-300 ease-out
          ${isHovered ? 'scale-[1.02] border-orange/40 shadow-lg shadow-orange/10' : 'scale-100'}
        `}>
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange via-orange-bright to-orange" />

          {/* Badges Row */}
          <div className="relative flex items-center justify-between p-4 pb-0">
            {/* Type Badge - Official or Community */}
            <div className="flex items-center gap-2">
              {raffle.raffleType === "community" ? (
                <div className="relative">
                  <div className="px-2.5 py-1 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-full border border-purple-200">
                    <span className="font-display font-bold text-[9px] text-purple-700 uppercase tracking-[0.15em]">
                      Community
                    </span>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className="px-2.5 py-1 bg-gradient-to-r from-orange-100 to-amber-100 rounded-full border border-orange-200">
                    <span className="font-display font-bold text-[9px] text-orange uppercase tracking-[0.15em]">
                      Official
                    </span>
                  </div>
                </div>
              )}

              {/* Free Badge */}
              {raffle.isFree && (
                <div className="relative">
                  <div className="absolute inset-0 bg-gold/30 blur-md rounded-full" />
                  <div className="relative px-2.5 py-1 bg-gradient-to-r from-gold to-amber rounded-full">
                    <span className="font-display font-bold text-[9px] text-void uppercase tracking-[0.15em]">
                      FREE
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Status Badge */}
            <div className={`ml-auto ${raffle.isFree ? '' : ''}`}>
              {isEnded ? (
                raffle.isDrawn && raffle.winner ? (
                  <div className="px-3 py-1 bg-emerald-100 rounded-full border border-emerald-200">
                    <span className="font-display text-[10px] text-emerald-700 uppercase tracking-wider">Winner Drawn</span>
                  </div>
                ) : (
                  <div className="px-3 py-1 bg-muted/30 rounded-full border border-muted/30">
                    <span className="font-display text-[10px] text-text-muted uppercase tracking-wider">Ended</span>
                  </div>
                )
              ) : (
                <div className="flex items-center gap-2 px-3 py-1 bg-orange/10 rounded-full border border-orange/20">
                  <div className="relative">
                    <div className="absolute inset-0 bg-orange rounded-full animate-ping opacity-75" />
                    <div className="relative w-2 h-2 rounded-full bg-orange" />
                  </div>
                  <span className="font-display text-[10px] text-orange uppercase tracking-wider">Live</span>
                </div>
              )}
            </div>
          </div>

          {/* Prize Display - THE HERO */}
          <div className="relative px-6 pt-6 pb-4">
            {/* Prize Amount with clean styling */}
            <div className="text-center">
              {/* SOL Icon */}
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange/10 border border-orange/20 mb-3">
                <svg className="w-6 h-6 text-orange" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                </svg>
              </div>

              {/* Amount */}
              <div className="relative">
                <div className="relative flex items-baseline justify-center gap-1">
                  <span className={`
                    font-display font-bold text-6xl text-orange
                    transition-all duration-300
                    ${isHovered ? 'scale-110' : 'scale-100'}
                  `}>
                    {raffle.prizeAmount}
                  </span>
                  <span className="font-display font-bold text-xl text-orange/60">SOL</span>
                </div>
              </div>

              <p className="text-[11px] text-text-muted uppercase tracking-[0.3em] mt-2">Prize Pool</p>
            </div>
          </div>

          {/* Decorative divider */}
          <div className="relative mx-6 h-px">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
          </div>

          {/* Timer Section */}
          <div className="px-6 py-4">
            <div className="text-center">
              <p className="text-[10px] text-text-dim uppercase tracking-[0.2em] mb-1">
                {isEnded ? "Ended" : "Drawing In"}
              </p>
              <p className={`
                font-mono text-2xl font-bold tracking-wider
                ${isUrgent ? 'text-coral animate-pulse' : 'text-text'}
              `}>
                {timeRemaining}
              </p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="px-6 pb-4">
            <div className="flex items-center justify-between text-center">
              <div className="flex-1">
                <p className="text-[10px] text-text-dim uppercase tracking-wider">Price</p>
                <p className="font-display font-bold text-sm text-text mt-0.5">
                  {raffle.isFree ? (
                    <span className="text-gold">FREE</span>
                  ) : (
                    <>{raffle.ticketPrice} <span className="text-text-muted text-xs">SOL</span></>
                  )}
                </p>
              </div>
              <div className="w-px h-8 bg-muted/30" />
              <div className="flex-1">
                <p className="text-[10px] text-text-dim uppercase tracking-wider">Tickets</p>
                <p className="font-display font-bold text-sm text-text mt-0.5">
                  <span className="text-orange">{raffle.ticketsSold}</span>
                  <span className="text-text-muted">/{raffle.maxTickets}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="px-6 pb-4">
            <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
              {/* Progress fill */}
              <div
                className="relative h-full rounded-full overflow-hidden transition-all duration-700 ease-out"
                style={{ width: `${progressPercent}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-orange to-orange-bright" />
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="p-4 pt-0">
            <button
              className={`
                relative w-full py-3.5 rounded-xl font-display font-bold text-sm uppercase tracking-wider
                overflow-hidden transition-all duration-300
                ${isEnded
                  ? "bg-muted/30 text-text-dim cursor-not-allowed"
                  : "bg-gradient-to-r from-orange via-orange-bright to-orange text-white shadow-[0_4px_20px_rgba(255,140,0,0.3)] hover:shadow-[0_4px_30px_rgba(255,140,0,0.5)] hover:scale-[1.02]"
                }
              `}
              disabled={isEnded}
            >
              {/* Button shine */}
              {!isEnded && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              )}

              <span className="relative">
                {isEnded
                  ? raffle.isDrawn
                    ? "View Winner"
                    : "Drawing Soon"
                  : raffle.isFree
                    ? "Enter Free"
                    : "Buy Tickets"}
              </span>
            </button>
          </div>

          {/* Bottom accent line */}
          <div className="h-px bg-gradient-to-r from-transparent via-orange/30 to-transparent" />
        </div>
      </div>
    </Link>
  );
}
