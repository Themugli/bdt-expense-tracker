import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useExpenses } from '@/hooks/useExpenses';
import { getActiveSession } from '@/lib/auth';

const PREDEFINED_COLORS = [
  '#f87171', '#fb923c', '#fbbf24', '#a3e635', '#4ade80',
  '#34d399', '#2dd4bf', '#22d3ee', '#38bdf8', '#60a5fa',
  '#818cf8', '#a78bfa', '#c084fc', '#e879f9', '#f472b6',
  '#fb7185',
];

function hashString(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function getColorForCategory(name: string) {
  return PREDEFINED_COLORS[hashString(name) % PREDEFINED_COLORS.length];
}

export default function YearlyOverview() {
  const session = getActiveSession();
  const currentUser = session ? session.user : null;
  const isGuest = session ? session.isGuest : true;
  
  const { expenses } = useExpenses({ ledgerId: currentUser?.id ?? null, isGuest });

  const currentYearData = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();

    const yearlyExpenses = expenses.filter((e) => {
      const d = new Date(e.date);
      return d.getFullYear() === currentYear;
    });

    let total = 0;
    const byCategory: Record<string, { total: number; color: string }> = {};

    yearlyExpenses.forEach((e) => {
      total += e.amount;
      if (!byCategory[e.category]) {
        byCategory[e.category] = { total: 0, color: getColorForCategory(e.category) };
      }
      byCategory[e.category].total += e.amount;
    });

    const categories = Object.entries(byCategory)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total);

    return { total, categories };
  }, [expenses]);

  return (
    <div className="min-h-screen bg-[#fcfcf9] dark:bg-[#1a2622] pb-24 pt-8 px-6 sm:px-12 lg:px-24">
      <div className="mx-auto max-w-3xl">
        <header className="mb-12">
          <h1 className="font-display text-[32px] font-extrabold tracking-[-.045em] text-[#24483c] dark:text-[#e4e9e7]">
            Yearly Overview
          </h1>
          <p className="text-sm text-[#597369] dark:text-[#9bb0a6] mt-2">
            Spending for {new Date().getFullYear()}
          </p>
          <div className="mt-8">
            <p className="text-sm font-semibold text-[#768980] dark:text-[#88a096] uppercase tracking-wider mb-1">Total Spent</p>
            <div className="text-[56px] font-bold tracking-tight text-[#24483c] dark:text-[#e4e9e7] leading-none">
              ${currentYearData.total.toFixed(2)}
            </div>
          </div>
        </header>

        <section className="space-y-6">
          {currentYearData.categories.map((cat, index) => {
            const percentage = currentYearData.total > 0 ? (cat.total / currentYearData.total) * 100 : 0;
            return (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5, ease: 'easeOut' }}
                className="group"
              >
                <div className="flex justify-between items-end mb-2">
                  <span className="font-semibold text-[#24483c] dark:text-[#e4e9e7] text-[15px]">{cat.name}</span>
                  <div className="text-right">
                    <span className="font-bold text-[#347d68] text-[15px]">${cat.total.toFixed(2)}</span>
                    <span className="text-[#93a097] dark:text-[#7b9087] text-xs ml-2 font-medium">({percentage.toFixed(1)}%)</span>
                  </div>
                </div>
                <div className="h-4 w-full bg-[#e6ebe3] dark:bg-[#2c3f38] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ type: 'spring', duration: 1.5, bounce: 0, delay: index * 0.1 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                </div>
              </motion.div>
            );
          })}

          {currentYearData.categories.length === 0 && (
            <div className="text-center py-12 text-[#768980] dark:text-[#88a096]">
              No expenses recorded for this year yet.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
