import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Check, Sun, Moon, Sparkles, ArrowDownRight, TrendingUp } from 'lucide-react';
import { useTheme } from 'next-themes';
import { PieChart, Pie, Cell } from 'recharts';

const analyticsCategories = [
  { name: 'Food & Dining', value: 48, amount: '৳7,920', color: '#10B981', bulletClass: 'bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.5)]' },
  { name: 'Subscriptions', value: 24, amount: '৳3,960', color: '#3A3A3C', bulletClass: 'bg-[#3A3A3C]' },
  { name: 'Transportation', value: 18, amount: '৳2,970', color: '#2C2C2E', bulletClass: 'bg-[#2C2C2E]' },
  { name: 'Utilities', value: 10, amount: '৳1,650', color: '#202022', bulletClass: 'bg-[#202022]' },
];
export default function LandingPage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleGetStarted = () => {
    navigate('/daily');
  };

  const faqs = [
    {
      question: "Is my data secure?",
      answer: "Yes. Little Ledger is local-first, meaning your data stays on your device. For cloud backups, we use secure, encrypted database connections."
    },
    {
      question: "How is the daily target calculated?",
      answer: "We take your remaining monthly budget and divide it by the number of days left in the month, automatically adjusting it each day based on your actual spending."
    },
    {
      question: "Can I track multiple loans?",
      answer: "Absolutely. Our integrated loan tracker allows you to manage both payables and receivables in a dedicated dashboard."
    }
  ];

  return (
    <div className="min-h-[100dvh] w-full bg-[#F5F5F7] dark:bg-black text-white font-sans selection:bg-emerald-600/30">
      {/* 1. Glassmorphism Navigation Bar */}
      <nav className="sticky top-0 z-50 w-full backdrop-blur-md bg-[#F5F5F7] dark:bg-black/80 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="font-display text-xl font-bold tracking-tight">
            little ledger<span className="text-emerald-600 dark:text-emerald-500">.</span>
          </div>
          
          {/* Center Links (Hidden on mobile) */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>

          {/* Right CTA */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="grid h-9 w-9 place-items-center rounded-full border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1a2622] text-zinc-600 dark:text-[#88a096] hover:bg-zinc-50 dark:hover:bg-[#2a3c35] transition shadow-sm"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button onClick={handleGetStarted} className="text-sm font-medium text-slate-300 hover:text-white transition-colors hidden sm:block">
              Login
            </button>
            <button onClick={handleGetStarted} className="text-sm font-semibold bg-emerald-600 text-white px-5 py-2 rounded-full hover:bg-emerald-700 transition-colors">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      <main>
        {/* 2. The Hero Section */}
        <section className="px-6 py-32 flex flex-col items-center text-center">
          <p className="text-sm font-semibold tracking-widest text-slate-400 uppercase mb-4">
            A little more clarity, every day.
          </p>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 max-w-4xl leading-tight">
            Your money, <br className="hidden sm:block" />in perspective.
          </h1>
          <p className="max-w-2xl text-slate-400 mx-auto text-lg mb-10">
            Move away from complex spreadsheets and stressful budgeting. 
            Track your daily spending, manage loans, and see your financial health at a glance.
          </p>
          <button onClick={handleGetStarted} className="text-lg font-bold bg-emerald-600 text-white px-8 py-4 rounded-full hover:bg-emerald-700 hover:scale-105 transition-all duration-300 shadow-xl shadow-[#d78967]/20">
            Launch Application
          </button>

          {/* Hero Mockup: Day at a Glance Visual UI */}
          <div className="mt-20 w-full max-w-4xl mx-auto rounded-[2rem] bg-[#0a0a0a] border border-white/10 p-5 sm:p-8 md:p-10 relative overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-500/10 animate-in fade-in slide-in-from-bottom-4 duration-1000 ease-out text-left">
            {/* Intermediate Tray (3-Layer Structure from master.md) */}
            <div className="bg-[#141416]/90 border border-white/10 rounded-[1.75rem] p-5 sm:p-8 relative overflow-hidden shadow-none">
              {/* Concentric Ambient Decorative Rings */}
              <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border border-emerald-500/10" />
              <div className="pointer-events-none absolute -right-2 -top-10 h-44 w-44 rounded-full border border-white/5" />
              <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-emerald-500/5 blur-3xl" />

              {/* Window Header / Status Bar */}
              <div className="mb-6 flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-[#ff5f56]/80" />
                  <span className="h-3 w-3 rounded-full bg-[#ffbd2e]/80" />
                  <span className="h-3 w-3 rounded-full bg-[#27c93f]/80" />
                  <span className="ml-3 text-[11px] font-mono uppercase tracking-wider text-[#86868B]">Daily Ledger • Active Session</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-500 border border-emerald-500/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Tracking
                  </span>
                </div>
              </div>

              {/* Inner Card (Frosted Glassmorphism from master.md) */}
              <div className="rounded-2xl border border-white/10 bg-[#1C1C1E]/80 backdrop-blur-md p-5 sm:p-7 relative z-10 shadow-none">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold text-[#F5F5F7] tracking-tight">Your day at a glance</h3>
                      <p className="text-[11px] text-[#86868B]">Dynamic daily target & pace</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-500 border border-emerald-500/20">
                    42% used
                  </span>
                </div>

                {/* The Progress Bar with glowing drop shadow & dynamic load fill */}
                <div className="mt-5 h-3.5 w-full overflow-hidden rounded-full bg-white/10 p-[2px]">
                  <div
                    className={`h-full rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all duration-1000 ease-out ${
                      mounted ? 'w-[42%]' : 'w-0'
                    }`}
                  />
                </div>

                {/* Budget Amounts */}
                <div className="mt-3 flex items-center justify-between text-[11px] sm:text-xs font-medium text-[#86868B]">
                  <span>৳0</span>
                  <span className="text-[#F5F5F7]/90 font-medium">৳14,500 remaining this month</span>
                  <span>৳1,500 target</span>
                </div>

                {/* Insight Subtext */}
                <p className="mt-5 flex items-center gap-2.5 rounded-xl bg-white/[0.02] border border-white/5 px-3.5 py-2.5 text-xs text-[#86868B]">
                  <ArrowDownRight size={15} className="text-emerald-500 shrink-0" />
                  <span>You used <strong className="text-emerald-500 font-medium">42%</strong> of your available daily budget today. Well within your limit.</span>
                </p>
              </div>

              {/* Complementary Daily Detail Stat Cards (Matching real application) */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 relative z-10">
                <div className="rounded-xl border border-white/10 bg-[#1C1C1E]/60 backdrop-blur-md p-4 transition-colors hover:border-emerald-500/30">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#86868B]">Available Budget</p>
                  <p className="mt-1 font-display text-xl font-bold text-emerald-500">৳1,500</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#1C1C1E]/60 backdrop-blur-md p-4 transition-colors hover:border-emerald-500/30">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#86868B]">Total Spent Today</p>
                  <p className="mt-1 font-display text-xl font-bold text-[#F5F5F7]">৳630</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#1C1C1E]/60 backdrop-blur-md p-4 transition-colors hover:border-emerald-500/30">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#86868B]">Total Loan Due</p>
                  <p className="mt-1 font-display text-xl font-bold text-amber-500/90">৳2,400</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Alternating Z-Pattern Features */}
        <section id="features" className="py-24 px-6 max-w-7xl mx-auto flex flex-col gap-32">
          {/* Feature 1 */}
          <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-24">
            <div className="flex-1 space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">Dynamic Daily Budgeting</h2>
              <p className="text-lg text-slate-400">
                Set a monthly budget and let us do the math. Your daily target automatically adjusts 
                based on what you've spent and how many days are left, keeping you on track without the stress.
              </p>
            </div>
            <div className="flex-1 w-full">
              {/* Feature Mockup: Dynamic Daily Budgeting Engine */}
              <div className="w-full rounded-xl bg-[#0a0a0a] border border-white/10 p-5 sm:p-7 relative overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_15px_30px_-10px_rgba(16,185,129,0.15)] text-left shadow-none group">
                {/* Ambient glow */}
                <div className="pointer-events-none absolute -right-10 -bottom-10 h-48 w-48 rounded-full bg-emerald-500/5 blur-2xl" />

                {/* Window Header / Status Bar with 3 macOS dots */}
                <div className="mb-5 flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]/80" />
                    <span className="ml-2 text-[11px] font-mono uppercase tracking-wider text-[#86868B]">Daily Budget • Target Engine</span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-medium text-emerald-500 border border-emerald-500/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Auto-Calculated
                  </span>
                </div>

                {/* Sleek Inner Card */}
                <div className="rounded-xl border border-white/10 bg-[#1C1C1E] p-4 sm:p-5 relative z-10 shadow-none">
                  {/* Inner Card Header */}
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                        <TrendingUp size={16} />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-semibold text-[#F5F5F7]">Pacing & Target Metric</h4>
                        <p className="text-[10px] text-[#86868B]">Daily allocation calculation</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-500 border border-emerald-500/20">
                      Live Velocity
                    </span>
                  </div>

                  {/* Monthly Target vs Spent So Far comparison */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="rounded-lg border border-white/5 bg-[#141416] p-3.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#86868B]">Monthly Target</p>
                      <p className="mt-1 text-base sm:text-lg font-bold text-[#F5F5F7]">৳45,000</p>
                      <p className="mt-0.5 text-[10px] text-[#86868B]">Total month pool</p>
                    </div>
                    <div className="rounded-lg border border-white/5 bg-[#141416] p-3.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#86868B]">Spent So Far</p>
                      <p className="mt-1 text-base sm:text-lg font-bold text-[#F5F5F7]">৳16,500</p>
                      <p className="mt-0.5 text-[10px] text-emerald-500 font-medium">36.6% pacing</p>
                    </div>
                  </div>

                  {/* Available Numbers & Daily Target */}
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3.5 mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/80">Available Remaining Pool</p>
                      <p className="text-xl sm:text-2xl font-bold text-emerald-500 tracking-tight">৳28,500</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#86868B]">Daily Target</span>
                      <p className="text-sm sm:text-base font-bold text-[#F5F5F7]">৳1,500 <span className="text-[#86868B] text-xs font-normal">/ day</span></p>
                      <span className="text-[10px] text-emerald-500 font-medium">19 days left</span>
                    </div>
                  </div>

                  {/* Visual indicator (mini bar chart / pacing metric) */}
                  <div>
                    <div className="flex items-center justify-between mb-2 text-[10px] text-[#86868B]">
                      <span className="font-bold uppercase tracking-wider">7-Day Spending Velocity</span>
                      <span className="text-emerald-500 font-medium">Ceiling: ৳1,500/d</span>
                    </div>
                    <div className="flex items-end gap-2 h-16 w-full justify-between pt-2 pb-1.5 px-2 bg-[#141416] rounded-lg border border-white/5">
                      <div className="flex flex-col items-center gap-1 flex-1 h-full justify-end">
                        <div className="w-full h-[60%] rounded-sm bg-emerald-500/40" />
                        <span className="text-[9px] font-mono text-[#86868B]">M</span>
                      </div>
                      <div className="flex flex-col items-center gap-1 flex-1 h-full justify-end">
                        <div className="w-full h-[40%] rounded-sm bg-emerald-500/40" />
                        <span className="text-[9px] font-mono text-[#86868B]">T</span>
                      </div>
                      <div className="flex flex-col items-center gap-1 flex-1 h-full justify-end">
                        <div className="w-full h-[75%] rounded-sm bg-emerald-500/40" />
                        <span className="text-[9px] font-mono text-[#86868B]">W</span>
                      </div>
                      <div className="flex flex-col items-center gap-1 flex-1 h-full justify-end">
                        <div className="w-full h-[35%] rounded-sm bg-emerald-500/40" />
                        <span className="text-[9px] font-mono text-[#86868B]">T</span>
                      </div>
                      <div className="flex flex-col items-center gap-1 flex-1 h-full justify-end">
                        <div className="w-full h-[85%] rounded-sm bg-emerald-500/50" />
                        <span className="text-[9px] font-mono text-[#86868B]">F</span>
                      </div>
                      <div className="flex flex-col items-center gap-1 flex-1 h-full justify-end">
                        <div className="w-full h-[50%] rounded-sm bg-emerald-500/40" />
                        <span className="text-[9px] font-mono text-[#86868B]">S</span>
                      </div>
                      <div className="flex flex-col items-center gap-1 flex-1 h-full justify-end">
                        <div className="w-full h-[42%] rounded-sm bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                        <span className="text-[9px] font-mono font-bold text-emerald-500">S</span>
                      </div>
                    </div>
                    <p className="mt-2 text-center text-[11px] text-[#86868B]">
                      Currently pacing <span className="text-emerald-500 font-semibold">18% under</span> your maximum daily ceiling.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex flex-col md:flex-row-reverse items-center gap-12 lg:gap-24">
            <div className="flex-1 space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">Integrated Loan Tracker</h2>
              <p className="text-lg text-slate-400">
                Stop forgetting who owes you money. Manage your payables and receivables in the same ecosystem, 
                with clear balances and history tracking for every person.
              </p>
            </div>
            <div className="flex-1 w-full">
              {/* Feature Mockup: Integrated Loan Tracker */}
              <div className="w-full rounded-xl bg-[#0a0a0a] border border-white/10 p-5 sm:p-7 relative overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_15px_30px_-10px_rgba(16,185,129,0.15)] text-left shadow-none group">
                {/* Ambient background glow */}
                <div className="pointer-events-none absolute -left-10 -bottom-10 h-48 w-48 rounded-full bg-emerald-500/5 blur-2xl" />

                {/* Window Header / Status Bar with 3 macOS dots */}
                <div className="mb-5 flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]/80" />
                    <span className="ml-2 text-[11px] font-mono uppercase tracking-wider text-[#86868B]">Loan Tracker • Double-Entry</span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-medium text-emerald-500 border border-emerald-500/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> 2 Active Ledgers
                  </span>
                </div>

                {/* Two distinct rows / cards: Payables vs Receivables */}
                <div className="space-y-3 relative z-10">
                  {/* Card 1: Payables (Money you owe) */}
                  <div className="rounded-xl border border-white/10 bg-[#1C1C1E] p-4 transition-colors hover:border-white/20">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-400">
                          JD
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-[#F5F5F7] truncate">Owed to John Doe</h4>
                            <span className="shrink-0 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400 border border-amber-500/20">
                              Payable
                            </span>
                          </div>
                          <p className="text-[11px] text-[#86868B] truncate">Office equipment share • Due Oct 24</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-base sm:text-lg font-bold text-amber-500/90 tracking-tight">-৳3,200</span>
                        <p className="text-[10px] text-[#86868B]">Pending</p>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Receivables (Money owed to you) */}
                  <div className="rounded-xl border border-white/10 bg-[#1C1C1E] p-4 transition-colors hover:border-emerald-500/30">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-500">
                          SA
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-[#F5F5F7] truncate">Owed by Sarah Ahmed</h4>
                            <span className="shrink-0 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-500 border border-emerald-500/20">
                              Receivable
                            </span>
                          </div>
                          <p className="text-[11px] text-[#86868B] truncate">Dinner split • Pending settlement</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-base sm:text-lg font-bold text-emerald-500 tracking-tight">+৳7,500</span>
                        <p className="text-[10px] text-[#86868B]">Pending</p>
                      </div>
                    </div>
                  </div>

                  {/* Net summary strip */}
                  <div className="flex items-center justify-between rounded-xl bg-white/[0.02] border border-white/5 px-4 py-3 text-xs text-[#86868B]">
                    <div className="flex items-center gap-2">
                      <ArrowDownRight size={14} className="text-emerald-500" />
                      <span>Net Balance Position:</span>
                    </div>
                    <span className="font-bold text-emerald-500">+৳4,300 <span className="text-[11px] font-normal text-[#86868B]">(in your favor)</span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-24">
            <div className="flex-1 space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">No-Nonsense Analytics</h2>
              <p className="text-lg text-slate-400">
                Beautiful, automated monthly and yearly overviews. See where your money goes 
                with clean charts and categorized breakdowns that make sense at a glance.
              </p>
            </div>
            <div className="flex-1 w-full">
              {/* Feature Mockup: No-Nonsense Analytics Donut Chart */}
              <div className="w-full rounded-xl bg-[#0a0a0a] border border-white/10 p-5 sm:p-7 relative overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_15px_30px_-10px_rgba(16,185,129,0.15)] animate-in fade-in slide-in-from-bottom-8 duration-1000 text-left shadow-none group">
                {/* Ambient glow */}
                <div className="pointer-events-none absolute -right-10 -bottom-10 h-48 w-48 rounded-full bg-emerald-500/5 blur-2xl" />

                {/* Window Header / Status Bar with 3 macOS dots */}
                <div className="mb-5 flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]/80" />
                    <span className="ml-2 text-[11px] font-mono uppercase tracking-wider text-[#86868B]">Analytics • Category Breakdown</span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-medium text-emerald-500 border border-emerald-500/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Monthly View
                  </span>
                </div>

                {/* Sleek Inner Card */}
                <div className="rounded-lg border border-white/5 bg-[#1C1C1E] p-4 sm:p-5 relative z-10 shadow-none">
                  {/* Inner Card Header */}
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs sm:text-sm font-semibold text-[#F5F5F7]">Spending by Category</h4>
                      <p className="text-[10px] text-[#86868B]">Automated monthly categorization</p>
                    </div>
                    <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[10px] font-semibold text-[#86868B] border border-white/10">
                      4 Categories
                    </span>
                  </div>

                  {/* Chart and Legend Layout */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-center">
                    {/* Donut Chart */}
                    <div className="flex justify-center items-center">
                      <div className="relative h-[180px] w-[180px]">
                        <PieChart width={180} height={180}>
                          <Pie
                            data={analyticsCategories}
                            cx={90}
                            cy={90}
                            innerRadius={54}
                            outerRadius={78}
                            paddingAngle={4}
                            dataKey="value"
                            stroke="none"
                            cornerRadius={4}
                          >
                            {analyticsCategories.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-[9px] uppercase font-bold tracking-widest text-[#86868B]">Total Spent</span>
                          <span className="text-base sm:text-lg font-bold text-[#F5F5F7] tracking-tight">৳16,500</span>
                        </div>
                      </div>
                    </div>

                    {/* Minimalist Category Legend */}
                    <div className="space-y-2 w-full">
                      {analyticsCategories.map((category) => (
                        <div
                          key={category.name}
                          className="flex items-center justify-between rounded-lg bg-[#141416] border border-white/5 px-3 py-2 transition-colors hover:border-white/10"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`h-2.5 w-2.5 shrink-0 rounded-full ${category.bulletClass}`}
                            />
                            <span className="truncate text-xs font-medium text-[#F5F5F7]">
                              {category.name}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-semibold text-[#86868B]">
                              {category.amount}
                            </span>
                            <span className="ml-1 text-[10px] text-[#86868B]">
                              ({category.value}%)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary / Top Insight Strip */}
                  <div className="mt-4 flex items-center justify-between rounded-lg bg-white/[0.02] border border-white/5 px-3.5 py-2.5 text-xs text-[#86868B]">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span>Primary Expense:</span>
                    </div>
                    <span className="font-semibold text-[#F5F5F7]">Food & Dining <span className="text-emerald-500 font-bold">(48%)</span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. The Pricing Matrix */}
        <section id="pricing" className="py-24 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-4">Simple pricing.</h2>
            <p className="text-lg text-slate-400">Start for free, upgrade when you need more power.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Tier */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col">
              <h3 className="text-xl font-bold text-white mb-2">Free</h3>
              <p className="text-slate-400 text-sm mb-6">Perfect for getting started with daily tracking.</p>
              <div className="text-4xl font-extrabold text-white mb-8">$0<span className="text-lg text-slate-500 font-medium">/mo</span></div>
              <ul className="space-y-4 mb-8 flex-1">
                {['Basic daily ledger', 'Up to 5 custom categories', 'Monthly overview', 'Local storage only'].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                    <Check size={16} className="text-emerald-600 dark:text-emerald-500 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button onClick={handleGetStarted} className="w-full py-3 rounded-xl font-semibold bg-white/10 text-white hover:bg-white/20 transition-colors">
                Start for free
              </button>
            </div>

            {/* Pro Tier */}
            <div className="bg-white/5 border border-[#d78967]/50 rounded-3xl p-8 flex flex-col relative shadow-[0_0_40px_-15px_rgba(215,137,103,0.3)]">
              <div className="absolute top-0 right-8 -translate-y-1/2 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                MOST POPULAR
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Pro</h3>
              <p className="text-slate-400 text-sm mb-6">For those who want complete financial clarity.</p>
              <div className="text-4xl font-extrabold text-white mb-8">$4<span className="text-lg text-slate-500 font-medium">/mo</span></div>
              <ul className="space-y-4 mb-8 flex-1">
                {['Everything in Free', 'Unlimited categories', 'Integrated Loan Tracker', 'Advanced yearly analytics', 'Cloud backup & sync'].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                    <Check size={16} className="text-emerald-600 dark:text-emerald-500 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button onClick={handleGetStarted} className="w-full py-3 rounded-xl font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-lg shadow-[#d78967]/20">
                Get Pro
              </button>
            </div>

            {/* Lifetime Tier */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col md:col-span-2 lg:col-span-1">
              <h3 className="text-xl font-bold text-white mb-2">Lifetime</h3>
              <p className="text-slate-400 text-sm mb-6">Pay once, use forever. Best long-term value.</p>
              <div className="text-4xl font-extrabold text-white mb-8">$99<span className="text-lg text-slate-500 font-medium">/once</span></div>
              <ul className="space-y-4 mb-8 flex-1">
                {['Everything in Pro', 'One-time payment', 'Early access to features', 'Priority support'].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                    <Check size={16} className="text-emerald-600 dark:text-emerald-500 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button onClick={handleGetStarted} className="w-full py-3 rounded-xl font-semibold bg-white/10 text-white hover:bg-white/20 transition-colors">
                Get Lifetime
              </button>
            </div>
          </div>
        </section>

        {/* 5. FAQ Accordion */}
        <section id="faq" className="py-24 px-6 max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-4">Frequently asked questions</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <button 
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                >
                  <span className="font-semibold text-white">{faq.question}</span>
                  <ChevronDown size={20} className={`text-slate-400 transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                <div 
                  className={`grid transition-all duration-300 ease-in-out ${openFaq === i ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-5 text-slate-400 text-sm leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* 6. Minimalist Footer */}
      <footer className="border-t border-white/10 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col gap-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="font-display text-xl font-bold tracking-tight">
              little ledger<span className="text-emerald-600 dark:text-emerald-500">.</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} little ledger. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-slate-300 transition-colors">Twitter</a>
              <a href="#" className="hover:text-slate-300 transition-colors">GitHub</a>
              <a href="#" className="hover:text-slate-300 transition-colors">Discord</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
