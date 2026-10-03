import { useState, useEffect, type FormEvent } from 'react';
import {
  ArrowRight, Check, Copy, HardDriveDownload, KeyRound, Lock, LockKeyhole,
  LogOut, Mail, PlusCircle, ShieldAlert, ShieldCheck, Sparkles, UserCheck, Wallet, X, Eye, EyeOff
} from 'lucide-react';
import { supabase } from './lib/supabase';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
}

export const USERS_STORAGE_KEY = 'little-ledger-users-v2';
export const SESSION_STORAGE_KEY = 'little-ledger-session-v2';

export const DEFAULT_USERS: User[] = [];

export function getStoredUsers(): User[] {
  try {
    const data = localStorage.getItem(USERS_STORAGE_KEY);
    return data ? JSON.parse(data) : DEFAULT_USERS;
  } catch {
    return DEFAULT_USERS;
  }
}

export function saveStoredUsers(users: User[]) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

export function getActiveSession(): { user: User; isGuest: boolean } | null {
  try {
    const data = localStorage.getItem(SESSION_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function saveActiveSession(session: { user: User; isGuest: boolean } | null) {
  if (session) {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }
}

/* =========================================================================
   AUTH LANDING SCREEN (Login / Sign-Up / Demo / Guest)
   ========================================================================= */
interface AuthLandingProps {
  onLoginSuccess: (user: User, isGuest?: boolean) => void;
}

export function AuthLanding({ onLoginSuccess }: AuthLandingProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

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
      if (rememberMe) saveActiveSession({ user, isGuest: false });
      onLoginSuccess(user, false);
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
      const user: User = {
        id: data.user.user_metadata?.ledger_id || initialId,
        name: signupName.trim(),
        email: data.user.email || signupEmail.trim(),
      };
      if (rememberMe) saveActiveSession({ user, isGuest: false });
      onLoginSuccess(user, false);
    }
  }

  function handleGuestMode() {
    const guestUser: User = {
      id: 'guest_v2',
      name: 'Guest User',
      email: 'guest@device.local',
    };
    saveActiveSession({ user: guestUser, isGuest: true });
    onLoginSuccess(guestUser, true);
  }

  return (
    <main className="money-page min-h-[100dvh] grid place-items-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-5xl animate-fade-in">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#dce9dc] text-[#347d68]">
              <Wallet size={21} strokeWidth={1.8} />
            </div>
            <div>
              <div className="font-display text-[20px] font-extrabold tracking-tight text-[#24483c]">
                little ledger<span className="text-[#d78967]">.</span>
              </div>
              <div className="text-[10px] font-medium tracking-widest text-[#819087]">YOUR MONEY, IN PERSPECTIVE</div>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[#dce5dc] bg-white/80 px-3.5 py-1.5 text-xs font-medium text-[#63796d]">
            <ShieldCheck size={16} className="text-[#347d68]" />
            <span className="hidden sm:inline">Protected with optional 2FA</span>
            <span className="sm:hidden">Secure</span>
          </div>
        </header>

        {/* Main Card */}
        <div className="glass-card grid overflow-hidden rounded-[30px] border border-[#dce5dc] md:grid-cols-[1.1fr_.9fr]">
          {/* Narrative Column */}
          <div className="flex flex-col justify-between p-7 sm:p-10 lg:p-12">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#eef3eb] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#547363]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#347d68]" /> Personal Finance for Bangladesh
              </div>
              <h1 className="font-display text-3xl font-extrabold leading-tight text-[#24483c] sm:text-4xl lg:text-[44px]">
                Every taka counted, <br />
                <span className="text-[#d78967]">under your lock.</span>
              </h1>
              <p className="mt-4 text-sm leading-relaxed text-[#6f8578] max-w-md">
                A private, minimalist expense tracker crafted in Bangladeshi Taka (৳). Track daily commutes, subscriptions, and meals with instant reports, custom tags, and cross-device syncing.
              </p>

              <div className="mt-8 space-y-3.5">
                <div className="flex items-start gap-3.5 rounded-2xl border border-[#e2e9df] bg-white/60 p-3.5">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#e7eee4] text-[#347d68]">
                    <HardDriveDownload size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[#315548]">On-Device Data Sovereignty</h4>
                    <p className="text-[11px] text-[#819087] leading-relaxed">Transactions stay safe in your browser&apos;s private storage, isolated per user.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-[#e6ece3] flex items-center justify-between text-xs text-[#819087]">
              <span>Currency: ৳ (BDT)</span>
              <span>Version 2.0 · 2FA Ready</span>
            </div>
          </div>

          {/* Form Column */}
          <div className="border-t border-[#e2eae0] bg-[#f8f7f2]/90 p-7 sm:p-10 md:border-l md:border-t-0 flex flex-col justify-center">
            {/* View Toggle */}
            <div className="mb-6 flex rounded-2xl border border-[#dce5dc] bg-[#ebeee7] p-1">
              <button
                type="button"
                onClick={() => { setMode('login'); setErrorMsg(''); }}
                className={`flex h-10 flex-1 items-center justify-center rounded-xl text-xs font-bold transition ${
                  mode === 'login' ? 'bg-white text-[#24483c] shadow-sm' : 'text-[#7a8d81] hover:text-[#24483c]'
                }`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => { setMode('signup'); setErrorMsg(''); }}
                className={`flex h-10 flex-1 items-center justify-center rounded-xl text-xs font-bold transition ${
                  mode === 'signup' ? 'bg-white text-[#24483c] shadow-sm' : 'text-[#7a8d81] hover:text-[#24483c]'
                }`}
              >
                Create Account
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 rounded-xl p-3 text-xs leading-relaxed bg-[#fae9e4] border border-[#f5cfc7] text-[#b8584b]">
                {errorMsg}
              </div>
            )}

            {mode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#667e70]">Email or Username</label>
                  <div className="flex h-11 items-center rounded-xl border border-[#dce5dc] bg-white px-3 focus-within:border-[#347d68]">
                    <Mail size={16} className="mr-2.5 text-[#8a9d90]" />
                    <input
                      type="text"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full bg-transparent text-sm font-medium text-[#24483c] outline-none placeholder:text-[#b4c0b7]"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#667e70]">Password</label>
                  <div className="flex h-11 items-center rounded-xl border border-[#dce5dc] bg-white px-3 focus-within:border-[#347d68]">
                    <Lock size={16} className="mr-2.5 text-[#8a9d90]" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full bg-transparent text-sm font-medium text-[#24483c] outline-none placeholder:text-[#b4c0b7]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="ml-2 p-1 text-[#8a9d90] hover:text-[#24483c] transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
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

                <button
                  type="submit"
                  className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-[#347d68] text-sm font-bold text-white shadow-sm hover:bg-[#2d705d] transition"
                >
                  <span>Log In to Ledger</span>
                  <ArrowRight size={16} />
                </button>
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
                    className="h-10 w-full rounded-xl border border-[#dce5dc] bg-white px-3 text-sm font-medium text-[#24483c] outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#667e70]">Email Address</label>
                  <input
                    type="email"
                    required
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="h-10 w-full rounded-xl border border-[#dce5dc] bg-white px-3 text-sm font-medium text-[#24483c] outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#667e70]">Create Password</label>
                  <div className="flex h-10 items-center rounded-xl border border-[#dce5dc] bg-white px-3 focus-within:border-[#347d68]">
                    <input
                      type={showSignupPassword ? "text" : "password"}
                      required
                      minLength={4}
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      className="w-full bg-transparent text-sm font-medium text-[#24483c] outline-none placeholder:text-[#b4c0b7]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword((p) => !p)}
                      className="ml-2 p-1 text-[#8a9d90] hover:text-[#24483c] transition-colors"
                    >
                      {showSignupPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full h-11 mt-1 flex items-center justify-center gap-2 rounded-xl bg-[#347d68] text-sm font-bold text-white shadow-sm hover:bg-[#2d705d] transition"
                >
                  <span>Create Account &amp; Continue</span>
                  <Check size={16} />
                </button>
              </form>
            )}

            {/* Quick Access */}
            <div className="relative my-6 text-center text-[10px] font-bold uppercase tracking-wider text-[#9aa9a0]">
              <span className="bg-[#f8f7f2] px-3 relative z-10">Or quick access</span>
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#dce5dc]" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={handleGuestMode}
                className="h-10 flex items-center justify-center gap-2 rounded-xl border border-[#dce5dc] bg-white/70 px-3 text-xs font-semibold text-[#627a6d] hover:bg-white transition"
              >
                <UserCheck size={14} /> Continue as Guest
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

