import { motion } from 'framer-motion';
import { bounce } from '@/lib/motion';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session, AuthChangeEvent } from '@supabase/supabase-js';

// Eye icons inline to avoid extra dependencies
function EyeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function EyeOffIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  );
}

type AuthMode = 'login' | 'signup' | 'forgot' | 'reset';

// ── Shared password field renderer ────────────────────────────────────
const PasswordField = ({
  label, value, onChange, show, onToggle, id, placeholder = '••••••••',
}: {
  label: string; value: string; onChange: (v: string) => void;
  show: boolean; onToggle: () => void; id: string; placeholder?: string;
}) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-[#4a6c5c] mb-1.5 uppercase tracking-[.08em] text-[10px]">
      {label}
    </label>
    <div className="flex items-center border border-[#e6ebe3] rounded-xl bg-[#fafaf8] focus-within:ring-2 focus-within:ring-[#559778]/30 focus-within:border-[#559778] transition-all">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
        className="flex-1 px-4 py-3 bg-transparent outline-none text-[#294d40]"
      />
      <motion.button {...bounce}
        type="button"
        onClick={onToggle}
        className="px-3 text-[#87968c] hover:text-emerald-600 dark:text-emerald-500 transition-colors"
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOffIcon /> : <EyeIcon />}
      </motion.button>
    </div>
  </div>
);

