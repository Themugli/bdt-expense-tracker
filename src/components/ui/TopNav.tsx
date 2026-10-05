import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { bounce } from '@/lib/motion';
import { getActiveSession } from '@/lib/auth';
import { AuthModal } from '@/components/features/AuthModal';
import { useNavigate } from 'react-router-dom';

export function TopNav() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isGuest, setIsGuest] = useState(() => getActiveSession()?.isGuest ?? true);
  const navigate = useNavigate();

  useEffect(() => {
    const handleOpen = () => setShowAuthModal(true);
    window.addEventListener('open-auth-modal', handleOpen);
    return () => window.removeEventListener('open-auth-modal', handleOpen);
  }, []);

  return (
    <>
      {isGuest && (
        <div className="fixed top-5 right-20 sm:top-7 sm:right-24 z-50">
          <motion.button {...bounce}
            onClick={() => setShowAuthModal(true)}
            className="flex items-center justify-center h-11 px-4 rounded-lg bg-slate-900 text-sm font-semibold text-white hover:bg-slate-800 transition shadow-sm"
          >
            Log In
          </motion.button>
        </div>
      )}

      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLoginSuccess={(user) => {
          setShowAuthModal(false);
          setIsGuest(false);
          // Refresh the page or navigate to reset state properly for the new user
          window.location.reload();
        }}
      />
    </>
  );
}
