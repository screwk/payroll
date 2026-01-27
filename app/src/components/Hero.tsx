'use client';

import { ArrowRight, Ticket } from 'lucide-react';
import { motion } from 'motion/react';
import Marquee from './Marquee';
import RotatingText from './RotatingText';
import Squares from './Squares';
import TextType from './TextType';
import GlareHover from './GlareHover';

const TRUSTED_BY = ["Phantom", "Solflare", "Magic Eden", "Jupiter", "Tensor", "Backpack", "Solana Foundation"];

export default function Hero() {
    return (
        <section className="bg-orange-500 pt-32 pb-0 px-0 relative overflow-hidden min-h-screen flex flex-col justify-between">
            {/* Animated Squares Background */}
            <div className="absolute inset-0 z-0 opacity-20">
                <Squares
                    speed={0.35}
                    squareSize={90}
                    direction="diagonal"
                    borderColor="#ffffff"
                    hoverFillColor="#ff4d00"
                />
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8 items-end">
                    <motion.div
                        className="relative z-20"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <div className="inline-flex items-center gap-2 bg-black text-white px-3 py-1 text-xs font-bold uppercase tracking-wider mb-6">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Live on Solana
                        </div>
                        <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black text-white leading-[0.9] tracking-tighter mb-8 flex flex-col items-start">
                            PAYROLL
                            <RotatingText
                                texts={['ON CHAIN.', 'INSTANT.', 'FAIR.', 'SECURE.']}
                                mainClassName="text-black bg-white px-4 rounded-sm"
                                staggerFrom="last"
                                initial={{ y: "100%", opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: "-100%", opacity: 0 }}
                                staggerDuration={0.025}
                                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                                rotationInterval={3000}
                            />
                        </h1>
                        <p className="text-lg text-white/90 max-w-xl font-medium mb-10 leading-relaxed font-serif">
                            The Most Trusted Raffle Protocol on Solana.
                            Verifiable on-chain randomness, instant automatic payouts, and transparent smart contracts.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={() => document.getElementById("raffles")?.scrollIntoView({ behavior: "smooth" })}
                                className="w-full bg-white text-orange-600 px-8 py-4 font-black text-lg uppercase tracking-tight hover:bg-black hover:text-white transition-all flex items-center justify-center gap-2 group"
                            >
                                Start Playing
                                <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button
                                onClick={() => document.getElementById("raffles")?.scrollIntoView({ behavior: "smooth" })}
                                className="w-full border-2 border-black text-black px-8 py-4 font-black text-lg uppercase tracking-tight hover:bg-black hover:text-white transition-all flex items-center justify-center gap-2"
                            >
                                <Ticket />
                                View Raffles
                            </button>
                        </div>
                    </motion.div>

                    <div className="relative flex justify-center lg:justify-center lg:items-end mt-12 lg:mt-0">
                        {/* Vertical Prize Pool Card with Glare Effect */}
                        <motion.div
                            initial={{ rotate: -2, opacity: 0, y: 20 }}
                            animate={{ rotate: -2, opacity: 1, y: 0 }}
                            whileHover={{ rotate: 0, scale: 1.02 }}
                            transition={{ duration: 0.5 }}
                            className="w-full max-w-sm sm:max-w-md lg:w-[28rem]"
                        >
                            <GlareHover
                                width="100%"
                                height="auto"
                                background="rgba(255, 255, 255, 0.1)"
                                borderRadius="0"
                                borderColor="#ffffff"
                                glareColor="#ffffff"
                                glareOpacity={0.3}
                                glareAngle={135}
                                glareSize={200}
                                transitionDuration={800}
                                className="border-4 border-white backdrop-blur-sm font-sans"
                                style={{ transform: 'inherit' }}
                            >
                                <div className="p-6 sm:p-8 lg:p-10 flex flex-col items-center w-full">
                                    {/* Icon at top */}
                                    <div className="bg-white text-orange-500 p-3 sm:p-4 mb-4 sm:mb-6">
                                        <Ticket size={48} className="sm:w-14 sm:h-14" />
                                    </div>

                                    {/* Prize Pool Section */}
                                    <div className="text-center mb-6 sm:mb-8">
                                        <p className="font-bold text-xs sm:text-sm uppercase opacity-75 text-white tracking-wider mb-2">Prize Pool</p>
                                        <div className="h-12 sm:h-14 flex items-center justify-center">
                                            <TextType
                                                text={['1,500 SOL', '2,000 SOL', '3,500 SOL', '5,000 SOL']}
                                                className="font-black text-4xl sm:text-5xl text-white"
                                                as="p"
                                                typingSpeed={80}
                                                deletingSpeed={50}
                                                pauseDuration={2000}
                                                showCursor={false}
                                                loop={true}
                                            />
                                        </div>
                                    </div>

                                    {/* Progress Bars */}
                                    <div className="space-y-2 sm:space-y-3 w-full mb-6 sm:mb-8">
                                        <div className="h-4 sm:h-5 bg-white/20 w-3/4 mx-auto rounded-full"></div>
                                        <div className="h-4 sm:h-5 bg-white/20 w-1/2 mx-auto rounded-full"></div>
                                    </div>

                                    {/* Timer Section */}
                                    <div className="text-center mb-6 sm:mb-8">
                                        <p className="font-bold text-xs uppercase text-white/75 tracking-wider mb-1">Drawing in</p>
                                        <p className="font-black text-xl sm:text-2xl text-white">3H 12M</p>
                                    </div>

                                    {/* CTA Button */}
                                    <button
                                        onClick={() => document.getElementById("raffles")?.scrollIntoView({ behavior: "smooth" })}
                                        className="bg-black text-white px-6 sm:px-8 py-3 font-bold text-sm sm:text-base uppercase w-full hover:bg-white hover:text-orange-600 transition-colors"
                                    >
                                        Join Now
                                    </button>
                                </div>
                            </GlareHover>
                        </motion.div>
                    </div>
                </div>
            </div>
            <Marquee items={TRUSTED_BY} />
        </section>
    );
}
