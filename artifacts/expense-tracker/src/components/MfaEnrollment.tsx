import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { QRCodeSVG } from 'qrcode.react';

export function MfaEnrollment({ onSuccess }: { onSuccess?: () => void }) {
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const startEnrollment = async () => {
    setError(null);
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
    });

    if (error) {
      setError(error.message);
      return;
    }

    setFactorId(data.id);
    setQrCodeUrl(data.totp.qr_code);
  };

  const verifyAndEnable = async (e: React.FormEvent) => {
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

    setSuccess(true);
    if (onSuccess) onSuccess();
  };

  if (success) {
    return (
      <div className="p-4 bg-green-50 text-green-700 rounded-md border border-green-200">
        <h3 className="font-semibold mb-1">MFA Successfully Enabled</h3>
        <p className="text-sm">Two-Factor Authentication is now active for your account.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md p-6 bg-white shadow rounded-lg border border-gray-200">
      <h2 className="text-xl font-semibold mb-4 text-gray-900">Set up Two-Factor Authentication</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm border border-red-200">
          {error}
        </div>
      )}

      {!qrCodeUrl ? (
        <button
          onClick={startEnrollment}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 w-full transition-colors"
        >
          Begin Enrollment
        </button>
      ) : (
        <div className="space-y-6">
          <p className="text-sm text-gray-600">
            Scan this QR code with your authenticator app (e.g., Google Authenticator, Authy, or 1Password).
          </p>
          
          <div className="flex justify-center p-4 bg-gray-50 rounded-lg border border-gray-100">
            <QRCodeSVG value={qrCodeUrl} size={200} />
          </div>

          <form onSubmit={verifyAndEnable} className="space-y-4">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                Enter verification code
              </label>
              <input
                id="code"
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
              className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 transition-colors"
            >
              Verify & Enable
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
