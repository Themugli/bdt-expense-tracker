const fs = require('fs');
let content = fs.readFileSync('src/pages/DailyLedger.tsx', 'utf-8');

// 1. activeTab
content = content.replace(
  "const [activeTab, setActiveTab] = useState<'monthly' | 'yearly'>('monthly');",
  "const [activeTab, setActiveTab] = useState<'daily' | 'monthly' | 'yearly'>('daily');"
);

// 2. Insert variables
const daily_vars = `
  const todayExpenses = useMemo(() => expenses.filter((e) => e.date === today), [expenses, today]);
  const todaySpent = todayExpenses.reduce((sum, item) => sum + item.amount, 0);
  const dailyBudget = activeIncome / (daysInMonth || 30);
  const todayRemaining = dailyBudget - todaySpent;
  const todayRawUsage = dailyBudget > 0 ? (todaySpent / dailyBudget) * 100 : todaySpent > 0 ? 100 : 0;
  const todayUsage = Math.min(100, Math.round(todayRawUsage));
  const todayBalanceTone = todayRemaining < 0 || todayRawUsage > 90 ? 'over' : todayRawUsage >= 70 ? 'careful' : 'steady';
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
  );
`;

content = content.replace(
  "const daysInMonth = new Date(Number(selectedMonth.slice(0, 4)), Number(selectedMonth.slice(5, 7)), 0).getDate();\n",
  "const daysInMonth = new Date(Number(selectedMonth.slice(0, 4)), Number(selectedMonth.slice(5, 7)), 0).getDate();\n" + daily_vars
);

// 3. Extract formContent and editModal (we'll just use a predefined string for them, but we must remove the IIFE block).
const iifeStartStr = '{(() => {\n            const formContent = (';
const iifeEndStr = '})()}';

const iifeStartIndex = content.indexOf(iifeStartStr);
const iifeEndIndex = content.indexOf(iifeEndStr, iifeStartIndex) + iifeEndStr.length;

if (iifeStartIndex !== -1 && iifeEndIndex !== -1) {
  content = content.substring(0, iifeStartIndex) + "{editModal}" + content.substring(iifeEndIndex);
}

// 4. Update the Nav
const old_nav_regex = /<nav aria-label="Ledger views"[\s\S]*?<\/nav>/;
const new_nav = `<nav aria-label="Ledger views" className="mb-5 flex rounded-2xl border border-[#dce5dc] dark:border-[#384f46] bg-[#f3f4ed] dark:bg-[#1d2a25]/80 p-1">
          <motion.button {...bounce} type="button" aria-current={activeTab === 'daily' ? 'page' : undefined} data-testid="tab-daily-ledger" onClick={() => setActiveTab('daily')} className={\`flex h-10 flex-1 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition \${activeTab === 'daily' ? 'bg-white dark:bg-[#1a2622] text-[#315548] dark:text-[#d1dbd6] shadow-sm' : 'text-[#819087] dark:text-[#88a096] hover:text-[#355a4d] dark:text-[#d1dbd6]'}\`}><CalendarDays size={16} />Daily Ledger</motion.button>
          <motion.button {...bounce} type="button" aria-current={activeTab === 'monthly' ? 'page' : undefined} data-testid="tab-monthly-ledger" onClick={() => setActiveTab('monthly')} className={\`flex h-10 flex-1 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition \${activeTab === 'monthly' ? 'bg-white dark:bg-[#1a2622] text-[#315548] dark:text-[#d1dbd6] shadow-sm' : 'text-[#819087] dark:text-[#88a096] hover:text-[#355a4d] dark:text-[#d1dbd6]'}\`}><CalendarDays size={16} />Monthly Ledger</motion.button>
          <motion.button {...bounce} type="button" aria-current={activeTab === 'yearly' ? 'page' : undefined} data-testid="tab-yearly-overview" onClick={() => setActiveTab('yearly')} className={\`flex h-10 flex-1 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition \${activeTab === 'yearly' ? 'bg-white dark:bg-[#1a2622] text-[#315548] dark:text-[#d1dbd6] shadow-sm' : 'text-[#819087] dark:text-[#88a096] hover:text-[#355a4d] dark:text-[#d1dbd6]'}\`}><BarChart3 size={16} />Yearly Overview</motion.button>
        </nav>`;
content = content.replace(old_nav_regex, new_nav);

