import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MfaEnrollment } from './MfaEnrollment';
import { MfaChallenge } from './MfaChallenge';

export function Auth({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const [needsMfa, setNeedsMfa] = useState(false);
  const [mfaEnrolled, setMfaEnrolled] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        checkMfaStatus(session);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        checkMfaStatus(session);
      } else {
        setSession(null);
        setNeedsMfa(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkMfaStatus = async (currentSession: any) => {
    setSession(currentSession);
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error) {
      console.error(error);
      return;
    }

    if (data.currentLevel === 'aal2') {
      onAuthenticated();
    } else {
      const factors = await supabase.auth.mfa.listFactors();
      if (factors.data && factors.data.totp.length > 0) {
        setMfaEnrolled(true);
      } else {
        setMfaEnrolled(false);
      }
      setNeedsMfa(true);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Signup successful! Please check your email or try logging in.');
    }
    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (needsMfa) {
    if (mfaEnrolled) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#f4f4ec] p-4">
          <MfaChallenge onSuccess={() => onAuthenticated()} />
          <button onClick={handleSignOut} className="mt-6 text-sm text-[#87968c] hover:text-[#294d40]">Sign Out</button>
        </div>
      );
    } else {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#f4f4ec] p-4 space-y-6">
          <div className="max-w-md w-full bg-[#fcf8e3] border border-[#f0c36d] text-[#8a6d3b] p-4 rounded-lg text-sm text-center">
            You must set up Two-Factor Authentication to access your ledger.
          </div>
          <MfaEnrollment onSuccess={() => onAuthenticated()} />
          <button onClick={handleSignOut} className="mt-4 text-sm text-[#87968c] hover:text-[#294d40]">Sign Out</button>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f4ec] p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-[24px] shadow-sm border border-[#e6ebe3]">
        <div className="text-center mb-8">
          <h2 className="font-display text-[26px] font-bold text-[#294d40] tracking-[-.02em]">Expense Tracker</h2>
          <p className="text-sm text-[#87968c] mt-2">Sign in to manage your ledger</p>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{error}</div>}
        {message && <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200">{message}</div>}

        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#4a6c5c] mb-1.5 uppercase tracking-[.08em] text-[10px]">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-[#e6ebe3] rounded-xl focus:ring-2 focus:ring-[#559778]/30 focus:border-[#559778] outline-none transition-all text-[#294d40] bg-[#fafaf8]"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4a6c5c] mb-1.5 uppercase tracking-[.08em] text-[10px]">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-[#e6ebe3] rounded-xl focus:ring-2 focus:ring-[#559778]/30 focus:border-[#559778] outline-none transition-all text-[#294d40] bg-[#fafaf8]"
              placeholder="••••••••"
              required
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleLogin}
              disabled={loading}
              className="flex-1 bg-[#559778] text-white py-3 rounded-xl font-semibold hover:bg-[#437a60] transition-colors disabled:opacity-50"
            >
              Sign In
            </button>
            <button
              onClick={handleSignUp}
              disabled={loading}
              className="flex-1 bg-white text-[#559778] border border-[#e6ebe3] py-3 rounded-xl font-semibold hover:bg-[#f4f8f5] transition-colors disabled:opacity-50"
            >
              Sign Up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
