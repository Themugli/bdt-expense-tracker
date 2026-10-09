const fs = require('fs');
let content = fs.readFileSync('src/pages/DailyLedger.tsx', 'utf-8');

// 1. Add useLoans import
if (!content.includes('useLoans')) {
  content = content.replace("import { useExpenses, newExpenseId } from '@/hooks/useExpenses';", "import { useExpenses, newExpenseId } from '@/hooks/useExpenses';\nimport { useLoans } from '@/hooks/useLoans';");
}

// 2. Add useLoans hook inside component
if (!content.includes('const { loans } = useLoans();')) {
  content = content.replace("const { expenses, addExpense, updateExpense, deleteExpense } = useExpenses();", "const { expenses, addExpense, updateExpense, deleteExpense } = useExpenses();\n  const { loans } = useLoans();");
}

// 3. Update the daily variables
const old_vars_regex = /const todayExpenses = useMemo\([\s\S]*?const todayFilteredExpenses = useMemo\([\s\S]*?\[todayExpenses, categoryFilter, tagFilter\],\n  \);/;
const new_vars = `const todayExpenses = useMemo(() => expenses.filter((e) => e.date === today), [expenses, today]);
  const todaySpent = todayExpenses.reduce((sum, item) => sum + item.amount, 0);
  
  const currentMonthPrefix = today.slice(0, 7);
  const expensesThisMonthBeforeToday = useMemo(() =>
    expenses.filter((e) => e.date.startsWith(currentMonthPrefix) && e.date < today)
      .reduce((sum, e) => sum + e.amount, 0),
  [expenses, today, currentMonthPrefix]);

  const startOfDayBudget = activeIncome - expensesThisMonthBeforeToday;
  const todayRemainingMonthlyPool = startOfDayBudget - todaySpent;
  const todayRawUsage = startOfDayBudget > 0 ? (todaySpent / startOfDayBudget) * 100 : todaySpent > 0 ? 100 : 0;
  const todayUsage = Math.min(100, Math.max(0, Math.round(todayRawUsage)));
  const todayBalanceTone = todaySpent > startOfDayBudget ? 'over' : todayRawUsage >= 70 ? 'careful' : 'steady';
  
  const totalLoanDue = useMemo(() => loans.filter(l => l.type === 'payable' && l.status === 'active').reduce((sum, l) => sum + Number(l.amount), 0), [loans]);

  const todayCategoryTotals = useMemo(() => categories.map((item) => ({
    ...item,
    spent: todayExpenses.filter((entry) => entry.category === item.name).reduce((total, entry) => total + entry.amount, 0),
  })), [categories, todayExpenses]);
  const todayPieData = todayCategoryTotals.filter((item) => item.spent > 0).map((item) => ({ name: item.name, value: item.spent }));
  const todayFilteredExpenses = useMemo(
    () => todayExpenses.filter((expense) =>
      (categoryFilter === 'all' || expense.category === categoryFilter) &&
      (tagFilter === 'all' || expense.tags.includes(tagFilter)),
    ),
    [todayExpenses, categoryFilter, tagFilter],
  );`;
content = content.replace(old_vars_regex, new_vars);

// 4. Overhaul "Day at a Glance" and "Daily Detail Cards" in the Daily Tab
const oldDailyDetail = `              <div className="mt-2 flex justify-between text-[11px] text-[#8a9990] dark:text-[#88a096]"><span>৳0</span><span>{todayRemaining < 0 ? \`\${fmtMoney(Math.abs(todayRemaining))} over\` : \`\${fmtMoney(todayRemaining)} to go\`}</span><span>{fmtMoney(dailyBudget)}</span></div>
              <p className="mt-4 flex items-center gap-2 text-xs leading-relaxed text-[#71857a] dark:text-[#88a096]">
                {todaySpent === 0 ? <CircleHelp size={14} /> : todayRemaining < 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {todaySpent === 0 ? 'A fresh page. Add your first expense when you’re ready.' : todayRemaining < 0 ? 'You’ve gone a little beyond today’s target.' : \`\${fmtMoney(todayRemaining)} is still available for the rest of your day.\`}
              </p>
            </div>
          </div>
        </section>

        <section className="glass-card mb-5 rounded-[24px] p-5 sm:p-6" data-testid="daily-detail-panel">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div><p className="mb-1 text-xs font-semibold uppercase tracking-[.12em] text-[#9a8c77]">Daily detail</p><h2 className="font-display text-[21px] font-bold tracking-[-.04em] text-[#294d40] dark:text-[#e4e9e7]">{new Date(\`\${today}T12:00:00\`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</h2></div>
            <span className="rounded-full bg-[#edf2e9] dark:bg-[#253630] px-3 py-1 text-xs font-semibold text-[#628675]">{todayExpenses.length} {todayExpenses.length === 1 ? 'entry' : 'entries'}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-[#f4f5ef] dark:bg-[#23312c]/80 p-4"><p className="text-xs text-[#819087] dark:text-[#88a096]">Daily target</p><p data-testid="text-detail-daily-income" className="mt-1 font-display text-xl font-bold text-[#355a4d] dark:text-[#d1dbd6]">{fmtMoney(dailyBudget)}</p></div>
            <div className="rounded-2xl bg-[#f4f5ef] dark:bg-[#23312c]/80 p-4"><p className="text-xs text-[#819087] dark:text-[#88a096]">Total spent today</p><p data-testid="text-detail-daily-spent" className="mt-1 font-display text-xl font-bold text-[#355a4d] dark:text-[#d1dbd6]">{fmtMoney(todaySpent)}</p></div>
            <div className={\`rounded-2xl p-4 \${todayRemaining < 0 ? 'bg-[#fae9e4] dark:bg-[#3a221f]' : 'bg-[#e8f0e7]'}\`}><p className="text-xs text-[#819087] dark:text-[#88a096]">{todayRemaining < 0 ? 'Deficit' : 'Savings'}</p><p data-testid="text-detail-daily-savings" className={\`mt-1 font-display text-xl font-bold \${todayRemaining < 0 ? 'text-[#b8584b]' : 'text-[#347d68]'}\`}>{todayRemaining < 0 ? \`−\${fmtMoney(Math.abs(todayRemaining))}\` : fmtMoney(todayRemaining)}</p></div>
          </div>
        </section>`;

const newDailyDetail = `              <div className="mt-2 flex justify-between text-[11px] text-[#8a9990] dark:text-[#88a096]"><span>৳0</span><span>{todayRemainingMonthlyPool < 0 ? \`\${fmtMoney(Math.abs(todayRemainingMonthlyPool))} over pool\` : \`\${fmtMoney(todayRemainingMonthlyPool)} remaining this month\`}</span><span>{fmtMoney(startOfDayBudget)}</span></div>
              <p className="mt-4 flex items-center gap-2 text-xs leading-relaxed text-[#71857a] dark:text-[#88a096]">
                {todaySpent === 0 ? <CircleHelp size={14} /> : todayRemainingMonthlyPool < 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {todaySpent === 0 ? 'A fresh page. Add your first expense when you’re ready.' : todayRemainingMonthlyPool < 0 ? 'You’ve gone beyond your total monthly budget.' : \`You used \${todayUsage}% of your available monthly budget today.\`}
              </p>
            </div>
          </div>
        </section>

        <section className="glass-card mb-5 rounded-[24px] p-5 sm:p-6" data-testid="daily-detail-panel">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div><p className="mb-1 text-xs font-semibold uppercase tracking-[.12em] text-[#9a8c77]">Daily detail</p><h2 className="font-display text-[21px] font-bold tracking-[-.04em] text-[#294d40] dark:text-[#e4e9e7]">{new Date(\`\${today}T12:00:00\`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</h2></div>
            <span className="rounded-full bg-[#edf2e9] dark:bg-[#253630] px-3 py-1 text-xs font-semibold text-[#628675]">{todayExpenses.length} {todayExpenses.length === 1 ? 'entry' : 'entries'}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-[#f4f5ef] dark:bg-[#23312c]/80 p-4"><p className="text-xs text-[#819087] dark:text-[#88a096]">Available Budget</p><p data-testid="text-detail-daily-income" className="mt-1 font-display text-xl font-bold text-[#355a4d] dark:text-[#d1dbd6]">{fmtMoney(startOfDayBudget)}</p></div>
            <div className="rounded-2xl bg-[#f4f5ef] dark:bg-[#23312c]/80 p-4"><p className="text-xs text-[#819087] dark:text-[#88a096]">Total spent today</p><p data-testid="text-detail-daily-spent" className="mt-1 font-display text-xl font-bold text-[#355a4d] dark:text-[#d1dbd6]">{fmtMoney(todaySpent)}</p></div>
            <div className="rounded-2xl bg-[#f4f5ef] dark:bg-[#23312c]/80 p-4"><p className="text-xs text-[#819087] dark:text-[#88a096]">Total Loan Due</p><p data-testid="text-detail-daily-savings" className="mt-1 font-display text-xl font-bold text-[#b8584b]">{fmtMoney(totalLoanDue)}</p></div>
          </div>
        </section>`;
        
content = content.replace(oldDailyDetail, newDailyDetail);

// 5. Pie chart spacing (Daily and Monthly)
// We need to replace: `<div className="grid items-center gap-3 sm:grid-cols-[.9fr_1.1fr]">` with `<div className="w-full flex flex-row items-center justify-between gap-4">`
// And the pie chart wrapper: `<div className="relative h-[190px] w-full">` to `<div className="relative h-[190px] w-[190px] shrink-0">`
// And the legend wrapper: `<div className="space-y-3">` to `<div className="flex-1 space-y-3">`

content = content.replaceAll('<div className="grid items-center gap-3 sm:grid-cols-[.9fr_1.1fr]">', '<div className="w-full flex flex-row items-center justify-between gap-4">');
content = content.replaceAll('<div className="relative h-[190px] w-full">', '<div className="relative h-[190px] w-[190px] shrink-0">');
content = content.replaceAll('<div className="space-y-3">', '<div className="flex-1 space-y-3 min-w-[50%]">');

fs.writeFileSync('src/pages/DailyLedger.tsx', content);
