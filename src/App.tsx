import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { supabase } from '@/lib/supabase';
import { getActiveSession, saveActiveSession } from '@/lib/auth';
import type { User } from '@/types';
import LandingPage from '@/pages/LandingPage';
import DailyLedger from '@/pages/DailyLedger';
import { Sidebar } from '@/components/ui/sidebar';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

export default function App() {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const user: User = {
          id: session.user.user_metadata?.ledger_id || session.user.id,
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
        };
        saveActiveSession({ user, isGuest: false });
      } else {
        const currentSession = getActiveSession();
        if (currentSession && !currentSession.isGuest) {
          saveActiveSession(null);
        }
      }
      setIsInitializing(false);
    });
  }, []);

  if (isInitializing) {
    return <div className="min-h-screen flex items-center justify-center bg-[#f4f4ec]">Loading...</div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/*"
          element={
            <>
              <Sidebar />
              <Routes>
                <Route path="/daily" element={<DailyLedger />} />
                <Route path="/monthly" element={<div className="p-10 text-center">Monthly Overview Placeholder</div>} />
                <Route path="/yearly" element={<div className="p-10 text-center">Yearly Overview Placeholder</div>} />
                <Route path="/loans" element={<div className="p-10 text-center">Loan Tracker Placeholder</div>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </>
          }
        />
      </Routes>
      <Toaster />
    </QueryClientProvider>
  );
}