const oldHeading = "activeTab === 'monthly' ? <>Your money, <span className=\"text-[#d78967]\">this month.</span></> : <>A year in <span className=\"text-[#d78967]\">perspective.</span></>";
const newHeading = "activeTab === 'daily' ? <>Your money, <span className=\"text-[#d78967]\">today.</span></> : activeTab === 'monthly' ? <>Your money, <span className=\"text-[#d78967]\">this month.</span></> : <>A year in <span className=\"text-[#d78967]\">perspective.</span></>";
content = content.replace(oldHeading, newHeading);

const oldControls = "{activeTab === 'monthly' ? <div className=\"flex w-full items-center justify-between gap-3";
const newControls = "{activeTab === 'daily' ? null : activeTab === 'monthly' ? <div className=\"flex w-full items-center justify-between gap-3";
content = content.replace(oldControls, newControls);

const formAndModalDefinition = `
  const formContent = (
    <form onSubmit={submitExpense} noValidate className="space-y-3">
      <div className="grid grid-cols-[1fr_1.05fr] gap-3">
        <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-[#819087] dark:text-[#88a096]">Amount</span><div className={\`flex h-11 items-center rounded-xl border \${amountError ? 'border-[#b8584b]' : 'border-[#dce5dc] dark:border-[#384f46] focus-within:border-[#84a998]'} bg-[#fffdf8] dark:bg-[#1e2a26]/75 px-3\`\}><span className={\`mr-2 text-sm font-semibold \${amountError ? 'text-[#b8584b]' : 'text-[#779284]'}\`}>৳</span><input aria-label="Amount in BDT" data-testid="input-expense-amount" type="number" min="0.01" step="0.01" value={amount} onChange={(event) => { setAmount(event.target.value); if (amountError) setAmountError(false); }} placeholder="0.00" className={\`w-full bg-transparent text-sm font-semibold \${amountError ? 'text-[#b8584b]' : 'text-[#315548] dark:text-[#d1dbd6]'} outline-none placeholder:font-normal placeholder:text-[#b7c0b9]\`} /></div>
        {amountError && <p className="text-sm text-red-500 mt-1 ml-1">Please enter a valid number.</p>}
        </label>
        <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-[#819087] dark:text-[#88a096]">Date</span><input aria-label="Expense date" data-testid="input-expense-date" type="date" required value={date} onChange={(event) => setDate(event.target.value)} className="h-11 w-full rounded-xl border border-[#dce5dc] dark:border-[#384f46] bg-[#fffdf8] dark:bg-[#1e2a26]/75 px-3 text-xs text-[#4d6c5e] dark:text-[#aabcb3]" /></label>
      </div>
      {!customCategoryMode ? <div>
        <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-[#819087] dark:text-[#88a096]">Where it belongs</span><span className="relative block"><motion.select {...bounce} aria-label="Expense category" data-testid="select-expense-category" value={category} onChange={(event) => setCategory(event.target.value)} required className="h-11 w-full rounded-xl border border-[#dce5dc] dark:border-[#384f46] bg-[#fffdf8] dark:bg-[#1e2a26]/75 px-3 text-sm text-[#4d6c5e] dark:text-[#aabcb3] appearance-none pr-10 cursor-pointer transition-colors focus:outline-none focus:ring-0 focus:border-transparent">{categories.length === 0 ? <option value="" disabled>No categories available</option> : categories.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}</motion.select><ChevronDown size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#82958a]" /></span></label>
        <motion.button {...bounce} type="button" data-testid="button-add-custom-category" onClick={() => { setCustomName(''); setCustomCategoryMode(true); }} className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-[#347d68] hover:bg-[#edf2e9] dark:hover:bg-[#344a42] dark:bg-[#253630]"><Plus size={14} />Add a custom category</motion.button>
      </div> : <div className="rounded-xl border border-[#dce5dc] dark:border-[#384f46] bg-[#fffdf8] dark:bg-[#1e2a26]/50 p-3">
        <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-[#819087] dark:text-[#88a096]">New “Where it belongs” category</span><input aria-label="Custom category name" data-testid="input-custom-category" maxLength={40} required autoFocus value={customName} onChange={(event) => setCustomName(event.target.value)} placeholder="For example, Books or Gifts" className="h-11 w-full rounded-xl border border-[#dce5dc] dark:border-[#384f46] bg-[#fffdf8] dark:bg-[#1e2a26]/75 px-3 text-sm text-[#4d6c5e] dark:text-[#aabcb3] placeholder:text-[#a6b1a9] dark:text-[#6a7f76]" /></label>
        <div className="mt-2 flex items-center justify-between gap-2"><p className="text-[10px] text-[#87968c]">Saved when you add this expense.</p><motion.button {...bounce} type="button" data-testid="button-use-existing-category" onClick={() => { setCustomCategoryMode(false); setCustomName(''); }} className="rounded-lg px-2 py-1 text-[11px] font-semibold text-[#628675] hover:bg-[#edf2e9] dark:hover:bg-[#344a42] dark:bg-[#253630]">Choose existing</motion.button></div>
      </div>}
      <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-[#819087] dark:text-[#88a096]">Tags <span className="font-normal">(optional, separate with commas or spaces)</span></span><input aria-label="Custom expense tags" data-testid="input-expense-tags" maxLength={240} value={tagInput} onChange={(event) => setTagInput(event.target.value)} placeholder="#iCloud, #CapCut, #Uber" className="h-11 w-full rounded-xl border border-[#dce5dc] dark:border-[#384f46] bg-[#fffdf8] dark:bg-[#1e2a26]/75 px-3 text-sm text-[#4d6c5e] dark:text-[#aabcb3] placeholder:text-[#a6b1a9] dark:text-[#6a7f76]" /></label>
      <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-[#819087] dark:text-[#88a096]">A note <span className="font-normal">(optional)</span></span><input aria-label="Optional note" data-testid="input-expense-note" maxLength={80} value={note} onChange={(event) => setNote(event.target.value)} placeholder="A quick detail to remember" className="h-11 w-full rounded-xl border border-[#dce5dc] dark:border-[#384f46] bg-[#fffdf8] dark:bg-[#1e2a26]/75 px-3 text-sm text-[#4d6c5e] dark:text-[#aabcb3] placeholder:text-[#a6b1a9] dark:text-[#6a7f76]" /></label>
      <motion.button {...bounce} type="submit" data-testid="button-save-expense" className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#347d68] text-sm font-semibold text-white shadow-sm hover:bg-[#2d705d]">{editingId ? <Check size={16} /> : <Plus size={17} />}{editingId ? 'Save changes' : 'Add to my ledger'}</motion.button>
    </form>
  );

  const editModal = (
    <AnimatePresence>{editingId && (
      <div key="modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div {...overlayFade} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={clearForm}></motion.div>
        <motion.div {...modalPop} className="relative glass-card max-w-lg w-full rounded-[28px] border border-white/80 dark:border-white/10 p-6 sm:p-8 bg-white/95 max-h-[90vh] overflow-y-auto z-10 shadow-2xl">
          <div className="mb-5 flex items-start justify-between">
            <div><p className="mb-1 text-xs font-semibold uppercase tracking-[.12em] text-[#9a8c77]">Make a change</p><h2 className="font-display text-[21px] font-bold tracking-[-.04em] text-[#294d40]">Edit expense</h2></div>
            <motion.button {...bounce} type="button" aria-label="Cancel edit" data-testid="button-cancel-edit" onClick={clearForm} className="grid h-8 w-8 place-items-center rounded-full text-[#768980] dark:text-[#88a096] hover:bg-[#edf1e8] dark:hover:bg-[#344a42] dark:bg-[#253630]"><X size={17} /></motion.button>
          </div>
          {formContent}
        </motion.div>
      </div>
    )}</AnimatePresence>
  );
`;

