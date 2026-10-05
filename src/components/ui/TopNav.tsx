import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { bounce } from '@/lib/motion';
import { getActiveSession, saveActiveSession } from '@/lib/auth';
import { AuthModal } from '@/components/features/AuthModal';
import { Wallet, ChevronDown, LogOut, Sun, Moon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useLocation, Link } from 'react-router-dom';
import { useTheme } from 'next-themes';

export function TopNav() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const session = getActiveSession();
  const isGuest = session?.isGuest ?? true;
  const currentUser = session?.user;
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const handleOpen = () => setShowAuthModal(true);
    window.addEventListener('open-auth-modal', handleOpen);
    return () => window.removeEventListener('open-auth-modal', handleOpen);
  }, []);

  // Close the menu if we navigate
  useEffect(() => {
    setUserMenuOpen(false);
  }, [location.pathname]);

  return (
    <>
      <header className="flex flex-row items-center justify-between w-full pr-6 pl-20 py-5 sm:pr-10 sm:pl-24 lg:pr-24 lg:pl-[120px] bg-[#fcfcf9] dark:bg-[#1a2622] z-40 relative">
        {/* Empty left spacer to maintain justify-between balance */}
        <div className="w-11"></div>
        
        {/* Logo Section - Centered */}
        <Link 
          to="/daily" 
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-3 hover:opacity-70 transition-opacity cursor-pointer z-50"
        >
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#dce9dc] dark:bg-[#344c43] text-[#347d68]">
            <Wallet size={21} strokeWidth={1.8} />
          </div>
          <div>
            <div className="font-display text-[19px] font-extrabold tracking-[-.045em] text-[#24483c] dark:text-[#e4e9e7]">
              little ledger<span className="text-[#d78967]">.</span>
            </div>
            <div className="text-[11px] font-medium tracking-[.12em] text-[#819087] dark:text-[#88a096]">
              YOUR MONEY, IN PERSPECTIVE
            </div>
          </div>
        </Link>

        {/* Profile / Auth Section - Standard flexbox flow, no fixed/absolute positioning here! */}
        <div className="flex items-center gap-3 relative z-50">
          {isGuest ? (
            <motion.button 
              {...bounce}
              onClick={() => setShowAuthModal(true)}
              className="flex items-center justify-center h-10 px-4 rounded-lg bg-slate-900 text-sm font-semibold text-white hover:bg-slate-800 transition shadow-sm"
            >
              Log In
            </motion.button>
          ) : (
            <div className="flex items-center gap-3 relative">
              <motion.button
                {...bounce}
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="grid h-11 w-11 place-items-center rounded-2xl border border-[#dce5dc] dark:border-[#384f46] bg-white dark:bg-[#1a2622] text-[#819087] dark:text-[#88a096] hover:bg-[#f4f5ef] dark:hover:bg-[#2a3c35] transition shadow-sm"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </motion.button>
              
              <div className="relative">
              <motion.button 
                {...bounce}
                type="button"
                onClick={() => setUserMenuOpen((prev) => !prev)}
                className="flex items-center gap-2.5 rounded-2xl border border-[#dce5dc] dark:border-[#384f46] bg-white dark:bg-[#1a2622] p-1.5 pr-3 hover:bg-[#f4f5ef] dark:hover:bg-[#2a3c35] dark:bg-[#23312c] transition shadow-sm"
              >
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#347d68] text-xs font-bold text-white uppercase">
                  {currentUser?.name?.split(' ').map((p) => p[0]).join('').slice(0, 2) || 'U'}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-[#24483c] dark:text-[#e4e9e7] leading-tight">{currentUser?.name || 'User'}</div>
                  <div className="text-[10px] text-[#7f9086] dark:text-[#88a096] leading-tight">Personal Account</div>
                </div>
                <ChevronDown size={14} className="text-[#86968c] dark:text-[#88a096]" />
              </motion.button>

              {userMenuOpen && (
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setUserMenuOpen(false)} 
                />
              )}
              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-56 rounded-2xl border border-[#dce5dc] dark:border-[#384f46] bg-white dark:bg-[#1a2622] p-2 shadow-xl z-50"
                  >
                    <div className="px-3 py-2 border-b border-[#edf0e9] dark:border-[#2a3c35]">
                      <div className="text-xs font-bold text-[#24483c] dark:text-[#e4e9e7]">{currentUser?.name || 'User'}</div>
                      <div className="text-[11px] text-[#819087] dark:text-[#88a096] truncate">{currentUser?.email || ''}</div>
                    </div>
                    <div className="pt-1 border-t border-[#edf0e9] dark:border-[#2a3c35]">
                      <motion.button 
                        {...bounce}
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          saveActiveSession(null);
                          void supabase.auth.signOut();
                          window.location.reload();
                        }}
                        className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-[#b8584b] hover:bg-[#fae9e4] dark:hover:bg-[#4a2b27] dark:bg-[#3a221f] transition"
                      >
                        <LogOut size={16} />
                        <span>Log Out</span>
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </header>

      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLoginSuccess={() => {
          setShowAuthModal(false);
          // Refresh the page or navigate to reset state properly for the new user
          window.location.reload();
        }}
      />
    </>
  );
}
