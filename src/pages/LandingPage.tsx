import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Check, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
export default function LandingPage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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

          {/* Hero Mockup */}
          <div className="mt-20 w-full max-w-5xl mx-auto p-2 sm:p-4 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm shadow-2xl">
            <div className="w-full aspect-[16/9] md:aspect-[21/9] bg-slate-800/50 rounded-2xl border border-white/5 flex items-center justify-center overflow-hidden relative">
               <div className="absolute inset-0 bg-gradient-to-br from-[#d78967]/10 to-transparent" />
               <div className="text-slate-500 font-medium flex items-center gap-3">
                 <span className="w-3 h-3 rounded-full bg-emerald-600 animate-pulse" />
                 Day at a Glance UI
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
              <div className="aspect-[4/3] bg-slate-800 rounded-2xl border border-white/10 shadow-2xl flex items-center justify-center">
                <span className="text-slate-500 font-medium">Daily Budget UI</span>
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
              <div className="aspect-[4/3] bg-slate-800 rounded-2xl border border-white/10 shadow-2xl flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-bl from-teal-500/10 to-transparent" />
                <span className="text-slate-500 font-medium relative z-10">Loan Tracker UI</span>
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
              <div className="aspect-[4/3] bg-slate-800 rounded-2xl border border-white/10 shadow-2xl flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-transparent" />
                <span className="text-slate-500 font-medium relative z-10">Analytics UI</span>
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