export function Auth({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Detect password reset link (Supabase sends back #access_token=...&type=recovery)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setMode('reset');
      // Supabase auto-sets the session from the URL hash
      supabase.auth.getSession(); // trigger session pickup
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      if (session && mode !== 'reset') {
        onAuthenticated();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMode('reset');
        return;
      }
      if (session && mode !== 'reset') {
        onAuthenticated();
      }
    });

    return () => { subscription.unsubscribe(); };
  }, [mode]);

  const clearForm = () => {
    setError(null);
    setMessage(null);
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords don't match. Please try again.");
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
    } else {
      setMessage('Account created! Check your email to confirm your address, then log in.');
    }
    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const redirectTo = `${window.location.origin}${window.location.pathname}`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) {
      setError(error.message);
    } else {
      setMessage('Password reset email sent! Check your inbox and click the link.');
    }
    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
    } else {
      setMessage('Password updated! You can now log in with your new password.');
      await supabase.auth.signOut();
      setTimeout(() => { setMode('login'); clearForm(); }, 2000);
    }
    setLoading(false);
  };





  // ── Reset Password screen (from email link) ────────────────────────────
  if (mode === 'reset') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f4ec] dark:bg-[#121b18] p-4">
        <div className="max-w-md w-full bg-white dark:bg-[#1a2622] p-8 rounded-[24px] shadow-sm border border-[#e6ebe3]">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#e3efe4] text-emerald-600 dark:text-emerald-500 mb-4">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
            </div>
            <h2 className="font-display text-[24px] font-bold text-[#294d40]">Set New Password</h2>
            <p className="text-sm text-[#87968c] mt-1">Choose a strong new password for your account.</p>
          </div>
          {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{error}</div>}
          {message && <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200">{message}</div>}
          <form onSubmit={handleResetPassword} className="space-y-4">
            <PasswordField label="New Password" id="reset-pw" value={password} onChange={setPassword} show={showPassword} onToggle={() => setShowPassword(p => !p)} />
            <PasswordField label="Confirm New Password" id="reset-confirm-pw" value={confirmPassword} onChange={setConfirmPassword} show={showConfirmPassword} onToggle={() => setShowConfirmPassword(p => !p)} />
            <motion.button {...bounce} type="submit" disabled={loading || !password || !confirmPassword}
              className="w-full bg-[#559778] text-white py-3 rounded-xl font-semibold hover:bg-[#437a60] transition-colors disabled:opacity-50 mt-2">
              {loading ? 'Updating…' : 'Update Password'}
            </motion.button>
          </form>
        </div>
      </div>
    );
  }

  // ── Forgot Password screen ─────────────────────────────────────────────
  if (mode === 'forgot') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f4ec] dark:bg-[#121b18] p-4">
        <div className="max-w-md w-full bg-white dark:bg-[#1a2622] p-8 rounded-[24px] shadow-sm border border-[#e6ebe3]">
          <div className="text-center mb-8">
            <h2 className="font-display text-[24px] font-bold text-[#294d40]">Forgot Password?</h2>
            <p className="text-sm text-[#87968c] mt-1">Enter your email and we'll send a reset link.</p>
          </div>
          {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{error}</div>}
          {message && <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200">{message}</div>}
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#4a6c5c] mb-1.5 uppercase tracking-[.08em] text-[10px]">Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full px-4 py-3 border border-[#e6ebe3] rounded-xl focus:ring-2 focus:ring-[#559778]/30 focus:border-[#559778] outline-none transition-all text-[#294d40] bg-[#fafaf8]"
                placeholder="you@example.com" />
            </div>
            <motion.button {...bounce} type="submit" disabled={loading || !email}
              className="w-full bg-[#559778] text-white py-3 rounded-xl font-semibold hover:bg-[#437a60] transition-colors disabled:opacity-50">
              {loading ? 'Sending…' : 'Send Reset Link'}
            </motion.button>
            <motion.button {...bounce} type="button" onClick={() => { setMode('login'); clearForm(); }}
              className="w-full py-2.5 text-sm text-[#87968c] hover:text-[#294d40] transition-colors">
              ← Back to Sign In
            </motion.button>
          </form>
        </div>
      </div>
    );
  }

  // ── Login / Sign Up screens ────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f4ec] dark:bg-[#121b18] p-4">
      <div className="max-w-md w-full bg-white dark:bg-[#1a2622] p-8 rounded-[24px] shadow-sm border border-[#e6ebe3]">
        <div className="text-center mb-8">
          <h2 className="font-display text-[26px] font-bold text-[#294d40] tracking-[-.02em]">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="text-sm text-[#87968c] mt-2">
            {mode === 'login' ? 'Sign in to manage your ledger' : 'Start tracking your expenses'}
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex rounded-2xl border border-zinc-200 dark:border-white/10 bg-[#ebeee7] p-1 mb-6">
          <motion.button {...bounce} type="button" onClick={() => { setMode('login'); clearForm(); }}
            className={`flex h-10 flex-1 items-center justify-center rounded-xl text-xs font-bold transition ${mode === 'login' ? 'bg-white dark:bg-[#1a2622] text-[#24483c] dark:text-[#e4e9e7] shadow-sm' : 'text-[#7a8d81] hover:text-[#24483c] dark:text-[#e4e9e7]'}`}>
            Sign In
          </motion.button>
          <motion.button {...bounce} type="button" onClick={() => { setMode('signup'); clearForm(); }}
            className={`flex h-10 flex-1 items-center justify-center rounded-xl text-xs font-bold transition ${mode === 'signup' ? 'bg-white dark:bg-[#1a2622] text-[#24483c] dark:text-[#e4e9e7] shadow-sm' : 'text-[#7a8d81] hover:text-[#24483c] dark:text-[#e4e9e7]'}`}>
            Create Account
          </motion.button>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{error}</div>}
        {message && <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200">{message}</div>}

        <form onSubmit={mode === 'login' ? handleLogin : handleSignUp} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#4a6c5c] mb-1.5 uppercase tracking-[.08em] text-[10px]">Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full px-4 py-3 border border-[#e6ebe3] rounded-xl focus:ring-2 focus:ring-[#559778]/30 focus:border-[#559778] outline-none transition-all text-[#294d40] bg-[#fafaf8]"
              placeholder="you@example.com" />
          </div>

          <PasswordField
            label="Password" id="main-pw"
            value={password} onChange={setPassword}
            show={showPassword} onToggle={() => setShowPassword(p => !p)}
          />

          {/* Confirm password only on signup */}
          {mode === 'signup' && (
            <PasswordField
              label="Confirm Password" id="confirm-pw"
              value={confirmPassword} onChange={setConfirmPassword}
              show={showConfirmPassword} onToggle={() => setShowConfirmPassword(p => !p)}
            />
          )}

          {/* Forgot password link */}
          {mode === 'login' && (
            <div className="text-right -mt-1">
              <motion.button {...bounce} type="button" onClick={() => { setMode('forgot'); clearForm(); }}
                className="text-xs text-[#559778] hover:text-emerald-600 dark:text-emerald-500 font-semibold transition-colors">
                Forgot password?
              </motion.button>
            </div>
          )}

          <motion.button {...bounce} type="submit" disabled={loading || !email || !password || (mode === 'signup' && !confirmPassword)}
            className="w-full bg-[#559778] text-white py-3 rounded-xl font-semibold hover:bg-[#437a60] transition-colors disabled:opacity-50 mt-1">
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </motion.button>
        </form>
      </div>
    </div>
  );
}
