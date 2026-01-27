"use client";

import { useRef, useState, useEffect, ReactNode } from "react";

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
  delay?: number;
}

export default function AnimatedCard({
  children,
  className = "",
  glowColor = "rgba(255, 140, 0, 0.3)",
  delay = 0,
}: AnimatedCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // Intersection Observer for scroll animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
        }
      },
      { threshold: 0.1, rootMargin: "50px" }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [delay]);

  // Mouse tracking for 3D tilt effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    setMousePosition({ x, y });
  };

  const tiltX = isHovered ? (mousePosition.y - 0.5) * 10 : 0;
  const tiltY = isHovered ? (mousePosition.x - 0.5) * -10 : 0;
  const glowX = mousePosition.x * 100;
  const glowY = mousePosition.y * 100;

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setMousePosition({ x: 0.5, y: 0.5 });
      }}
      className={`
        relative transition-all duration-500 ease-out
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}
        ${className}
      `}
      style={{
        transform: `
          perspective(1000px)
          rotateX(${tiltX}deg)
          rotateY(${tiltY}deg)
          ${isVisible ? "translateY(0)" : "translateY(48px)"}
          ${isHovered ? "scale(1.02)" : "scale(1)"}
        `,
        transition: isHovered
          ? "transform 0.1s ease-out"
          : "transform 0.5s ease-out, opacity 0.5s ease-out",
      }}
    >
      {/* Glow effect following mouse */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 pointer-events-none"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(circle at ${glowX}% ${glowY}%, ${glowColor} 0%, transparent 50%)`,
        }}
      />

      {/* Glassmorphism border */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background: `linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%, rgba(255, 140, 0, 0.1) 100%)`,
          opacity: isHovered ? 1 : 0.5,
          transition: "opacity 0.3s ease-out",
        }}
      />

      {/* Shine effect on hover */}
      <div
        className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none"
        style={{
          opacity: isHovered ? 1 : 0,
        }}
      >
        <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          style={{
            transform: `translateX(${isHovered ? "100%" : "-100%"})`,
            transition: "transform 0.6s ease-out",
          }}
        />
      </div>

      {children}
    </div>
  );
}