content = content.replace("  return (\n    <main className=", formAndModalDefinition + "\n  return (\n    <main className=");

const daily_tab_content = `
        {activeTab === 'daily' ? <>
        <section className="rise-in-delay glass-card relative mb-5 overflow-hidden rounded-[26px] p-5 sm:p-7">
          <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border-[1px] border-[#dbe7d8]/80 dark:border-[#2a3c35]/80" />
          <div className="pointer-events-none absolute -right-2 -top-10 h-44 w-44 rounded-full border-[1px] border-[#e6ebe0] dark:border-[#2a3c35]" />
          <div className="relative">
            <div className="rounded-[20px] border border-white/70 dark:border-white/10 bg-white/35 p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-[#446558] dark:text-[#aabcb3]">Your day at a glance</span>
                <span data-testid="text-today-usage" className={\`rounded-full px-2.5 py-1 text-xs font-semibold \${todayBalanceTone === 'over' ? 'bg-[#fae5df] dark:bg-[#3a221f] text-[#a7463c]' : todayBalanceTone === 'careful' ? 'bg-[#f6edcf] dark:bg-[#3a331c] text-[#927629]' : 'bg-[#e1eee2] dark:bg-[#1c382a] text-[#39795e]'}\`}>{todayUsage}% used</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-[#e6ebe3] dark:bg-[#2c3f38]">
                <div data-testid="progress-today" className={\`h-full rounded-full transition-[width] duration-500 \${todayBalanceTone === 'over' ? 'bg-[#c85f51]' : todayBalanceTone === 'careful' ? 'bg-[#d9b74f]' : 'bg-[#65a17d]'}\`} style={{ width: \`\${todayUsage}%\` }} />
              </div>
              <div className="mt-2 flex justify-between text-[11px] text-[#8a9990] dark:text-[#88a096]"><span>৳0</span><span>{todayRemaining < 0 ? \`\${fmtMoney(Math.abs(todayRemaining))} over\` : \`\${fmtMoney(todayRemaining)} to go\`}</span><span>{fmtMoney(dailyBudget)}</span></div>
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
        </section>

        <div className="mb-5 grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
          <section id="expense-entry-daily" className="glass-card rounded-[24px] p-5 sm:p-6">
            <div className="mb-5 flex items-start justify-between">
              <div><p className="mb-1 text-xs font-semibold uppercase tracking-[.12em] text-[#9a8c77]">A small note to self</p><h2 className="font-display text-[21px] font-bold tracking-[-.04em] text-[#294d40] dark:text-[#e4e9e7]">What did you spend today?</h2></div>
            </div>
            {formContent}
          </section>
          <section className="glass-card rounded-[24px] p-5 sm:p-6">
            <div className="mb-4 flex items-end justify-between"><div><p className="mb-1 text-xs font-semibold uppercase tracking-[.12em] text-[#9a8c77]">The shape of your spending</p><h2 className="font-display text-[21px] font-bold tracking-[-.04em] text-[#294d40] dark:text-[#e4e9e7]">Where it went today</h2></div><span className="text-xs text-[#8a9990] dark:text-[#88a096]">{todayExpenses.length} {todayExpenses.length === 1 ? 'entry' : 'entries'}</span></div>
            {todayPieData.length ? <div className="grid items-center gap-3 sm:grid-cols-[.9fr_1.1fr]">
              <div className="relative h-[190px] w-full">
                <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={todayPieData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={82} paddingAngle={3} stroke="none" cornerRadius={4}>{todayPieData.map((entry) => <Cell key={entry.name} fill={colorForCategory(entry.name, categories)} />)}</Pie><ChartTooltip content={chartTip} /></PieChart></ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><strong data-testid="text-category-spend-total" className="font-display text-[19px] font-bold text-[#315548] dark:text-[#d1dbd6]">{fmtMoney(todaySpent)}</strong><span className="text-[10px] text-[#8a9990] dark:text-[#88a096]">total spent</span></div>
              </div>
              <div className="space-y-3">
                {todayPieData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between gap-2 relative">
                    <div className="flex min-w-0 items-center gap-2">
                      <motion.button {...bounce} type="button" onClick={() => setColorPickerTarget(colorPickerTarget === \`pie-\${item.name}\` ? null : \`pie-\${item.name}\`)} aria-label={\`Change color for \${item.name}\`} className="h-3 w-3 shrink-0 rounded-full shadow-sm hover:scale-110 transition-transform" style={{ backgroundColor: colorForCategory(item.name, categories) }} />
                      {colorPickerTarget === \`pie-\${item.name}\` && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setColorPickerTarget(null)} />
                          <div className="absolute top-full left-0 mt-2 z-50 w-48 rounded-xl bg-white dark:bg-[#1a2622] p-3 shadow-xl border border-[#dce5dc] dark:border-[#384f46]">
                             <div className="flex flex-wrap gap-2 mb-3">
                               {PREDEFINED_COLORS.map(c => (
                                 <motion.button {...bounce} type="button" aria-label={\`Select color \${c}\`} key={c} onClick={() => { changeCategoryColor(item.name, c); setColorPickerTarget(null); }} className="h-6 w-6 rounded-full hover:scale-110 transition-transform shadow-sm" style={{ backgroundColor: c }} />
                               ))}
                             </div>
                             <div className="border-t border-[#e6ebe3] pt-3 flex items-center justify-between">
                               <span className="text-xs font-semibold text-[#789086] dark:text-[#88a096]">Custom color</span>
                               <input type="color" value={colorForCategory(item.name, categories)} onChange={(e) => changeCategoryColor(item.name, e.target.value)} className="h-7 w-7 cursor-pointer border-0 p-0 rounded bg-transparent" />
                             </div>
                          </div>
                        </>
                      )}
                      <span className="truncate text-xs text-[#62796d] dark:text-[#aabcb3]">{item.name}</span>
                    </div>
                    <span data-testid={\`text-donut-amount-\${item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}\`} className="shrink-0 text-xs font-semibold text-[#355a4d] dark:text-[#d1dbd6]">{fmtMoney(item.value)}</span>
                  </div>
                ))}
              </div>
            </div> : <div className="flex min-h-[190px] flex-col items-center justify-center rounded-2xl bg-[#f4f4ec] dark:bg-[#121b18]/70 text-center"><div className="mb-3 grid h-11 w-11 place-items-center rounded-full bg-[#e7eee4] dark:bg-[#2c3f38] text-[#668b75] dark:text-[#88a096]"><Wallet size={19} /></div><p className="text-sm font-semibold text-[#547165] dark:text-[#aabcb3]">Nothing spent just yet</p><p className="mt-1 max-w-[220px] text-xs leading-relaxed text-[#8a9990] dark:text-[#88a096]">Your categories will take shape here as you add expenses.</p></div>}
          </section>
        </div>

        <section className="glass-card rounded-[24px] p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="mb-1 text-xs font-semibold uppercase tracking-[.12em] text-[#9a8c77]">The little details</p><h2 className="font-display text-[21px] font-bold tracking-[-.04em] text-[#294d40] dark:text-[#e4e9e7]">Your ledger today</h2></div><motion.button {...bounce} type="button" onClick={exportCsv} data-testid="button-export-csv" className="flex h-9 items-center gap-2 rounded-xl border border-[#dce5dc] dark:border-[#384f46] bg-[#fffdf8] dark:bg-[#1e2a26]/70 px-3 text-xs font-semibold text-[#537364] dark:text-[#aabcb3] hover:bg-[#edf2e9] dark:hover:bg-[#344a42] dark:bg-[#253630]"><Download size={14} />Download CSV</motion.button></div>
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-[#819087] dark:text-[#88a096]">Filter by category</span><span className="relative block"><motion.select {...bounce} aria-label="Filter expenses by category" data-testid="select-filter-category" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="h-10 w-full rounded-xl border border-[#dce5dc] dark:border-[#384f46] bg-[#fffdf8] dark:bg-[#1e2a26]/75 px-3 text-xs text-[#4d6c5e] dark:text-[#aabcb3] appearance-none pr-10 cursor-pointer transition-colors focus:outline-none focus:ring-0 focus:border-transparent"><option value="all">All categories</option>{categories.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}</motion.select><ChevronDown size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#82958a]" /></span></label>
            <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-[#819087] dark:text-[#88a096]">Filter by tag</span><span className="relative block"><motion.select {...bounce} aria-label="Filter expenses by tag" data-testid="select-filter-tag" value={tagFilter} onChange={(event) => setTagFilter(event.target.value)} className="h-10 w-full rounded-xl border border-[#dce5dc] dark:border-[#384f46] bg-[#fffdf8] dark:bg-[#1e2a26]/75 px-3 text-xs text-[#4d6c5e] dark:text-[#aabcb3] appearance-none pr-10 cursor-pointer transition-colors focus:outline-none focus:ring-0 focus:border-transparent"><option value="all">All tags</option>{availableTags.map((item) => <option key={item} value={item}>#{item}</option>)}</motion.select><ChevronDown size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#82958a]" /></span></label>
          </div>
          {todayExpenses.length ? todayFilteredExpenses.length ? <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead><tr className="border-b border-[#e6ebe3] dark:border-[#2a3c35] text-[10px] font-semibold uppercase tracking-[.1em] text-[#95a198] dark:text-[#88a096]"><th className="pb-3 pr-3 font-semibold">Date</th><th className="pb-3 pr-3 font-semibold">Category</th><th className="pb-3 pr-3 font-semibold">Tags</th><th className="pb-3 pr-3 font-semibold">Note</th><th className="pb-3 pr-3 text-right font-semibold">Amount</th><th className="pb-3 text-right font-semibold">Edit</th></tr></thead>
              <tbody>{todayFilteredExpenses.map((item) => <tr key={item.id} data-testid={\`row-expense-\${item.id}\`} className="group border-b border-[#edf0e9] dark:border-[#2a3c35] last:border-0 hover:bg-gray-50 dark:hover:bg-white/5">
                <td data-testid={\`text-expense-date-\${item.id}\`} className="py-3.5 pr-3 text-xs text-[#74877d] dark:text-[#9bb0a6]">{new Date(\`\${item.date}T12:00:00\`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</td>
                <td className="py-3.5 pr-3"><span className="inline-flex items-center gap-2 text-xs font-medium text-[#4d6c5e] dark:text-[#aabcb3]"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: colorForCategory(item.category, categories) }} />{item.category}</span></td>
                <td data-testid={\`text-expense-tags-\${item.id}\`} className="py-3.5 pr-3"><div className="flex max-w-[170px] flex-wrap gap-1">{item.tags.map((tag) => <span key={tag} className="rounded-md bg-[#edf2e9] dark:bg-[#253630] px-1.5 py-1 text-[10px] text-[#628675] dark:text-[#aabcb3]">#{tag}</span>)}</div></td>
                <td data-testid={\`text-expense-note-\${item.id}\`} className="max-w-[180px] truncate py-3.5 pr-3 text-xs text-[#93a097] dark:text-[#7b9087]">{item.note || '—'}</td>
                <td data-testid={\`text-expense-amount-\${item.id}\`} className="py-3.5 pr-3 text-right text-sm font-semibold text-[#355a4d] dark:text-[#d1dbd6]">{fmtMoney(item.amount)}</td>
                <td className="py-3.5 text-right"><div className="flex justify-end gap-1"><motion.button whileTap={{ scale: 0.9 }} transition={springTransition} type="button" aria-label={\`Edit \${item.category} expense\`} data-testid={\`button-edit-expense-\${item.id}\`} onClick={() => startEdit(item)} className="rounded-full p-2 text-[#789086] dark:text-[#88a096] opacity-75 transition-colors hover:bg-[#e9f0e8] hover:text-[#347d68] dark:hover:bg-[#344a42] dark:hover:text-[#aabcb3]"><Edit3 size={14} /></motion.button><motion.button whileTap={{ scale: 0.9 }} transition={springTransition} type="button" aria-label={\`Delete \${item.category} expense\`} data-testid={\`button-delete-expense-\${item.id}\`} onClick={() => setExpenseToDelete(item.id)} className="rounded-full p-2 text-[#a88e87] opacity-75 transition-colors hover:bg-[#f8e9e4] hover:text-[#ba5b4d] dark:hover:bg-[#4a2b27] dark:hover:text-[#e4a39b]"><Trash2 size={14} /></motion.button></div></td>
              </tr>)}</tbody>
            </table>
          </div> : <div className="rounded-2xl bg-[#f4f4ec] dark:bg-[#121b18]/65 px-5 py-8 text-center"><p data-testid="text-no-filter-results" className="text-sm font-semibold text-[#547165] dark:text-[#aabcb3]">No expenses match those filters</p><p className="mt-1 text-xs text-[#8a9990] dark:text-[#88a096]">Try another category or tag.</p></div> : <div className="flex flex-col items-center justify-center rounded-2xl bg-[#f4f4ec] dark:bg-[#121b18]/65 px-5 py-10 text-center"><div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-[#e6eee4] dark:bg-[#2c3f38] text-[#638b73] dark:text-[#88a096]"><CalendarDays size={19} /></div><p data-testid="text-empty-ledger" className="font-display text-base font-bold text-[#4a6c5c] dark:text-[#aabcb3]">Your page is still blank</p><p className="mt-1 max-w-[270px] text-xs leading-relaxed text-[#87968c] dark:text-[#88a096]">When you spend today, leave yourself a little note here. It all stays on this device.</p></div>}
          <div className="mt-4 flex items-center justify-between border-t border-[#e6ebe3] dark:border-[#2a3c35] pt-4 text-xs"><span className="text-[#839289] dark:text-[#88a096]">{todayExpenses.length} {todayExpenses.length === 1 ? 'entry' : 'entries'} today</span><span className="font-semibold text-[#426457] dark:text-[#aabcb3]">Day total <strong data-testid="text-ledger-total" className="ml-2 font-display text-sm text-[#24483c] dark:text-[#e4e9e7]">{fmtMoney(todaySpent)}</strong></span></div>
        </section>
        </> : activeTab === 'monthly' ? <>
`;

content = content.replace("{activeTab === 'monthly' ? <>", daily_tab_content);

fs.writeFileSync('src/pages/DailyLedger.tsx', content);
