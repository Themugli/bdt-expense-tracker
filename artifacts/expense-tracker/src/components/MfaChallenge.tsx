import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function MfaChallenge({ onSuccess }: { onSuccess: () => void }) {
  const [verifyCode, setVerifyCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);

  useEffect(() => {
    // Check if the user is already at aal2 or doesn't have MFA enrolled
    supabase.auth.mfa.getAuthenticatorAssuranceLevel().then(({ data, error }) => {
      if (error) {
        setError(error.message);
        return;
      }
      
      if (data.currentLevel === data.nextLevel) {
        // Either already aal2, or the user hasn't set up MFA (aal1)
        if (data.currentLevel === 'aal2') {
          onSuccess();
        }
        return;
      }
    });

    // Find the TOTP factor to challenge
    supabase.auth.mfa.listFactors().then(({ data, error }) => {
      if (error) {
        setError(error.message);
        return;
      }
      const totpFactor = data.totp[0];
      if (totpFactor) {
        setFactorId(totpFactor.id);
      } else {
        setError('No TOTP factors found. Please enroll first.');
      }
    });
  }, [onSuccess]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!factorId) return;

    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: verifyCode,
    });

    if (error) {
      setError(error.message);
      return;
    }

    onSuccess();
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow rounded-lg border border-gray-200">
      <h2 className="text-xl font-semibold mb-4 text-gray-900">Two-Factor Verification Required</h2>
      <p className="text-sm text-gray-600 mb-6">
        Please enter the code from your authenticator app to access secure areas of the application.
      </p>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-4">
        <div>
          <label htmlFor="challenge-code" className="block text-sm font-medium text-gray-700 mb-1">
            Authenticator Code
          </label>
          <input
            id="challenge-code"
            type="text"
            value={verifyCode}
            onChange={(e) => setVerifyCode(e.target.value)}
            placeholder="000000"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required
            autoComplete="one-time-code"
            maxLength={6}
          />
        </div>
        <button
          type="submit"
          disabled={!factorId}
          className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          Verify
        </button>
      </form>
    </div>
  );
}
