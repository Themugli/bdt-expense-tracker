import re

with open('src/pages/DailyLedger.tsx', 'r') as f:
    content = f.read()

# 1. Update activeTab state
content = content.replace(
    "const [activeTab, setActiveTab] = useState<'monthly' | 'yearly'>('monthly');",
    "const [activeTab, setActiveTab] = useState<'daily' | 'monthly' | 'yearly'>('daily');"
)

# 2. Insert daily computed variables right after filteredExpenses
daily_vars = """
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
"""

content = content.replace(
    "const daysInMonth = new Date(Number(selectedMonth.slice(0, 4)), Number(selectedMonth.slice(5, 7)), 0).getDate();\n",
    "const daysInMonth = new Date(Number(selectedMonth.slice(0, 4)), Number(selectedMonth.slice(5, 7)), 0).getDate();\n" + daily_vars
)

# 3. Update the Nav
old_nav = """        <nav aria-label="Ledger views" className="mb-5 flex rounded-2xl border border-[#dce5dc] dark:border-[#384f46] bg-[#f3f4ed] dark:bg-[#1d2a25]/80 p-1">
          <motion.button {...bounce} type="button" aria-current={activeTab === 'monthly' ? 'page' : undefined} data-testid="tab-monthly-ledger" onClick={() => setActiveTab('monthly')} className={`flex h-10 flex-1 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition ${activeTab === 'monthly' ? 'bg-white dark:bg-[#1a2622] text-[#315548] dark:text-[#d1dbd6] shadow-sm' : 'text-[#819087] dark:text-[#88a096] hover:text-[#355a4d] dark:text-[#d1dbd6]'}`}><CalendarDays size={16} />Monthly Ledger</motion.button>
          <motion.button {...bounce} type="button" aria-current={activeTab === 'yearly' ? 'page' : undefined} data-testid="tab-yearly-overview" onClick={() => setActiveTab('yearly')} className={`flex h-10 flex-1 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition ${activeTab === 'yearly' ? 'bg-white dark:bg-[#1a2622] text-[#315548] dark:text-[#d1dbd6] shadow-sm' : 'text-[#819087] dark:text-[#88a096] hover:text-[#355a4d] dark:text-[#d1dbd6]'}`}><BarChart3 size={16} />Yearly Overview</motion.button>
        </nav>"""

new_nav = """        <nav aria-label="Ledger views" className="mb-5 flex rounded-2xl border border-[#dce5dc] dark:border-[#384f46] bg-[#f3f4ed] dark:bg-[#1d2a25]/80 p-1">
          <motion.button {...bounce} type="button" aria-current={activeTab === 'daily' ? 'page' : undefined} data-testid="tab-daily-ledger" onClick={() => setActiveTab('daily')} className={`flex h-10 flex-1 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition ${activeTab === 'daily' ? 'bg-white dark:bg-[#1a2622] text-[#315548] dark:text-[#d1dbd6] shadow-sm' : 'text-[#819087] dark:text-[#88a096] hover:text-[#355a4d] dark:text-[#d1dbd6]'}`}><CalendarDays size={16} />Daily Ledger</motion.button>
          <motion.button {...bounce} type="button" aria-current={activeTab === 'monthly' ? 'page' : undefined} data-testid="tab-monthly-ledger" onClick={() => setActiveTab('monthly')} className={`flex h-10 flex-1 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition ${activeTab === 'monthly' ? 'bg-white dark:bg-[#1a2622] text-[#315548] dark:text-[#d1dbd6] shadow-sm' : 'text-[#819087] dark:text-[#88a096] hover:text-[#355a4d] dark:text-[#d1dbd6]'}`}><CalendarDays size={16} />Monthly Ledger</motion.button>
          <motion.button {...bounce} type="button" aria-current={activeTab === 'yearly' ? 'page' : undefined} data-testid="tab-yearly-overview" onClick={() => setActiveTab('yearly')} className={`flex h-10 flex-1 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition ${activeTab === 'yearly' ? 'bg-white dark:bg-[#1a2622] text-[#315548] dark:text-[#d1dbd6] shadow-sm' : 'text-[#819087] dark:text-[#88a096] hover:text-[#355a4d] dark:text-[#d1dbd6]'}`}><BarChart3 size={16} />Yearly Overview</motion.button>
        </nav>"""

content = content.replace(old_nav, new_nav)

