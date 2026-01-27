"use client";

import { useState, useEffect } from "react";

export default function ToastNotification() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Show after 2 seconds
        const timer = setTimeout(() => setIsVisible(true), 2000);
        return () => clearTimeout(timer);
    }, []);

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-6 left-6 z-50 animate-[slide-up_0.5s_ease-out_forwards]">
            <div className="bg-white border border-gray-200 shadow-xl rounded-2xl p-4 pr-10 flex items-center gap-4 relative overflow-hidden group">
                <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-orange-500 to-amber-500" />

                {/* Icon */}
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 animate-bounce">
                    <span className="text-xl">🎟️</span>
                </div>

                {/* Text */}
                <div>
                    <p className="font-bold text-gray-900 text-sm">Join the Raffle!</p>
                    <p className="text-gray-500 text-xs">Win big prizes today.</p>
                </div>

                {/* Close Button */}
                <button
                    onClick={() => setIsVisible(false)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
