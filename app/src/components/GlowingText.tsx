"use client";

import { ReactNode } from "react";

// LIGHTWEIGHT GlowingText - apenas CSS
export default function GlowingText({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={`text-orange ${className}`}>
      {children}
    </span>
  );
}

// Gradient text simples - apenas CSS
export function GradientText({
  children,
  className = "",
  colors,
}: {
  children: ReactNode;
  className?: string;
  colors?: string[];
}) {
  return (
    <span
      className={`bg-gradient-to-r from-orange via-amber to-orange bg-clip-text text-transparent ${className}`}
    >
      {children}
    </span>
  );
}

// SplitText simplificado - apenas mostra o texto
export function SplitText({
  text,
  className = "",
  delay,
  staggerDelay,
}: {
  text: string;
  className?: string;
  delay?: number;
  staggerDelay?: number;
}) {
  return <span className={className}>{text}</span>;
}

// TypewriterText simplificado - apenas mostra o texto
export function TypewriterText({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  return <span className={className}>{text}</span>;
}
