'use client';

import { useState } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { Wallet, Ticket, Shuffle, Trophy, Shield, Zap, Eye, Lock, ChevronDown, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const STEPS = [
    {
        number: "01",
        title: "Connect Wallet",
        description: "Connect your Solana wallet (Phantom, Solflare, Backpack, etc.) to get started. No sign-up required.",
        icon: Wallet,
        color: "bg-orange-500",
        accent: "from-orange-500 to-orange-600"
    },
    {
        number: "02",
        title: "Choose a Raffle",
        description: "Browse active raffles and pick one that interests you. Each raffle shows the prize, ticket price, and odds.",
        icon: Ticket,
        color: "bg-black",
        accent: "from-gray-800 to-black"
    },
    {
        number: "03",
        title: "Buy Tickets",
        description: "Purchase tickets with SOL. Each ticket gives you a chance to win. More tickets = better odds.",
        icon: Zap,
        color: "bg-orange-500",
        accent: "from-orange-500 to-orange-600"
    },
    {
        number: "04",
        title: "Winner Selected",
        description: "When the raffle ends, a winner is selected using Switchboard VRF - verifiable random function on-chain.",
        icon: Shuffle,
        color: "bg-black",
        accent: "from-gray-800 to-black"
    },
    {
        number: "05",
        title: "Instant Payout",
        description: "Winner receives the prize instantly and automatically. No claims needed - it goes straight to your wallet.",
        icon: Trophy,
        color: "bg-orange-500",
        accent: "from-orange-500 to-orange-600"
    }
];

const FEATURES = [
    {
        icon: Shield,
        title: "100% On-Chain",
        description: "Every transaction, ticket purchase, and payout happens on the Solana blockchain. Fully transparent and verifiable."
    },
    {
        icon: Eye,
        title: "Verifiable Randomness",
        description: "We use Switchboard VRF (Verifiable Random Function) to ensure truly random and tamper-proof winner selection."
    },
    {
        icon: Zap,
        title: "Instant Payouts",
        description: "Winners receive their prizes automatically within seconds. No manual claiming or waiting periods."
    },
    {
        icon: Lock,
        title: "Non-Custodial",
        description: "Your funds are never held by us. Smart contracts handle everything - you're always in control of your SOL."
    }
];

const FAQS = [
    {
        question: "How do I know the raffles are fair?",
        answer: "Every winner selection uses Switchboard VRF (Verifiable Random Function), which provides cryptographically secure randomness that can be verified on-chain. You can check any draw transaction on Solscan."
    },
    {
        question: "What wallets are supported?",
        answer: "We support all major Solana wallets including Phantom, Solflare, Backpack, Glow, and any wallet that supports the Solana Wallet Standard."
    },
    {
        question: "How do payouts work?",
        answer: "Payouts are instant and automatic. When a raffle ends and a winner is selected, the prize is transferred directly to the winner's wallet through our smart contract. No manual claiming required."
    },
    {
        question: "What fees do you charge?",
        answer: "We charge a small 2.5% fee on each raffle to cover operational costs and development. This is one of the lowest fees in the ecosystem."
    },
    {
        question: "Can I create my own raffle?",
        answer: "Yes! We're launching creator tools soon that will allow anyone to create their own raffles for NFTs or SOL prizes. Join our Discord for early access."
    }
];

function FAQItem({
    faq,
    index,
    isOpen,
    onToggle
}: {
    faq: typeof FAQS[0];
    index: number;
    isOpen: boolean;
    onToggle: () => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
            className={`bg-white border-2 transition-all overflow-hidden ${isOpen ? 'border-orange-500' : 'border-gray-100 hover:border-gray-200'}`}
            layout
        >
            <button
                onClick={onToggle}
                className="w-full p-4 sm:p-6 font-black uppercase tracking-tight flex justify-between items-center text-left text-sm sm:text-base outline-none"
            >
                <span className="pr-4">{faq.question}</span>
                <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className={`shrink-0 transition-colors ${isOpen ? 'text-orange-500' : 'text-gray-400'}`}
                >
                    <ChevronDown size={24} />
                </motion.span>
            </button>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 sm:px-6 pb-4 sm:pb-6 text-gray-600 text-sm sm:text-base leading-relaxed font-serif">
                            {faq.answer}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export default function HowItWorksSection() {
    const [activeStep, setActiveStep] = useState<number | null>(null);
    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

    const handleFaqToggle = (index: number) => {
        setOpenFaqIndex(openFaqIndex === index ? null : index);
    };

    return (
        <section id="how-it-works" className="scroll-mt-20 overflow-x-clip">
            <div className="relative">
                {/* Vertical Logo Decoration - Animated */}
                <motion.div
                    className="absolute -left-[450px] top-1/2 w-[1200px] max-w-none h-auto select-none pointer-events-none z-10"
                    initial={{
                        opacity: 0,
                        x: -200,
                        y: "-50%",
                        rotate: -90,
                        scale: 0.7
                    }}
                    whileInView={{
                        opacity: 0.15,
                        x: 0,
                        y: "-50%",
                        rotate: -90,
                        scale: 1
                    }}
                    viewport={{ once: true, amount: 0.05 }}
                    transition={{
                        duration: 1.8,
                        ease: [0.25, 0.1, 0.25, 1]
                    }}
                >
                    <motion.img
                        src="/linha.svg"
                        alt=""
                        className="w-full h-auto"
                        animate={{
                            y: [0, -15, 0],
                            scale: [1, 1.02, 1],
                        }}
                        transition={{
                            duration: 8,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                </motion.div>

                {/* Header */}
                <div className="bg-orange-500 pt-12 sm:pt-24 pb-24 sm:pb-32 px-4 sm:px-6 lg:px-8 relative overflow-visible">
                    <div className="max-w-7xl mx-auto relative z-10">
                        <div className="ml-0 sm:ml-[200px] md:ml-[280px] lg:ml-[360px]">
                            <motion.h2
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="text-4xl sm:text-5xl md:text-7xl font-black uppercase tracking-tighter text-white mb-4 sm:mb-6"
                            >
                                How It Works
                            </motion.h2>
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.1 }}
                                className="text-white/80 text-base sm:text-lg max-w-xl font-serif"
                            >
                                Payroll makes participating in raffles simple, transparent, and fair.
                            </motion.p>
                        </div>
                    </div>

                    {/* Mascot - Think pose */}
                    <motion.div
                        className="absolute right-0 sm:right-auto sm:left-12 md:left-20 bottom-0 z-20 pointer-events-none"
                        initial={{ x: -100, opacity: 0, scale: 0.8 }}
                        whileInView={{ x: 0, opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{
                            duration: 0.8,
                            ease: "easeOut",
                            opacity: { duration: 0.6 },
                            scale: { duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }
                        }}
                    >
                        {/* Glow effect behind mascot */}
                        <motion.div
                            className="absolute inset-0 bg-white/20 blur-3xl rounded-full"
                            animate={{
                                opacity: [0.2, 0.4, 0.2],
                                scale: [1, 1.1, 1],
                            }}
                            transition={{
                                duration: 3,
                                ease: "easeInOut",
                                repeat: Infinity,
                            }}
                        />

                        <motion.img
                            src="/vasko1010.svg"
                            alt="Payroll Mascot Thinking"
                            className="relative h-[200px] sm:h-[320px] md:h-[420px] lg:h-[520px] object-contain drop-shadow-2xl"
                            animate={{
                                y: [0, -4, 0],
                            }}
                            transition={{
                                duration: 3.5,
                                ease: "easeInOut",
                                repeat: Infinity,
                            }}
                        />
                    </motion.div>
                </div>

                {/* Interactive Steps Timeline */}
                <div className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-offwhite relative">
                    <div className="max-w-6xl mx-auto">
                        <motion.h3
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-center mb-12 sm:mb-16"
                        >
                            5 Simple Steps
                        </motion.h3>

                        {/* Desktop Timeline */}
                        <div className="hidden lg:block relative">
                            {/* Timeline Line */}
                            <div className="absolute top-12 left-0 right-0 h-1 bg-gray-200">
                                <motion.div
                                    className="h-full bg-orange-500"
                                    initial={{ width: "0%" }}
                                    whileInView={{ width: "100%" }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                />
                            </div>

                            <div className="grid grid-cols-5 gap-4 relative">
                                {STEPS.map((step, index) => (
                                    <motion.div
                                        key={step.number}
                                        initial={{ opacity: 0, y: 30 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.15 }}
                                        className="flex flex-col items-center"
                                        onMouseEnter={() => setActiveStep(index)}
                                        onMouseLeave={() => setActiveStep(null)}
                                    >
                                        {/* Icon Circle */}
                                        <motion.div
                                            whileHover={{ scale: 1.15, rotate: 5 }}
                                            whileTap={{ scale: 0.95 }}
                                            className={`relative w-24 h-24 ${step.color} flex items-center justify-center cursor-pointer z-10 shadow-lg`}
                                        >
                                            <step.icon size={36} className="text-white" />
                                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-white text-black font-black text-sm flex items-center justify-center shadow-md">
                                                {step.number}
                                            </div>
                                        </motion.div>

                                        {/* Content */}
                                        <div className="mt-6 text-center">
                                            <h4 className="text-lg font-black uppercase tracking-tight mb-2">
                                                {step.title}
                                            </h4>
                                            <AnimatePresence>
                                                {activeStep === index && (
                                                    <motion.p
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: "auto" }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className="text-gray-600 text-sm max-w-[180px] mx-auto font-serif"
                                                    >
                                                        {step.description}
                                                    </motion.p>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Mobile/Tablet Steps */}
                        <div className="lg:hidden space-y-4">
                            {STEPS.map((step, index) => (
                                <motion.div
                                    key={step.number}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="bg-white p-4 sm:p-6 border-2 border-gray-100 flex items-start gap-4"
                                >
                                    <div className={`w-16 h-16 sm:w-20 sm:h-20 ${step.color} flex items-center justify-center shrink-0 relative`}>
                                        <step.icon size={32} className="text-white" />
                                        <span className="absolute -top-2 -right-2 w-6 h-6 sm:w-7 sm:h-7 bg-white text-black font-black text-xs sm:text-sm flex items-center justify-center shadow">
                                            {step.number}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-lg sm:text-xl font-black uppercase tracking-tight mb-1 sm:mb-2">
                                            {step.title}
                                        </h4>
                                        <p className="text-gray-600 text-sm sm:text-base leading-relaxed font-serif">
                                            {step.description}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Features */}
                <div className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-black relative">
                    <div className="max-w-7xl mx-auto relative z-20">
                        <motion.h3
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-center mb-12 sm:mb-16 text-white"
                        >
                            Why Choose <span className="text-orange-500">Payroll</span>
                        </motion.h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                            {FEATURES.map((feature, index) => (
                                <motion.div
                                    key={feature.title}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    whileHover={{ y: -10 }}
                                    className="group bg-white/5 border border-white/10 p-6 sm:p-8 text-center cursor-default transition-all hover:border-orange-500/50 hover:bg-white/10"
                                >
                                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-orange-500 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                                        <feature.icon size={28} className="text-white" />
                                    </div>
                                    <h4 className="text-lg sm:text-xl font-black uppercase text-white mb-2 sm:mb-3 group-hover:text-orange-500 transition-colors">
                                        {feature.title}
                                    </h4>
                                    <p className="text-gray-400 text-sm leading-relaxed font-serif">
                                        {feature.description}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-offwhite relative">
                    <div className="max-w-3xl mx-auto">
                        <motion.h3
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-center mb-12 sm:mb-16"
                        >
                            Frequently Asked <span className="text-orange-500">Questions</span>
                        </motion.h3>

                        <div className="space-y-3 sm:space-y-4">
                            {FAQS.map((faq, index) => (
                                <FAQItem
                                    key={index}
                                    faq={faq}
                                    index={index}
                                    isOpen={openFaqIndex === index}
                                    onToggle={() => handleFaqToggle(index)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA - Ready to Play */}
            <div className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-orange-500 relative overflow-hidden">
                {/* Background decoration */}
                <motion.div
                    className="absolute inset-0 opacity-10"
                    animate={{
                        backgroundPosition: ["0% 0%", "100% 100%"]
                    }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        repeatType: "reverse"
                    }}
                    style={{
                        backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
                        backgroundSize: "30px 30px"
                    }}
                />

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <motion.h3
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl sm:text-4xl md:text-6xl font-black uppercase tracking-tighter text-white mb-4 sm:mb-6"
                    >
                        Ready to Play?
                    </motion.h3>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-white/80 text-base sm:text-lg mb-8 sm:mb-10 px-4 font-serif"
                    >
                        Join thousands of players winning NFTs and SOL every day.
                    </motion.p>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => document.getElementById("raffles")?.scrollIntoView({ behavior: "smooth" })}
                        className="bg-black text-white px-8 sm:px-10 py-4 sm:py-5 font-black uppercase tracking-tight text-base sm:text-lg hover:bg-white hover:text-black transition-colors inline-flex items-center gap-2 group"
                    >
                        Browse Live Raffles
                        <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                    </motion.button>
                </div>
            </div>
        </section>
    );
}
