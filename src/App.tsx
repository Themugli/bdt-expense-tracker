import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/toaster';
import { supabase } from '@/lib/supabase';
import { getActiveSession, saveActiveSession } from '@/lib/auth';
import type { User } from '@/types';
import LandingPage from '@/pages/LandingPage';
import DailyLedger from '@/pages/DailyLedger';
import MonthlyOverview from '@/pages/MonthlyOverview';
import YearlyOverview from '@/pages/YearlyOverview';
import LoanTracker from '@/pages/LoanTracker';
import { Sidebar } from '@/components/ui/sidebar';
import { TopNav } from '@/components/ui/TopNav';
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
        if (!currentSession || !currentSession.isGuest) {
          const guestUser: User = {
            id: 'guest_v2',
            name: 'Guest User',
            email: 'guest@device.local',
          };
          saveActiveSession({ user: guestUser, isGuest: true });
        }
      }
      setIsInitializing(false);
    });
  }, []);

  if (isInitializing) {
    return <div className="min-h-screen flex items-center justify-center bg-[#f4f4ec] dark:bg-[#121b18]">Loading...</div>;
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/*"
            element={
              <>
                <Sidebar />
                <TopNav />
                <Routes>
                  <Route path="/daily" element={<DailyLedger />} />
                  <Route path="/monthly" element={<MonthlyOverview />} />
                  <Route path="/yearly" element={<YearlyOverview />} />
                  <Route path="/loans" element={<LoanTracker />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </>
            }
          />
        </Routes>
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
