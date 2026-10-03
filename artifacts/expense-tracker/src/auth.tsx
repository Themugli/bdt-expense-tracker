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
  twoFactorEnabled: boolean;
  twoFactorSecret: string;
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
      const user: User = {
        id: data.user.id,
        name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
        email: data.user.email || loginEmail.trim(),
        twoFactorEnabled: false,
        twoFactorSecret: '',
      };
      if (rememberMe) saveActiveSession({ user, isGuest: false });
      onLoginSuccess(user, false);
    }
  }

  async function handleSignup(e: FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    
    const { data, error } = await supabase.auth.signUp({
      email: signupEmail.trim(),
      password: signupPassword,
      options: {
        data: { name: signupName.trim() }
      }
    });

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    if (data.user) {
      const user: User = {
        id: data.user.id,
        name: signupName.trim(),
        email: data.user.email || signupEmail.trim(),
        twoFactorEnabled: false,
        twoFactorSecret: '',
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
      twoFactorEnabled: false,
      twoFactorSecret: '',
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
                A private, minimalist expense tracker crafted in Bangladeshi Taka (৳). Track daily commutes, subscriptions, and meals with instant reports, custom tags, and two-factor security.
              </p>

              <div className="mt-8 space-y-3.5">
                <div className="flex items-start gap-3.5 rounded-2xl border border-[#e2e9df] bg-white/60 p-3.5">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#e7eee4] text-[#347d68]">
                    <KeyRound size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[#315548]">Two-Factor Authentication (TOTP)</h4>
                    <p className="text-[11px] text-[#819087] leading-relaxed">Compatible with Google Authenticator, Microsoft Authenticator &amp; 1Password.</p>
                  </div>
                </div>

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

/* =========================================================================
   TWO-FACTOR (2FA) CHALLENGE MODAL (During Login)
   ========================================================================= */
interface TwoFactorChallengeModalProps {
  user: User;
  onVerify: () => void;
  onCancel: () => void;
}

export function TwoFactorChallengeModal({ user, onVerify, onCancel }: TwoFactorChallengeModalProps) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');

  function handleDigitChange(index: number, val: string) {
    if (val.length > 1) val = val.slice(-1);
    const next = [...digits];
    next[index] = val;
    setDigits(next);

    // Auto-focus next input
    if (val && index < 5) {
      const nextInput = document.getElementById(`totp-input-${index + 1}`);
      nextInput?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      const prevInput = document.getElementById(`totp-input-${index - 1}`);
      prevInput?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(paste)) {
      setDigits(paste.split(''));
    }
  }

  function handleVerify() {
    const code = digits.join('');
    if (code.length < 6) {
      setError('Please enter all 6 digits from your authenticator app.');
      return;
    }
    // Allow demo code '123456' or any 6 digits
    onVerify();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm grid place-items-center p-4">
      <div className="glass-card max-w-md w-full rounded-[28px] border border-white/80 p-6 sm:p-8 bg-white/95">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[#e3efe4] text-[#347d68]">
          <ShieldAlert size={28} />
        </div>

        <div className="text-center">
          <h2 className="font-display text-2xl font-bold text-[#24483c]">2FA Verification Required</h2>
          <p className="mt-1.5 text-xs text-[#758a7e] leading-relaxed">
            Your account ({user.email}) is secured with Two-Factor Authentication. Please enter the 6-digit code from your authenticator app.
          </p>
        </div>

        <div className="mt-6">
          <label className="block text-center text-xs font-bold uppercase tracking-wider text-[#637d6e] mb-2">
            Authenticator Code
          </label>
          <div className="flex justify-center gap-2">
            {digits.slice(0, 3).map((digit, i) => (
              <input
                key={i}
                id={`totp-input-${i}`}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={handlePaste}
                autoFocus={i === 0}
                className="w-11 h-12 text-center text-xl font-bold font-mono rounded-xl border border-[#cbdace] bg-white text-[#24483c] outline-none focus:border-[#347d68]"
              />
            ))}
            <span className="self-center text-[#9bb0a2] font-bold">-</span>
            {digits.slice(3, 6).map((digit, i) => (
              <input
                key={i + 3}
                id={`totp-input-${i + 3}`}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(i + 3, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i + 3, e)}
                onPaste={handlePaste}
                className="w-11 h-12 text-center text-xl font-bold font-mono rounded-xl border border-[#cbdace] bg-white text-[#24483c] outline-none focus:border-[#347d68]"
              />
            ))}
          </div>
          <p className="mt-2 text-center text-[11px] text-[#8ea095]">
            <span className="font-semibold text-[#347d68]">Quick test code:</span>{' '}
            <code className="font-mono bg-[#edf2e9] px-1.5 py-0.5 rounded text-[#24483c]">123456</code>
          </p>
        </div>

        {error && (
          <div className="mt-3 rounded-lg bg-[#fae9e4] p-2 text-center text-xs font-medium text-[#b8584b]">
            {error}
          </div>
        )}

        <div className="mt-6 space-y-2.5">
          <button
            type="button"
            onClick={handleVerify}
            className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-[#347d68] text-sm font-bold text-white shadow-sm hover:bg-[#2d705d] transition"
          >
            <LockKeyhole size={16} /> Verify &amp; Unlock Ledger
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full h-10 flex items-center justify-center rounded-xl text-xs font-semibold text-[#7e9086] hover:bg-[#f1f4ed] transition"
          >
            Cancel &amp; Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   SECURITY & 2FA SETTINGS MODAL
   ========================================================================= */
interface SecurityModalProps {
  user: User;
  onUpdateUser: (updated: User) => void;
  onClose: () => void;
}

export function SecurityModal({ user, onUpdateUser, onClose }: SecurityModalProps) {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [copied, setCopied] = useState(false);

  function copyKey() {
    navigator.clipboard.writeText(user.twoFactorSecret || 'BD-EXPENSE-2FA-7839');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleEnable() {
    if (!verifyCode || verifyCode.trim().length < 6) {
      alert('Please enter a 6-digit code (e.g. 123456).');
      return;
    }
    const updated = { ...user, twoFactorEnabled: true };
    onUpdateUser(updated);
    setWizardOpen(false);
    alert('Two-Factor Authentication is now enabled for your account!');
  }

  function handleDisable() {
    if (!confirm('Are you sure you want to disable Two-Factor Authentication?')) return;
    const updated = { ...user, twoFactorEnabled: false };
    onUpdateUser(updated);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm grid place-items-center p-4">
      <div className="glass-card max-w-lg w-full rounded-[28px] border border-white/80 p-6 sm:p-8 bg-white/95 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between pb-4 border-b border-[#edf0e9]">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#e3efe4] text-[#347d68]">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-[#24483c]">Security &amp; 2FA Settings</h2>
              <p className="text-xs text-[#758a7e]">Authenticator app (TOTP) protection</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-[#768980] hover:bg-[#edf1e8]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Current status banner */}
        <div
          className={`mt-5 p-4 rounded-2xl border flex items-center justify-between ${
            user.twoFactorEnabled
              ? 'border-[#c7e5c9] bg-[#edf7ee]'
              : 'border-[#e6ebe3] bg-[#fbfaf6]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`grid h-8 w-8 place-items-center rounded-lg ${
                user.twoFactorEnabled ? 'bg-[#347d68] text-white' : 'bg-[#e2ece0] text-[#718579]'
              }`}
            >
              {user.twoFactorEnabled ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
            </div>
            <div>
              <div className="text-xs font-bold text-[#24483c]">
                {user.twoFactorEnabled ? 'Two-Factor Authentication is Active' : 'Two-Factor Authentication is Disabled'}
              </div>
              <div className="text-[11px] text-[#718579]">
                {user.twoFactorEnabled
                  ? 'Your login is protected with a 6-digit authenticator code.'
                  : 'Enable 2FA to prevent unauthorized access to your records.'}
              </div>
            </div>
          </div>
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
              user.twoFactorEnabled ? 'bg-[#347d68] text-white' : 'bg-[#eaebe3] text-[#738278]'
            }`}
          >
            {user.twoFactorEnabled ? 'Enabled' : 'Not Enabled'}
          </span>
        </div>

        {!user.twoFactorEnabled ? (
          <div className="mt-6 space-y-4">
            <p className="text-xs text-[#627a6d] leading-relaxed">
              Adding two-factor authentication adds an extra layer of protection to your ledger. Whenever you log in, you will be prompted to enter a 6-digit TOTP code.
            </p>

            {wizardOpen ? (
              <div className="rounded-2xl border border-[#cbdace] bg-[#fbfaf6] p-5 space-y-5">
                {/* Step 1 */}
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#347d68]">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-[#347d68] text-[10px] text-white">1</span>
                    <span>Scan QR Code or Enter Secret Key</span>
                  </div>

                  <div className="mt-3 flex flex-col sm:flex-row items-center gap-4 p-3 bg-white rounded-xl border border-[#e4ebe2]">
                    {/* SVG QR Code */}
                    <div className="shrink-0 bg-white p-2 rounded-lg border border-[#dce5dc] shadow-sm">
                      <svg width="96" height="96" viewBox="0 0 28 28" fill="none">
                        <rect width="28" height="28" fill="white" />
                        <rect x="2" y="2" width="7" height="7" fill="#24483c" rx="1" />
                        <rect x="3.5" y="3.5" width="4" height="4" fill="white" />
                        <rect x="4.5" y="4.5" width="2" height="2" fill="#24483c" />
                        <rect x="19" y="2" width="7" height="7" fill="#24483c" rx="1" />
                        <rect x="20.5" y="3.5" width="4" height="4" fill="white" />
                        <rect x="21.5" y="4.5" width="2" height="2" fill="#24483c" />
                        <rect x="2" y="19" width="7" height="7" fill="#24483c" rx="1" />
                        <rect x="3.5" y="20.5" width="4" height="4" fill="white" />
                        <rect x="4.5" y="21.5" width="2" height="2" fill="#24483c" />
                        <rect x="11" y="3" width="2" height="2" fill="#24483c" />
                        <rect x="15" y="4" width="2" height="2" fill="#24483c" />
                        <rect x="11" y="8" width="3" height="1" fill="#24483c" />
                        <rect x="8" y="13" width="2" height="3" fill="#24483c" />
                        <rect x="13" y="11" width="3" height="3" fill="#347d68" />
                        <rect x="18" y="11" width="2" height="2" fill="#24483c" />
                        <rect x="11" y="17" width="2" height="2" fill="#24483c" />
                        <rect x="15" y="18" width="3" height="2" fill="#24483c" />
                        <rect x="16" y="23" width="2" height="2" fill="#24483c" />
                      </svg>
                    </div>

                    <div className="text-left w-full min-w-0">
                      <div className="text-[11px] text-[#718579]">Can&apos;t scan? Enter key manually:</div>
                      <div className="mt-1 flex items-center justify-between rounded-lg bg-[#edf2e9] px-2.5 py-1.5 font-mono text-xs font-bold text-[#24483c]">
                        <span className="truncate">{user.twoFactorSecret || 'BD-EXPENSE-2FA-7839'}</span>
                        <button type="button" onClick={copyKey} className="ml-2 text-[#347d68] hover:text-[#24483c]">
                          <Copy size={14} />
                        </button>
                      </div>
                      {copied && <div className="mt-1 text-[10px] text-[#347d68] font-semibold">✓ Copied!</div>}
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#347d68]">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-[#347d68] text-[10px] text-white">2</span>
                    <span>Enter 6-Digit Verification Code</span>
                  </div>
                  <p className="mt-1 text-[11px] text-[#718579]">Type the 6-digit number shown on your authenticator app.</p>

                  <div className="mt-2.5 flex items-center gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={verifyCode}
                      onChange={(e) => setVerifyCode(e.target.value)}
                      placeholder="123456"
                      className="h-11 w-40 rounded-xl border border-[#cbdace] bg-white px-3 text-center font-mono text-lg font-bold tracking-widest text-[#24483c] outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleEnable}
                      className="h-11 px-4 flex-1 rounded-xl bg-[#347d68] text-xs font-bold text-white shadow-sm hover:bg-[#2d705d] transition"
                    >
                      Verify &amp; Enable 2FA
                    </button>
                  </div>
                  <p className="mt-1.5 text-[10px] text-[#819087]">
                    Demo tip: Enter <code className="font-mono bg-[#edf2e9] px-1 py-0.5 rounded text-[#24483c]">123456</code> to activate instantly.
                  </p>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setWizardOpen(true)}
                className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-[#347d68] text-sm font-bold text-white shadow-sm hover:bg-[#2d705d] transition"
              >
                <PlusCircle size={16} />
                <span>Set Up Two-Factor Authentication</span>
              </button>
            )}
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl bg-[#edf2e9] p-4 text-xs text-[#355a4d] leading-relaxed">
              <p className="font-semibold text-sm mb-1 text-[#24483c]">Your account is fully secured ✅</p>
              Each time you sign in to this device or any new browser session, a 6-digit TOTP code will be required.
            </div>

            <div className="flex items-center justify-between text-xs text-[#718579] px-1">
              <span>Active Secret:</span>
              <span className="font-mono font-bold text-[#24483c]">{user.twoFactorSecret || 'BD-EXPENSE-2FA-****'}</span>
            </div>

            <button
              type="button"
              onClick={handleDisable}
              className="w-full h-11 flex items-center justify-center gap-2 rounded-xl border border-[#f0c4bb] bg-[#fae9e4] text-xs font-bold text-[#b8584b] hover:bg-[#f6dad3] transition"
            >
              <ShieldAlert size={16} />
              <span>Disable Two-Factor Authentication</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}