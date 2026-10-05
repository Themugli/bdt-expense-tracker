import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();
  const handleGetStarted = () => {
    navigate('/daily');
  };

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden bg-[#f4f4ec] dark:bg-[#121b18] text-[#24483c] dark:text-[#e4e9e7] flex flex-col items-center justify-center">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            borderRadius: ["20%", "50%", "20%"]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] bg-[#e6ebe0]/60 blur-3xl opacity-60"
        />
        <motion.div
          animate={{
            scale: [1, 1.5, 1],
            rotate: [0, -90, 0],
            borderRadius: ["50%", "20%", "50%"]
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -bottom-[10%] -right-[10%] w-[60vw] h-[60vw] bg-[#dbe7d8]/60 blur-3xl opacity-60"
        />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 sm:px-12 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-6 flex items-center justify-center gap-3"
        >
          <div className="font-display text-[24px] sm:text-[32px] font-extrabold tracking-[-.045em] text-[#24483c] dark:text-[#e4e9e7]">
            little ledger<span className="text-[#d78967]">.</span>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="font-display text-[42px] sm:text-[64px] font-bold leading-[1.1] tracking-[-.05em] text-[#24483c] dark:text-[#e4e9e7] mb-6"
        >
          Your money, <br />
          <span className="text-[#d78967]">in perspective.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className="text-lg sm:text-xl text-[#597369] dark:text-[#9bb0a6] font-medium mb-10 max-w-xl"
        >
          A beautifully simple expense tracker designed to bring clarity to your daily spending. 
          No clutter, no noise. Just your finances, beautifully organized.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
        >
          <button
            onClick={handleGetStarted}
            className="rounded-full bg-[#347d68] px-8 py-4 text-sm sm:text-base font-bold text-white shadow-xl shadow-[#347d68]/20 hover:bg-[#2a6855] hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300"
          >
            Get Started
          </button>
        </motion.div>
      </div>

    </div>
  );
}
