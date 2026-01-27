"use client";

import { useState, useEffect, useRef, useMemo } from "react";

interface Participant {
  address: string;
  tickets: number;
}

interface SpinningWheelProps {
  participants: Participant[];
  winner?: string;
  isSpinning: boolean;
  onSpinComplete?: () => void;
}

export default function SpinningWheel({
  participants,
  winner,
  isSpinning,
  onSpinComplete,
}: SpinningWheelProps) {
  const [rotation, setRotation] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const totalTickets = participants.reduce((sum, p) => sum + p.tickets, 0);

  // Color palette - vibrant casino colors
  const colors = useMemo(() => [
    "#ff8c00", // orange
    "#ffd700", // gold
    "#ff6b35", // coral
    "#ffb347", // amber
    "#ff4500", // red-orange
    "#ffcc00", // bright gold
    "#ff7518", // pumpkin
    "#ffa500", // pure orange
  ], []);

  // Calculate winner angle
  useEffect(() => {
    if (winner && !isSpinning) {
      let ticketCount = 0;
      let winnerAngle = 0;

      for (const participant of participants) {
        const segmentAngle = (participant.tickets / totalTickets) * 360;
        if (participant.address === winner) {
          winnerAngle = ticketCount + segmentAngle / 2;
          break;
        }
        ticketCount += segmentAngle;
      }

      const spins = 8; // More spins for drama
      const targetRotation = spins * 360 + (360 - winnerAngle - 90);
      setRotation(targetRotation);

      // Show confetti after spin
      setTimeout(() => {
        setShowConfetti(true);
        onSpinComplete?.();
      }, 4000);
    }
  }, [winner, participants, totalTickets, isSpinning, onSpinComplete]);

  // Spinning animation
  useEffect(() => {
    if (isSpinning) {
      const spinInterval = setInterval(() => {
        setRotation((prev) => prev + 25);
      }, 30);
      return () => clearInterval(spinInterval);
    }
  }, [isSpinning]);

  // Confetti animation
  useEffect(() => {
    if (!showConfetti || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 400;
    canvas.height = 400;

    const confettiPieces: Array<{
      x: number;
      y: number;
      r: number;
      color: string;
      vx: number;
      vy: number;
      angle: number;
      angularVel: number;
    }> = [];

    // Create confetti
    for (let i = 0; i < 100; i++) {
      confettiPieces.push({
        x: 200,
        y: 200,
        r: Math.random() * 6 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15 - 5,
        angle: Math.random() * 360,
        angularVel: (Math.random() - 0.5) * 10,
      });
    }

    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      confettiPieces.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.3; // gravity
        p.angle += p.angularVel;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.angle * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.6);
        ctx.restore();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animationId);
  }, [showConfetti, colors]);

  // Build wheel segments
  const segments = useMemo(() => {
    const segs: Array<{ angle: number; size: number; color: string; address: string }> = [];
    let currentAngle = 0;

    participants.forEach((p, i) => {
      const size = (p.tickets / totalTickets) * 360;
      segs.push({
        angle: currentAngle,
        size,
        color: colors[i % colors.length],
        address: p.address,
      });
      currentAngle += size;
    });

    return segs;
  }, [participants, totalTickets, colors]);

  const conicGradient = useMemo(() => {
    if (participants.length === 0) return "conic-gradient(#1a1410 0deg 360deg)";

    let gradient = "conic-gradient(";
    let currentAngle = 0;

    participants.forEach((p, i) => {
      const segmentAngle = (p.tickets / totalTickets) * 360;
      const color = colors[i % colors.length];
      gradient += `${color} ${currentAngle}deg ${currentAngle + segmentAngle}deg, `;
      currentAngle += segmentAngle;
    });

    return gradient.slice(0, -2) + ")";
  }, [participants, totalTickets, colors]);

  return (
    <div className="relative flex flex-col items-center">
      {/* Confetti Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-20"
        style={{ width: "100%", height: "100%" }}
      />

      {/* Outer glow ring */}
      <div className="absolute w-80 h-80 sm:w-[420px] sm:h-[420px] rounded-full bg-orange/20 blur-3xl animate-pulse" />

      {/* Main wheel container */}
      <div className="relative w-72 h-72 sm:w-96 sm:h-96">
        {/* Decorative outer ring with notches */}
        <div className="absolute inset-0 rounded-full border-[6px] border-orange/30 shadow-[0_0_60px_rgba(255,140,0,0.4),inset_0_0_30px_rgba(255,140,0,0.1)]" />

        {/* LED lights around edge */}
        {[...Array(36)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              top: "50%",
              left: "50%",
              transform: `rotate(${i * 10}deg) translateY(-140px) translateX(-50%)`,
              background: i % 2 === 0 ? "#ff8c00" : "#ffd700",
              boxShadow: `0 0 ${isSpinning ? "10px" : "6px"} ${i % 2 === 0 ? "#ff8c00" : "#ffd700"}`,
              animation: isSpinning ? `pulse-live 0.3s ease-in-out infinite ${i * 0.05}s` : "none",
            }}
          />
        ))}

        {/* The wheel */}
        <div
          className="absolute inset-3 rounded-full overflow-hidden shadow-[inset_0_0_40px_rgba(0,0,0,0.5)]"
          style={{
            background: conicGradient,
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning ? "none" : "transform 4s cubic-bezier(0.17, 0.67, 0.05, 0.99)",
          }}
        >
          {/* Segment divider lines */}
          {segments.map((seg, i) => (
            <div
              key={i}
              className="absolute top-1/2 left-1/2 w-1/2 h-[2px] bg-void/40 origin-left"
              style={{ transform: `rotate(${seg.angle}deg)` }}
            />
          ))}

          {/* Participant labels on segments */}
          {segments.map((seg, i) => {
            if (seg.size < 20) return null; // Skip tiny segments
            const labelAngle = seg.angle + seg.size / 2;
            return (
              <div
                key={i}
                className="absolute top-1/2 left-1/2 origin-left"
                style={{
                  transform: `rotate(${labelAngle}deg) translateX(60px)`,
                }}
              >
                <span
                  className="font-mono text-[10px] text-void/80 font-bold"
                  style={{ transform: labelAngle > 90 && labelAngle < 270 ? "rotate(180deg)" : "none" }}
                >
                  {seg.address.slice(0, 4)}...
                </span>
              </div>
            );
          })}

          {/* Center hub - layered 3D effect */}
          <div className="absolute inset-[30%] rounded-full bg-gradient-to-b from-[#2a2118] to-[#1a1410] border-4 border-orange/30 shadow-[0_0_30px_rgba(0,0,0,0.8),inset_0_2px_10px_rgba(255,255,255,0.1)]">
            <div className="absolute inset-2 rounded-full bg-gradient-to-b from-[#231c16] to-[#120e0a] flex items-center justify-center">
              <div className="text-center">
                <span className="font-display font-bold text-3xl sm:text-4xl bg-gradient-to-b from-orange to-amber bg-clip-text text-transparent">
                  {totalTickets}
                </span>
                <p className="text-[9px] sm:text-[10px] text-text-muted uppercase tracking-[0.2em]">
                  Tickets
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Pointer - dramatic triangle */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
          <div className="relative">
            {/* Glow */}
            <div className="absolute inset-0 w-8 h-12 bg-orange blur-lg opacity-60" />
            {/* Pointer shape */}
            <svg width="32" height="48" viewBox="0 0 32 48" className="relative drop-shadow-[0_0_10px_rgba(255,140,0,0.8)]">
              <defs>
                <linearGradient id="pointerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffd700" />
                  <stop offset="50%" stopColor="#ff8c00" />
                  <stop offset="100%" stopColor="#cc7000" />
                </linearGradient>
              </defs>
              <path d="M16 48 L0 12 Q0 0 16 0 Q32 0 32 12 L16 48Z" fill="url(#pointerGrad)" />
              <path d="M16 40 L6 14 Q8 8 16 8 Q24 8 26 14 L16 40Z" fill="rgba(255,255,255,0.2)" />
            </svg>
          </div>
        </div>

        {/* Ticker sound visual (flashing on spin) */}
        {isSpinning && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-6 bg-white animate-pulse rounded-full" />
        )}
      </div>

      {/* Status display */}
      <div className="mt-10 text-center">
        {isSpinning ? (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-3">
              <div className="w-3 h-3 bg-orange rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
              <div className="w-3 h-3 bg-amber rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
              <div className="w-3 h-3 bg-gold rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
            </div>
            <p className="font-display text-2xl text-orange animate-pulse">
              Drawing Winner...
            </p>
          </div>
        ) : winner ? (
          <div className="space-y-4 animate-[page-enter_0.5s_ease-out]">
            <div className="inline-block">
              <p className="text-xs text-text-muted uppercase tracking-[0.3em] mb-2">Winner</p>
              <div className="relative">
                {/* Winner glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-orange via-gold to-orange blur-xl opacity-50" />
                <div className="relative flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-orange/20 via-gold/20 to-orange/20 rounded-2xl border border-orange/40">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gold rounded-full animate-ping opacity-50" />
                    <div className="relative w-4 h-4 rounded-full bg-gradient-to-br from-gold to-orange" />
                  </div>
                  <span className="font-mono text-lg font-bold text-white">
                    {winner.slice(0, 6)}...{winner.slice(-6)}
                  </span>
                  <svg className="w-6 h-6 text-gold" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-text-muted">Waiting to draw...</p>
        )}
      </div>
    </div>
  );
}
