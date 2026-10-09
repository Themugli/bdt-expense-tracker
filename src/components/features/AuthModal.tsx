import { motion, AnimatePresence } from 'framer-motion';
import { bounce } from '@/lib/motion';
import { useState, type FormEvent } from 'react';
import {
  ArrowRight, Check, Eye, EyeOff, Lock, Mail, Wallet, X
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { User } from '@/types';
import { getStoredUsers, saveActiveSession, getActiveSession } from '@/lib/auth';


/* =========================================================================
   AUTH LANDING SCREEN (Login / Sign-Up / Demo / Guest)
   ========================================================================= */
interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

export function AuthModal({ isOpen, onClose, onLoginSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  
  const isGuest = getActiveSession()?.isGuest;

  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: loginPassword,
    });

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    if (data.user) {
      let resolvedId = data.user.user_metadata?.ledger_id;
      if (!resolvedId) {
        const localMatch = getStoredUsers().find(u => u.email.toLowerCase() === (data.user.email || '').toLowerCase());
        resolvedId = localMatch ? localMatch.id : data.user.id;
        void supabase.auth.updateUser({ data: { ledger_id: resolvedId } }).catch(console.error);
      }

      const user: User = {
        id: resolvedId,
        name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
        email: data.user.email || loginEmail.trim(),
      };
      
      // Migrate guest data if exists
      if (isGuest) {
        try {
          const guestKey = "little-ledger-expenses-usr-guest_v2";
          const guestData = localStorage.getItem(guestKey);
          if (guestData && guestData !== "[]") {
            const newKey = `little-ledger-expenses-usr-${resolvedId}`;
            const existingData = localStorage.getItem(newKey);
            if (!existingData || existingData === "[]") {
              localStorage.setItem(newKey, guestData);
            } else {
              const existing = JSON.parse(existingData);
              const guest = JSON.parse(guestData);
              localStorage.setItem(newKey, JSON.stringify([...existing, ...guest]));
            }
            localStorage.removeItem(guestKey);
          }
        } catch (err) {
          console.error("Failed to migrate guest data", err);
        }
      }

      if (rememberMe) saveActiveSession({ user, isGuest: false });
      onLoginSuccess(user);
    }
  }

  async function handleSignup(e: FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    
    const localMatch = getStoredUsers().find(u => u.email.toLowerCase() === signupEmail.trim().toLowerCase());
    const initialId = localMatch ? localMatch.id : `usr_${Date.now()}`;

    const { data, error } = await supabase.auth.signUp({
      email: signupEmail.trim(),
      password: signupPassword,
      options: {
        data: { name: signupName.trim(), ledger_id: initialId }
      }
    });

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    if (data.user) {
      const resolvedId = data.user.user_metadata?.ledger_id || initialId;
      const user: User = {
        id: resolvedId,
        name: signupName.trim(),
        email: data.user.email || signupEmail.trim(),
      };
      
      // Migrate guest data if exists
      if (isGuest) {
        try {
          const guestKey = "little-ledger-expenses-usr-guest_v2";
          const guestData = localStorage.getItem(guestKey);
          if (guestData && guestData !== "[]") {
            const newKey = `little-ledger-expenses-usr-${resolvedId}`;
            const existingData = localStorage.getItem(newKey);
            if (!existingData || existingData === "[]") {
              localStorage.setItem(newKey, guestData);
            } else {
              const existing = JSON.parse(existingData);
              const guest = JSON.parse(guestData);
              localStorage.setItem(newKey, JSON.stringify([...existing, ...guest]));
            }
            localStorage.removeItem(guestKey);
          }
        } catch (err) {
          console.error("Failed to migrate guest data", err);
        }
      }

      if (rememberMe) saveActiveSession({ user, isGuest: false });
      onLoginSuccess(user);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-10 sm:px-6">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2, ease: 'linear' }}
            className="absolute inset-0 bg-black/30 backdrop-blur-md" 
            onClick={onClose} 
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="relative w-full max-w-[440px] glass-card overflow-hidden rounded-[30px] border border-zinc-200 dark:border-white/10 bg-[#f8f7f2] dark:bg-[#1a2622]/95 shadow-2xl p-7 sm:p-9 flex flex-col"
          >
            <button onClick={onClose} className="absolute right-5 top-5 grid h-8 w-8 place-items-center rounded-full text-[#768980] dark:text-[#88a096] hover:bg-[#edf1e8] dark:hover:bg-[#344a42] dark:bg-[#253630] transition">
              <X size={18} />
            </button>
            
            <div className="mb-6 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#dce9dc] dark:bg-[#344c43] text-emerald-600 dark:text-emerald-500">
                <Wallet size={21} strokeWidth={1.8} />
              </div>
              <div>
                <div className="font-display text-[20px] font-extrabold tracking-tight text-[#24483c] dark:text-[#e4e9e7]">
                  little ledger<span className="text-emerald-600 dark:text-emerald-500">.</span>
                </div>
                <div className="text-[10px] font-medium tracking-widest text-[#819087] dark:text-[#88a096]">YOUR MONEY, IN PERSPECTIVE</div>
              </div>
            </div>

            <div className="mb-6 flex rounded-2xl border border-zinc-200 dark:border-white/10 bg-[#ebeee7] p-1">
              <motion.button {...bounce}
                type="button"
                onClick={() => { setMode('login'); setErrorMsg(''); }}
                className={`flex h-10 flex-1 items-center justify-center rounded-xl text-xs font-bold transition ${
                  mode === 'login' ? 'bg-white dark:bg-[#1a2622] text-[#24483c] dark:text-[#e4e9e7] shadow-sm' : 'text-[#7a8d81] hover:text-[#24483c] dark:text-[#e4e9e7]'
                }`}
              >
                Log In
              </motion.button>
              <motion.button {...bounce}
                type="button"
                onClick={() => { setMode('signup'); setErrorMsg(''); }}
                className={`flex h-10 flex-1 items-center justify-center rounded-xl text-xs font-bold transition ${
                  mode === 'signup' ? 'bg-white dark:bg-[#1a2622] text-[#24483c] dark:text-[#e4e9e7] shadow-sm' : 'text-[#7a8d81] hover:text-[#24483c] dark:text-[#e4e9e7]'
                }`}
              >
                Create Account
              </motion.button>
            </div>

            {isGuest && (
              <div className="mb-5 rounded-xl bg-[#fffaf0] dark:bg-[#1a2622] p-3.5 border border-[#faecd4] text-[11px] leading-relaxed text-[#8a7251]">
                <strong className="block mb-0.5 text-xs text-[#70583b]">Guest Session Active</strong>
                Your current session data will be lost if you clear your browser without creating an account. Sign up or log in to save your progress permanently.
              </div>
            )}

            {errorMsg && (
              <div className="mb-4 rounded-xl p-3 text-xs leading-relaxed bg-[#fae9e4] dark:bg-[#3a221f] border border-[#f5cfc7] text-[#b8584b]">
                {errorMsg}
              </div>
            )}

            {mode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#667e70]">Email or Username</label>
                  <div className="flex h-11 items-center rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1a2622] px-3 focus-within:border-[#347d68]">
                    <Mail size={16} className="mr-2.5 text-[#8a9d90]" />
                    <input
                      type="text"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full bg-transparent text-sm font-medium text-[#24483c] dark:text-[#e4e9e7] outline-none placeholder:text-[#b4c0b7]"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#667e70]">Password</label>
                  <div className="flex h-11 items-center rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1a2622] px-3 focus-within:border-[#347d68]">
                    <Lock size={16} className="mr-2.5 text-[#8a9d90]" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full bg-transparent text-sm font-medium text-[#24483c] dark:text-[#e4e9e7] outline-none placeholder:text-[#b4c0b7]"
                    />
                    <motion.button {...bounce}
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="ml-2 p-1 text-[#8a9d90] hover:text-[#24483c] dark:text-[#e4e9e7] transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </motion.button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-[#62796d]">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded accent-[#347d68] cursor-pointer"
                    />
                    <span>Remember me on this device</span>
                  </label>
                </div>

                <motion.button {...bounce}
                  type="submit"
                  className="w-full h-11 mt-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 dark:hover:bg-emerald-500 transition"
                >
                  <span>Log In to Ledger</span>
                  <ArrowRight size={16} />
                </motion.button>
              </form>
            ) : (
              <form onSubmit={handleSignup} className="space-y-3.5">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#667e70]">Your Name</label>
                  <input
                    type="text"
                    required
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    className="h-11 w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1a2622] px-3 text-sm font-medium text-[#24483c] dark:text-[#e4e9e7] outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#667e70]">Email Address</label>
                  <input
                    type="email"
                    required
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="h-11 w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1a2622] px-3 text-sm font-medium text-[#24483c] dark:text-[#e4e9e7] outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#667e70]">Create Password</label>
                  <div className="flex h-11 items-center rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1a2622] px-3 focus-within:border-[#347d68]">
                    <input
                      type={showSignupPassword ? "text" : "password"}
                      required
                      minLength={4}
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      className="w-full bg-transparent text-sm font-medium text-[#24483c] dark:text-[#e4e9e7] outline-none placeholder:text-[#b4c0b7]"
                    />
                    <motion.button {...bounce}
                      type="button"
                      onClick={() => setShowSignupPassword((p) => !p)}
                      className="ml-2 p-1 text-[#8a9d90] hover:text-[#24483c] dark:text-[#e4e9e7] transition-colors"
                    >
                      {showSignupPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </motion.button>
                  </div>
                </div>

                <motion.button {...bounce}
                  type="submit"
                  className="w-full h-11 mt-2 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 dark:hover:bg-emerald-500 transition"
                >
                  <span>Create Account &amp; Continue</span>
                  <Check size={16} />
                </motion.button>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}