"use client";

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useAdmin } from '@/providers/AdminProvider';
import { canCreateRaffles } from '@/lib/raffleStorage';
import { shortenAddress } from '@/types/payroll';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, Wallet, Home } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { href: '/', label: 'HOME', icon: Home, anchor: null },
  { href: '/raffles', label: 'LIVE RAFFLES', anchor: null },
  { href: '#winners', label: 'WINNERS', anchor: 'winners' },
  { href: '#how-it-works', label: 'HOW IT WORKS', anchor: 'how-it-works' },
];

export default function Header() {
  const { publicKey, connected, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const { isAdmin } = useAdmin();
  const [isCreator, setIsCreator] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (link: typeof NAV_LINKS[0]) => {
    if (link.anchor) return false; // For anchors, we usually don't show active in the same way as main routes
    return pathname === link.href;
  };

  // Check if user is an approved creator
  useEffect(() => {
    const checkCreator = async () => {
      if (connected && publicKey) {
        const authorized = await canCreateRaffles(publicKey.toString());
        setIsCreator(authorized);
      } else {
        setIsCreator(false);
      }
    };
    checkCreator();
  }, [connected, publicKey]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent, link: typeof NAV_LINKS[0]) => {
    if (link.anchor) {
      e.preventDefault();
      const element = document.getElementById(link.anchor);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      } else if (pathname !== '/') {
        window.location.href = `/${link.href}`;
      }
    }
    setIsMenuOpen(false);
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 h-20 ${isScrolled
          ? 'bg-black/95 backdrop-blur-md text-white shadow-lg'
          : 'bg-orange-500 text-white border-b border-orange-600'
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <motion.img
              src="/logo.svg"
              alt="Payroll Logo"
              className="h-18 w-auto object-contain"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleNavClick(e, link)}
                className={`font-bold transition-all duration-200 relative py-1 ${isActive(link)
                  ? 'text-white'
                  : 'text-white/70 hover:text-white'
                  }`}
              >
                {link.label}
                {isActive(link) && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className={`absolute -bottom-1 left-0 right-0 h-0.5 ${isScrolled ? 'bg-orange-500' : 'bg-black'}`}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </a>
            ))}

            <div className="flex items-center gap-3">
              {connected && (
                <Link
                  href="/my-tickets"
                  className="font-bold text-sm uppercase tracking-wider text-white/70 hover:text-white transition-opacity"
                >
                  My Tickets
                </Link>
              )}

              {(isAdmin || connected) && (
                <Link
                  href={isAdmin ? "/admin" : "/create"}
                >
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-4 py-2 font-bold uppercase transition-colors rounded shadow-sm flex items-center gap-2 ${isScrolled
                      ? 'bg-orange-500 text-white hover:bg-orange-600'
                      : 'bg-white text-orange-500 hover:bg-gray-100'
                      }`}
                  >
                    {isAdmin ? 'Admin Panel' : 'Create Raffle'}
                  </motion.button>
                </Link>
              )}

              {!connected ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setVisible(true)}
                  className={`px-6 py-2 font-bold uppercase transition-colors flex items-center gap-2 ${isScrolled
                    ? 'bg-orange-500 text-white hover:bg-orange-600'
                    : 'bg-black text-white hover:bg-white hover:text-black'
                    }`}
                >
                  <Wallet size={18} />
                  Connect
                </motion.button>
              ) : (
                <div className="flex items-center gap-2">
                  <div className={`hidden sm:flex px-3 py-1.5 rounded-lg text-xs font-bold font-mono items-center gap-2 ${isScrolled ? 'bg-white/10' : 'bg-black/10'}`}>
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    {shortenAddress(publicKey?.toString() || "", 4)}
                  </div>
                  <button
                    onClick={() => disconnect()}
                    className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${isScrolled ? 'bg-white/10 hover:bg-white/20' : 'bg-black/10 hover:bg-black/20'}`}
                    title="Disconnect Wallet"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 relative z-50 rounded-lg bg-white/10 text-white"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[51] md:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-[80%] max-w-sm z-[52] bg-black text-white md:hidden flex flex-col pt-24 px-6"
            >
              <div className="h-20 flex items-center px-6 border-b border-gray-800">
                <span className="font-black text-xl uppercase tracking-tighter">Menu</span>
              </div>

              <div className="flex-1 px-6 py-8 space-y-2 overflow-y-auto">
                {NAV_LINKS.map((link, index) => (
                  <motion.div
                    key={link.label}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <a
                      href={link.href}
                      onClick={(e) => handleNavClick(e, link)}
                      className={`flex items-center gap-3 py-4 font-bold uppercase tracking-wider transition-colors ${isActive(link)
                        ? 'text-orange-500'
                        : 'text-white hover:text-orange-500'
                        }`}
                    >
                      {isActive(link) && (
                        <motion.div
                          layoutId="mobile-indicator"
                          className="w-1 h-6 bg-orange-500 rounded-full"
                        />
                      )}
                      <span className={isActive(link) ? '' : 'ml-4'}>
                        {link.label}
                      </span>
                    </a>
                  </motion.div>
                ))}
              </div>

              <div className="p-6 border-t border-gray-800 space-y-3">
                {(isAdmin || (connected && isCreator)) && (
                  <Link href={isAdmin ? "/admin" : "/community/create"} onClick={() => setIsMenuOpen(false)}>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      className="w-full bg-white text-orange-500 px-6 py-4 font-bold uppercase flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
                    >
                      {isAdmin ? 'Admin Panel' : 'Create Raffle'}
                    </motion.button>
                  </Link>
                )}

                {!connected ? (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setIsMenuOpen(false);
                      setVisible(true);
                    }}
                    className="w-full bg-orange-500 text-white px-6 py-4 font-bold uppercase flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors"
                  >
                    <Wallet size={18} />
                    Connect Wallet
                  </motion.button>
                ) : (
                  <button
                    onClick={() => {
                      disconnect();
                      setIsMenuOpen(false);
                    }}
                    className="w-full bg-red-500/10 text-red-500 py-4 rounded-lg font-black uppercase tracking-tight"
                  >
                    Disconnect Wallet
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
