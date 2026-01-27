"use client";

import { useState, useEffect, useCallback } from "react";
import { sortRafflesByPrize } from "@/lib/raffleEngine";
import { getRafflesForDisplay } from "@/lib/raffleStorage";

import Hero from "@/components/Hero";
import BentoGrid from "@/components/BentoGrid";
import WinnersSection from "@/components/WinnersSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import PageTransition from "@/components/PageTransition";
import { RaffleDisplay } from "@/types/payroll";

export default function HomePage() {
  const [filter, setFilter] = useState<"all" | "official" | "community" | "live" | "free" | "ended">("all");
  const [raffles, setRaffles] = useState<RaffleDisplay[]>([]);

  // Load raffles from storage
  const loadRaffles = useCallback(async () => {
    const storedRaffles = await getRafflesForDisplay();
    setRaffles(sortRafflesByPrize(storedRaffles));
  }, []);

  useEffect(() => {
    loadRaffles();
    const interval = setInterval(loadRaffles, 15000); // Polling every 15s
    return () => clearInterval(interval);
  }, [loadRaffles]);

  return (
    <PageTransition>
      <div className="min-h-screen">
        <Hero />
        <BentoGrid raffles={raffles} filter={filter} setFilter={setFilter} />
        <WinnersSection />
        <HowItWorksSection />

        {/* Professional Dark Footer */}
        <footer className="bg-[#111] text-white py-20 px-4 mt-20">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
              {/* Brand */}
              <div className="col-span-1 md:col-span-1">
                <div className="flex items-center gap-3 mb-6">
                  <img src="/logo.svg" alt="PAYROLL" className="h-12 w-auto object-contain" />
                </div>
                <p className="text-gray-500 text-sm leading-relaxed mb-6">
                  The most transparent and fair raffle platform on Solana. Built for the community, powered by blockchain technology.
                </p>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 cursor-pointer transition-colors" />
                  <div className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 cursor-pointer transition-colors" />
                  <div className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 cursor-pointer transition-colors" />
                </div>
              </div>

              {/* Links Columns */}
              <div>
                <h4 className="font-bold text-lg mb-6">Platform</h4>
                <ul className="space-y-4 text-gray-400 text-sm">
                  <li><a href="#" className="hover:text-white transition-colors text-sans">Active Raffles</a></li>
                  <li><a href="#" className="hover:text-white transition-colors text-sans">Create Raffle</a></li>
                  <li><a href="#" className="hover:text-white transition-colors text-sans">My Tickets</a></li>
                  <li><a href="#" className="hover:text-white transition-colors text-sans">Creators</a></li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-lg mb-6 text-sans">Resources</h4>
                <ul className="space-y-4 text-gray-400 text-sm">
                  <li><a href="#" className="hover:text-white transition-colors text-sans">How it Works</a></li>
                  <li><a href="#" className="hover:text-white transition-colors text-sans">Fairness Proof</a></li>
                  <li><a href="#" className="hover:text-white transition-colors text-sans">User Guide</a></li>
                  <li><a href="#" className="hover:text-white transition-colors text-sans">Fees</a></li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-lg mb-6 text-sans">Legal</h4>
                <ul className="space-y-4 text-gray-400 text-sm">
                  <li><a href="#" className="hover:text-white transition-colors text-sans">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-white transition-colors text-sans">Terms of Service</a></li>
                  <li><a href="#" className="hover:text-white transition-colors text-sans">Cookie Policy</a></li>
                </ul>
              </div>
            </div>

            <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-gray-500 text-xs text-sans">
                © 2025 PAYROLL Platform. All rights reserved.
              </p>
              <div className="flex gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span className="text-xs text-gray-400 text-sans">Systems Operational</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </PageTransition>
  );
}
