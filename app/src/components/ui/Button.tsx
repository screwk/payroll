"use client";

import { motion } from 'motion/react';
import Link from 'next/link';
import type { ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
    variant?: ButtonVariant;
    size?: ButtonSize;
    children: ReactNode;
    icon?: ReactNode;
    iconPosition?: 'left' | 'right';
    loading?: boolean;
    fullWidth?: boolean;
    className?: string;
    disabled?: boolean;
    onClick?: () => void;
    type?: 'button' | 'submit' | 'reset';
    as?: 'button' | 'link' | 'a';
    to?: string;
    href?: string;
    target?: string;
    rel?: string;
}

const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-orange-500 text-white hover:bg-orange-600',
    secondary: 'bg-black text-white hover:bg-gray-900',
    outline: 'border-2 border-black text-black hover:bg-black hover:text-white',
    ghost: 'text-black hover:bg-black/5'
};

const sizeStyles: Record<ButtonSize, string> = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
};

export default function Button({
    variant = 'primary',
    size = 'md',
    children,
    icon,
    iconPosition = 'left',
    loading = false,
    fullWidth = false,
    className = '',
    disabled = false,
    onClick,
    type = 'button',
    as = 'button',
    to,
    href,
    target,
    rel
}: ButtonProps) {
    const baseStyles = `
        inline-flex items-center justify-center gap-2
        font-black uppercase tracking-tight
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
    `.trim().replace(/\s+/g, ' ');

    const content = (
        <>
            {loading && (
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                />
            )}
            {!loading && icon && iconPosition === 'left' && icon}
            <span>{children}</span>
            {!loading && icon && iconPosition === 'right' && icon}
        </>
    );

    if (as === 'link' && to) {
        return (
            <Link href={to} onClick={onClick} className="contents">
                <motion.span
                    className={baseStyles}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    {content}
                </motion.span>
            </Link>
        );
    }

    if (as === 'a' && href) {
        return (
            <motion.a
                href={href}
                target={target}
                rel={rel}
                className={baseStyles}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClick}
            >
                {content}
            </motion.a>
        );
    }

    return (
        <motion.button
            type={type}
            className={baseStyles}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            disabled={loading || disabled}
            onClick={onClick}
        >
            {content}
        </motion.button>
    );
}