# 4. Extract form grid from monthly so we can put it in daily and remove it from monthly
# We'll use regex to replace `{activeTab === 'monthly' ? <>` to `{activeTab === 'daily' ? <> (Daily Content) </> : activeTab === 'monthly' ? <> (Monthly Content) </> ...`
# Also need to replace the formContent section. In the code, formContent is enclosed in `(() => { const formContent = ... return (...) })()`

daily_ui = """
        {activeTab === 'daily' ? <>
        {/* Progress Bar (clone from Month at a glance) */}
        <section className="rise-in-delay glass-card relative mb-5 overflow-hidden rounded-[26px] p-5 sm:p-7">
          <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border-[1px] border-[#dbe7d8]/80 dark:border-[#2a3c35]/80" />
          <div className="pointer-events-none absolute -right-2 -top-10 h-44 w-44 rounded-full border-[1px] border-[#e6ebe0] dark:border-[#2a3c35]" />
          <div className="relative">
            <div className="rounded-[20px] border border-white/70 dark:border-white/10 bg-white/35 p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-[#446558] dark:text-[#aabcb3]">Your day at a glance</span>
                <span data-testid="text-today-usage" className={`rounded-full px-2.5 py-1 text-xs font-semibold ${todayBalanceTone === 'over' ? 'bg-[#fae5df] dark:bg-[#3a221f] text-[#a7463c]' : todayBalanceTone === 'careful' ? 'bg-[#f6edcf] dark:bg-[#3a331c] text-[#927629]' : 'bg-[#e1eee2] dark:bg-[#1c382a] text-[#39795e]'}`}>{todayUsage}% used</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-[#e6ebe3] dark:bg-[#2c3f38]">
                <div data-testid="progress-today" className={`h-full rounded-full transition-[width] duration-500 ${todayBalanceTone === 'over' ? 'bg-[#c85f51]' : todayBalanceTone === 'careful' ? 'bg-[#d9b74f]' : 'bg-[#65a17d]'}`} style={{ width: `${todayUsage}%` }} />
              </div>
              <div className="mt-2 flex justify-between text-[11px] text-[#8a9990] dark:text-[#88a096]"><span>৳0</span><span>{todayRemaining < 0 ? `${fmtMoney(Math.abs(todayRemaining))} over` : `${fmtMoney(todayRemaining)} to go`}</span><span>{fmtMoney(dailyBudget)}</span></div>
              <p className="mt-4 flex items-center gap-2 text-xs leading-relaxed text-[#71857a] dark:text-[#88a096]">
                {todaySpent === 0 ? <CircleHelp size={14} /> : todayRemaining < 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {todaySpent === 0 ? 'A fresh page. Add your first expense when you’re ready.' : todayRemaining < 0 ? 'You’ve gone a little beyond today’s target.' : `${fmtMoney(todayRemaining)} is still available for the rest of your day.`}
              </p>
            </div>
          </div>
        </section>

        {/* Daily Detail Cards */}
        <section className="glass-card mb-5 rounded-[24px] p-5 sm:p-6" data-testid="daily-detail-panel">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div><p className="mb-1 text-xs font-semibold uppercase tracking-[.12em] text-[#9a8c77]">Daily detail</p><h2 className="font-display text-[21px] font-bold tracking-[-.04em] text-[#294d40] dark:text-[#e4e9e7]">{new Date(`${today}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</h2></div>
            <span className="rounded-full bg-[#edf2e9] dark:bg-[#253630] px-3 py-1 text-xs font-semibold text-[#628675]">{todayExpenses.length} {todayExpenses.length === 1 ? 'entry' : 'entries'}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-[#f4f5ef] dark:bg-[#23312c]/80 p-4"><p className="text-xs text-[#819087] dark:text-[#88a096]">Daily target</p><p data-testid="text-detail-daily-income" className="mt-1 font-display text-xl font-bold text-[#355a4d] dark:text-[#d1dbd6]">{fmtMoney(dailyBudget)}</p></div>
            <div className="rounded-2xl bg-[#f4f5ef] dark:bg-[#23312c]/80 p-4"><p className="text-xs text-[#819087] dark:text-[#88a096]">Total spent today</p><p data-testid="text-detail-daily-spent" className="mt-1 font-display text-xl font-bold text-[#355a4d] dark:text-[#d1dbd6]">{fmtMoney(todaySpent)}</p></div>
            <div className={`rounded-2xl p-4 ${todayRemaining < 0 ? 'bg-[#fae9e4] dark:bg-[#3a221f]' : 'bg-[#e8f0e7]'}`}><p className="text-xs text-[#819087] dark:text-[#88a096]">{todayRemaining < 0 ? 'Deficit' : 'Savings'}</p><p data-testid="text-detail-daily-savings" className={`mt-1 font-display text-xl font-bold ${todayRemaining < 0 ? 'text-[#b8584b]' : 'text-[#347d68]'}`}>{todayRemaining < 0 ? `−${fmtMoney(Math.abs(todayRemaining))}` : fmtMoney(todayRemaining)}</p></div>
          </div>
        </section>

        {/* Note to self & Where it went (today) */}
        <div className="mb-5 grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
          {(() => {
            const formContent = (
              <form onSubmit={submitExpense} noValidate className="space-y-3">
                <div className="grid grid-cols-[1fr_1.05fr] gap-3">
                  <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-[#819087] dark:text-[#88a096]">Amount</span><div className={`flex h-11 items-center rounded-xl border ${amountError ? 'border-[#b8584b]' : 'border-[#dce5dc] dark:border-[#384f46] focus-within:border-[#84a998]'} bg-[#fffdf8] dark:bg-[#1e2a26]/75 px-3`}><span className={`mr-2 text-sm font-semibold ${amountError ? 'text-[#b8584b]' : 'text-[#779284]'}`}>৳</span><input aria-label="Amount in BDT" data-testid="input-expense-amount" type="number" min="0.01" step="0.01" value={amount} onChange={(event) => { setAmount(event.target.value); if (amountError) setAmountError(false); }} placeholder="0.00" className={`w-full bg-transparent text-sm font-semibold ${amountError ? 'text-[#b8584b]' : 'text-[#315548] dark:text-[#d1dbd6]'} outline-none placeholder:font-normal placeholder:text-[#b7c0b9]`} /></div>
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
            return (
              <>
              {!editingId && <section id="expense-entry-daily" className="glass-card rounded-[24px] p-5 sm:p-6">
                <div className="mb-5 flex items-start justify-between">
                  <div><p className="mb-1 text-xs font-semibold uppercase tracking-[.12em] text-[#9a8c77]">A small note to self</p><h2 className="font-display text-[21px] font-bold tracking-[-.04em] text-[#294d40]">What did you spend today?</h2></div>
                </div>
                {formContent}
              </section>}
              </>
            );
          })()}
          <section className="glass-card rounded-[24px] p-5 sm:p-6">
            <div className="mb-4 flex items-end justify-between"><div><p className="mb-1 text-xs font-semibold uppercase tracking-[.12em] text-[#9a8c77]">The shape of your spending</p><h2 className="font-display text-[21px] font-bold tracking-[-.04em] text-[#294d40]">Where it went today</h2></div><span className="text-xs text-[#8a9990] dark:text-[#88a096]">{todayExpenses.length} {todayExpenses.length === 1 ? 'entry' : 'entries'}</span></div>
            {todayPieData.length ? <div className="grid items-center gap-3 sm:grid-cols-[.9fr_1.1fr]">
              <div className="relative h-[190px] w-full">
                <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={todayPieData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={82} paddingAngle={3} stroke="none" cornerRadius={4}>{todayPieData.map((entry) => <Cell key={entry.name} fill={colorForCategory(entry.name, categories)} />)}</Pie><ChartTooltip content={chartTip} /></PieChart></ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><strong data-testid="text-category-spend-total" className="font-display text-[19px] font-bold text-[#315548] dark:text-[#d1dbd6]">{fmtMoney(todaySpent)}</strong><span className="text-[10px] text-[#8a9990] dark:text-[#88a096]">total spent</span></div>
              </div>
              <div className="space-y-3">
                {todayPieData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between gap-2 relative">
                    <div className="flex min-w-0 items-center gap-2">
                      <motion.button {...bounce} type="button" onClick={() => setColorPickerTarget(colorPickerTarget === `pie-${item.name}` ? null : `pie-${item.name}`)} aria-label={`Change color for ${item.name}`} className="h-3 w-3 shrink-0 rounded-full shadow-sm hover:scale-110 transition-transform" style={{ backgroundColor: colorForCategory(item.name, categories) }} />
                      <span className="truncate text-xs text-[#62796d]">{item.name}</span>
                    </div>
                    <span data-testid={`text-donut-amount-${item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} className="shrink-0 text-xs font-semibold text-[#355a4d] dark:text-[#d1dbd6]">{fmtMoney(item.value)}</span>
                  </div>
                ))}
              </div>
            </div> : <div className="flex min-h-[190px] flex-col items-center justify-center rounded-2xl bg-[#f4f4ec] dark:bg-[#121b18]/70 text-center"><div className="mb-3 grid h-11 w-11 place-items-center rounded-full bg-[#e7eee4] text-[#668b75]"><Wallet size={19} /></div><p className="text-sm font-semibold text-[#547165]">Nothing spent just yet</p><p className="mt-1 max-w-[220px] text-xs leading-relaxed text-[#8a9990] dark:text-[#88a096]">Your categories will take shape here as you add expenses.</p></div>}
          </section>
        </div>

        {/* Your Ledger Table for Today */}
        <section className="glass-card rounded-[24px] p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="mb-1 text-xs font-semibold uppercase tracking-[.12em] text-[#9a8c77]">The little details</p><h2 className="font-display text-[21px] font-bold tracking-[-.04em] text-[#294d40]">Your ledger today</h2></div><motion.button {...bounce} type="button" onClick={exportCsv} data-testid="button-export-csv" className="flex h-9 items-center gap-2 rounded-xl border border-[#dce5dc] dark:border-[#384f46] bg-[#fffdf8] dark:bg-[#1e2a26]/70 px-3 text-xs font-semibold text-[#537364] hover:bg-[#edf2e9] dark:hover:bg-[#344a42] dark:bg-[#253630]"><Download size={14} />Download CSV</motion.button></div>
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-[#819087] dark:text-[#88a096]">Filter by category</span><span className="relative block"><motion.select {...bounce} aria-label="Filter expenses by category" data-testid="select-filter-category" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="h-10 w-full rounded-xl border border-[#dce5dc] dark:border-[#384f46] bg-[#fffdf8] dark:bg-[#1e2a26]/75 px-3 text-xs text-[#4d6c5e] dark:text-[#aabcb3] appearance-none pr-10 cursor-pointer transition-colors focus:outline-none focus:ring-0 focus:border-transparent"><option value="all">All categories</option>{categories.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}</motion.select><ChevronDown size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#82958a]" /></span></label>
            <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-[#819087] dark:text-[#88a096]">Filter by tag</span><span className="relative block"><motion.select {...bounce} aria-label="Filter expenses by tag" data-testid="select-filter-tag" value={tagFilter} onChange={(event) => setTagFilter(event.target.value)} className="h-10 w-full rounded-xl border border-[#dce5dc] dark:border-[#384f46] bg-[#fffdf8] dark:bg-[#1e2a26]/75 px-3 text-xs text-[#4d6c5e] dark:text-[#aabcb3] appearance-none pr-10 cursor-pointer transition-colors focus:outline-none focus:ring-0 focus:border-transparent"><option value="all">All tags</option>{availableTags.map((item) => <option key={item} value={item}>#{item}</option>)}</motion.select><ChevronDown size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#82958a]" /></span></label>
          </div>
          {todayExpenses.length ? todayFilteredExpenses.length ? <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead><tr className="border-b border-[#e6ebe3] text-[10px] font-semibold uppercase tracking-[.1em] text-[#95a198]"><th className="pb-3 pr-3 font-semibold">Date</th><th className="pb-3 pr-3 font-semibold">Category</th><th className="pb-3 pr-3 font-semibold">Tags</th><th className="pb-3 pr-3 font-semibold">Note</th><th className="pb-3 pr-3 text-right font-semibold">Amount</th><th className="pb-3 text-right font-semibold">Edit</th></tr></thead>
              <tbody>{todayFilteredExpenses.map((item) => <tr key={item.id} data-testid={`row-expense-${item.id}`} className="group border-b border-[#edf0e9] dark:border-[#2a3c35] last:border-0 hover:bg-gray-50">
                <td data-testid={`text-expense-date-${item.id}`} className="py-3.5 pr-3 text-xs text-[#74877d]">{new Date(`${item.date}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</td>
                <td className="py-3.5 pr-3"><span className="inline-flex items-center gap-2 text-xs font-medium text-[#4d6c5e] dark:text-[#aabcb3]"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: colorForCategory(item.category, categories) }} />{item.category}</span></td>
                <td data-testid={`text-expense-tags-${item.id}`} className="py-3.5 pr-3"><div className="flex max-w-[170px] flex-wrap gap-1">{item.tags.map((tag) => <span key={tag} className="rounded-md bg-[#edf2e9] dark:bg-[#253630] px-1.5 py-1 text-[10px] text-[#628675]">#{tag}</span>)}</div></td>
                <td data-testid={`text-expense-note-${item.id}`} className="max-w-[180px] truncate py-3.5 pr-3 text-xs text-[#93a097] dark:text-[#7b9087]">{item.note || '—'}</td>
                <td data-testid={`text-expense-amount-${item.id}`} className="py-3.5 pr-3 text-right text-sm font-semibold text-[#355a4d] dark:text-[#d1dbd6]">{fmtMoney(item.amount)}</td>
                <td className="py-3.5 text-right"><div className="flex justify-end gap-1"><motion.button whileTap={{ scale: 0.9 }} transition={springTransition} type="button" aria-label={`Edit ${item.category} expense`} data-testid={`button-edit-expense-${item.id}`} onClick={() => startEdit(item)} className="rounded-full p-2 text-[#789086] dark:text-[#88a096] opacity-75 transition-colors hover:bg-[#e9f0e8] hover:text-[#347d68]"><Edit3 size={14} /></motion.button><motion.button whileTap={{ scale: 0.9 }} transition={springTransition} type="button" aria-label={`Delete ${item.category} expense`} data-testid={`button-delete-expense-${item.id}`} onClick={() => setExpenseToDelete(item.id)} className="rounded-full p-2 text-[#a88e87] opacity-75 transition-colors hover:bg-[#f8e9e4] hover:text-[#ba5b4d]"><Trash2 size={14} /></motion.button></div></td>
              </tr>)}</tbody>
            </table>
          </div> : <div className="rounded-2xl bg-[#f4f4ec] dark:bg-[#121b18]/65 px-5 py-8 text-center"><p data-testid="text-no-filter-results" className="text-sm font-semibold text-[#547165]">No expenses match those filters</p><p className="mt-1 text-xs text-[#8a9990] dark:text-[#88a096]">Try another category or tag.</p></div> : <div className="flex flex-col items-center justify-center rounded-2xl bg-[#f4f4ec] dark:bg-[#121b18]/65 px-5 py-10 text-center"><div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-[#e6eee4] text-[#638b73]"><CalendarDays size={19} /></div><p data-testid="text-empty-ledger" className="font-display text-base font-bold text-[#4a6c5c]">Your page is still blank</p><p className="mt-1 max-w-[270px] text-xs leading-relaxed text-[#87968c]">When you spend, leave yourself a little note here. It all stays on this device.</p></div>}
          <div className="mt-4 flex items-center justify-between border-t border-[#e6ebe3] pt-4 text-xs"><span className="text-[#839289]">{todayExpenses.length} {todayExpenses.length === 1 ? 'entry' : 'entries'} today</span><span className="font-semibold text-[#426457]">Day total <strong data-testid="text-ledger-total" className="ml-2 font-display text-sm">{fmtMoney(todaySpent)}</strong></span></div>
        </section>
        </> : activeTab === 'monthly' ? <>
"""

# Next we also need to remove the Note To Self form from the Monthly section.
# We'll use regex to isolate the <div className="mb-5 grid gap-5 lg:grid-cols-[.9fr_1.1fr]"> block inside the monthly tab and remove the form side.
# Then we will append the Yearly section logic.

# In the current code, the Monthly tab starts exactly at `{activeTab === 'monthly' ? <>`. Let's just find that and replace.
old_content = content.split("{activeTab === 'monthly' ? <>")[1]
# But wait, now there's `editModal` definition in formContent. `editModal` needs to be defined BEFORE the `activeTab === 'daily'` switch, so both daily and monthly and yearly can use it (or just daily/monthly).
# Actually, the formContent is defined as an IIFE inside the Monthly grid block!
# Let's extract `formContent` and `editModal` out to the main function body, before `return`.
"""
  function submitExpense(event: FormEvent<HTMLFormElement>) { ... }
...
  const formContent = ( ... );
  const editModal = ( ... );
"""
import sys
sys.exit(0)
