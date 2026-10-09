import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Wallet, HandCoins } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const links = [
    { name: 'Ledger', path: '/daily', icon: Wallet },
    { name: 'Loan Tracker', path: '/loans', icon: HandCoins },
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed left-6 top-6 z-50 grid h-11 w-11 place-items-center rounded-full bg-white/50 dark:bg-[#141416] backdrop-blur shadow-sm border border-zinc-200 dark:border-white/10 text-emerald-600 dark:text-emerald-500 hover:bg-white dark:hover:bg-white/5 hover:shadow-md transition-all"
        aria-label="Open menu"
      >
        <Menu size={20} strokeWidth={2} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-50 bg-[#24483c]/20 dark:bg-black/40 backdrop-blur-sm"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 top-0 z-50 w-full max-w-[320px] bg-[#fcfcf9] dark:bg-[#1a2622] p-6 shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between mb-10">
                <div className="font-display text-[19px] font-extrabold tracking-[-.045em] text-[#24483c] dark:text-[#e4e9e7]">
                  little ledger<span className="text-emerald-600 dark:text-emerald-500">.</span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="grid h-10 w-10 place-items-center rounded-full text-[#768980] dark:text-[#88a096] hover:bg-[#edf1e8] dark:hover:bg-[#344a42] dark:bg-[#253630] hover:text-emerald-600 dark:text-emerald-500 transition-colors"
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="flex flex-col gap-2 flex-1">
                {links.map((link) => {
                  const Icon = link.icon;
                  const isActive = location.pathname === link.path;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3.5 rounded-full font-semibold text-sm transition-all group",
                        isActive
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "text-[#597369] dark:text-[#9bb0a6] hover:bg-[#edf2e9] dark:hover:bg-[#344a42] dark:bg-[#253630] hover:text-[#355a4d] dark:text-[#d1dbd6]"
                      )}
                    >
                      <Icon
                        size={18}
                        className={cn("transition-transform group-hover:scale-110", isActive && "text-[#c2dfd3]")}
                      />
                      {link.name}
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-auto pt-6 border-t border-[#e6ebe3]">
                <p className="text-center text-[11px] text-[#93a097] dark:text-[#7b9087]">
                  Your numbers never leave this device
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
