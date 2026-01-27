"use client";

import { ReactNode } from "react";

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

// LIGHTWEIGHT Button - sem efeitos magnéticos pesados
export default function MagneticButton({
  children,
  className = "",
  onClick,
  disabled = false,
  variant = "primary",
  size = "md",
}: MagneticButtonProps) {
  const variants = {
    primary: `
      bg-gradient-to-r from-orange to-orange-bright
      text-white font-bold
      shadow-lg shadow-orange/30
      hover:shadow-xl hover:shadow-orange/40
      hover:scale-[1.02]
      active:scale-[0.98]
    `,
    secondary: `
      bg-transparent border-2 border-orange
      text-orange font-bold
      hover:bg-orange/10
    `,
    ghost: `
      bg-transparent text-text-muted
      hover:text-orange hover:bg-orange/5
    `,
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative overflow-hidden rounded-xl font-display uppercase tracking-wider
        transition-all duration-200 ease-out
        ${variants[variant]}
        ${sizes[size]}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${className}
      `}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
}
