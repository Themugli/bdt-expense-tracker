import { motion, AnimatePresence } from 'framer-motion';
import { bounce, overlayFade, modalPop, springTransition } from '@/lib/motion';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import {
  ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, BarChart3, CalendarDays, Check,
  ChevronDown, CircleHelp, Download, Edit3, Plus, Trash2, Wallet, X,
} from 'lucide-react';
import {
  getActiveSession,
} from '@/lib/auth';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import type { User, Expense } from '@/types';
import { useExpenses, newExpenseId } from '@/hooks/useExpenses';
import { useLoans } from '@/hooks/useLoans';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer,
  Tooltip as ChartTooltip, XAxis, YAxis,
} from 'recharts';

type Category = { name: string; budget: number; color?: string };
const DEFAULT_MONTHLY_INCOME = 0;
const CATEGORIES_KEY = 'little-ledger-categories-v1';
const INCOME_KEY = 'little-ledger-income-v1';
const initialCategories: Category[] = [
  { name: 'Transportation', budget: 0 },
  { name: 'Subscriptions', budget: 0 },
  { name: 'Fitness / Protein', budget: 0 },
  { name: 'Food', budget: 0 },
  { name: 'Shopping', budget: 0 },
  { name: 'Bills', budget: 0 },
  { name: 'Miscellaneous', budget: 0 },
];
const PREDEFINED_COLORS = [
  '#347d68', '#df8b68', '#d4ad48', '#6f9aaf', '#a088aa', '#8b9c75', '#cc7669',
  '#e2b72f', '#5e6884', '#9e5d4e', '#4c78a8', '#b57a55', '#6d8048', '#b2577a', '#746788'
];
const categoryAliases: Record<string, string> = {
  'Protein / Fitness': 'Fitness / Protein',
  'Miscellaneous / Savings': 'Miscellaneous',
};

function localDate(date = new Date()) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
}
function monthOf(date: string) { return date.slice(0, 7); }
function fmtMoney(value: number) {
  return `৳${value.toLocaleString('en-BD', { maximumFractionDigits: 2 })}`;
}
function monthLabel(month: string) {
  const [year, mm] = month.split('-').map(Number);
  return new Date(year, mm - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}
function readStored<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) as T : fallback;
  } catch {
    return fallback;
  }
}
function normalizeCategoryName(name: string) {
  return categoryAliases[name] ?? name;
}
function loadCategories(userId?: string) {
  const key = userId ? `little-ledger-categories-usr-${userId}` : CATEGORIES_KEY;
  const saved = readStored<Category[]>(key, initialCategories);
  const normalized = new Map<string, Category>();
  const ordered = [...saved].sort((a, b) => Number(categoryAliases[a.name] !== undefined) - Number(categoryAliases[b.name] !== undefined));
  for (const item of ordered) {
    if (!item || typeof item.name !== 'string' || !item.name.trim()) continue;
    const name = normalizeCategoryName(item.name);
    if (!normalized.has(name) || item.name === name) {
      const budget = Number(item.budget);
      normalized.set(name, { name, budget: Number.isFinite(budget) ? Math.max(0, budget) : 0 });
    }
  }
  const defaults = initialCategories.map((item) => normalized.get(item.name) ?? item);
  const defaultNames = new Set(initialCategories.map((item) => item.name));
  const custom = [...normalized.values()].filter((item) => !defaultNames.has(item.name));
  return [...defaults, ...custom];
}
function parseTags(value: string) {
  const tags: string[] = [];
  const seen = new Set<string>();
  for (const part of value.split(/[\s,;]+/)) {
    const tag = part.trim().replace(/^#+/, '').replace(/[,:;]+$/, '').slice(0, 32);
    const key = tag.toLocaleLowerCase();
    if (tag && !seen.has(key) && tags.length < 12) {
      tags.push(tag);
      seen.add(key);
    }
  }
  return tags;
}
function hashString(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash);
}

function colorForCategory(name: string, categories: Category[]) {
  const category = categories.find((item) => item.name === name);
  if (category?.color) return category.color;
  return PREDEFINED_COLORS[hashString(name) % PREDEFINED_COLORS.length];
}

export default function DailyLedger() {
  const [currentUser] = useState<User | null>(() => {
    const session = getActiveSession();
    return session ? session.user : null;
  });
  const requireAuth = (e?: React.SyntheticEvent, action?: () => void) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (!currentUser) {
      window.dispatchEvent(new Event('open-auth-modal'));
      return false;
    }
    if (action) action();
    return true;
  };
  const [isGuest] = useState<boolean>(() => {
    const session = getActiveSession();
    return session ? session.isGuest : false;
  });


  const today = localDate();


  const { expenses, addExpense, updateExpense, deleteExpense, recategorize } = useExpenses({ ledgerId: currentUser?.id ?? null, isGuest });
  const { loans } = useLoans();
  
  const [categories, setCategories] = useState<Category[]>(() => loadCategories(currentUser?.id));
  const [monthlyIncome, setMonthlyIncome] = useState(() => {
    const key = currentUser ? `little-ledger-income-usr-${currentUser.id}` : INCOME_KEY;
    const saved = readStored(key, DEFAULT_MONTHLY_INCOME);
    return Number.isFinite(saved) && saved >= 0 ? saved : DEFAULT_MONTHLY_INCOME;
  });
  
  const [prevUserId, setPrevUserId] = useState(currentUser?.id);
  if (currentUser?.id !== prevUserId) {
    setPrevUserId(currentUser?.id);
    setCategories(loadCategories(currentUser?.id));
    const incKey = currentUser ? `little-ledger-income-usr-${currentUser.id}` : INCOME_KEY;
    const savedIncome = readStored(incKey, DEFAULT_MONTHLY_INCOME);
    setMonthlyIncome(Number.isFinite(savedIncome) && savedIncome >= 0 ? savedIncome : DEFAULT_MONTHLY_INCOME);
  }

  useEffect(() => {
    if (!currentUser || isGuest) return;
    supabase.auth.getUser().then(({ data }) => {
      const meta = data.user?.user_metadata;
      if (meta) {
        if (meta.categories) {
          setCategories(meta.categories);
          const catKey = `little-ledger-key-usr-${currentUser.id}`;
          localStorage.setItem(catKey, JSON.stringify(meta.categories));
        }
        if (meta.monthly_income !== undefined) {
          setMonthlyIncome(meta.monthly_income);
          const incKey = `little-ledger-income-usr-${currentUser.id}`;
          localStorage.setItem(incKey, JSON.stringify(meta.monthly_income));
        }
      }
    });
  }, [currentUser, isGuest]);

  // Sync categories and income back to Supabase metadata automatically
  useEffect(() => {
    if (!currentUser || isGuest) return;
    const timer = setTimeout(async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      const meta = data.user.user_metadata || {};
      
      const currentCats = JSON.stringify(meta.categories || []);
      const newCats = JSON.stringify(categories);
      const currentInc = meta.monthly_income;
      
      if (currentCats !== newCats || currentInc !== monthlyIncome) {
        await supabase.auth.updateUser({
          data: {
            ...meta,
            categories,
            monthly_income: monthlyIncome
          }
        });
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [categories, monthlyIncome, currentUser, isGuest]);

  const [activeTab, setActiveTab] = useState<'daily' | 'monthly' | 'yearly'>('daily');
  const [selectedMonth, setSelectedMonth] = useState(monthOf(today));
  const [selectedYear, setSelectedYear] = useState(Number(today.slice(0, 4)));
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today);
  const [category, setCategory] = useState(initialCategories[0].name);
  const [customName, setCustomName] = useState('');
  const [customCategoryMode, setCustomCategoryMode] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [note, setNote] = useState('');
  const [amountError, setAmountError] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  const [editingIncome, setEditingIncome] = useState(false);
  const [incomeDraft, setIncomeDraft] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [editingCategoryTarget, setEditingCategoryTarget] = useState<string | null>(null);
  const [colorPickerTarget, setColorPickerTarget] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [editingCategoryColor, setEditingCategoryColor] = useState('#62a07b');
  const [editingCategoryBudget, setEditingCategoryBudget] = useState('0');
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  useEffect(() => {
    // Clear potentially lingering UI state
    clearForm();
    setCategoryFilter('all');
    setTagFilter('all');
    setEditingCategoryTarget(null);
    setColorPickerTarget(null);
    setEditingIncome(false);
  }, [currentUser?.id]);

  useEffect(() => {
    if (currentUser?.id !== prevUserId) return; // Prevent saving old state to new user's key
    const key = currentUser ? `little-ledger-categories-usr-${currentUser.id}` : CATEGORIES_KEY;
    localStorage.setItem(key, JSON.stringify(categories));
  }, [categories, currentUser?.id, prevUserId]);

  useEffect(() => {
    if (currentUser?.id !== prevUserId) return; // Prevent saving old state to new user's key
    const key = currentUser ? `little-ledger-income-usr-${currentUser.id}` : INCOME_KEY;
    localStorage.setItem(key, JSON.stringify(monthlyIncome));
  }, [monthlyIncome, currentUser?.id, prevUserId]);

  useEffect(() => { setCategoryFilter('all'); setTagFilter('all'); }, [selectedMonth]);

  useEffect(() => {
    if (editingId || expenseToDelete || editingCategoryTarget || categoryToDelete) {
      const prevOverflow = document.body.style.overflow;
      const prevPaddingRight = document.body.style.paddingRight;
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          if (editingId) clearForm();
          if (expenseToDelete) setExpenseToDelete(null);
          if (editingCategoryTarget) setEditingCategoryTarget(null);
          if (categoryToDelete) setCategoryToDelete(null);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = prevOverflow;
        document.body.style.paddingRight = prevPaddingRight;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
    return undefined;
  }, [editingId, expenseToDelete, editingCategoryTarget, categoryToDelete]);

  const monthExpenses = useMemo(
    () => expenses.filter((entry) => monthOf(entry.date) === selectedMonth).sort((a, b) => b.date.localeCompare(a.date)),
    [expenses, selectedMonth],
  );

  const availableYears = useMemo(
    () => [...new Set([Number(today.slice(0, 4)), ...expenses.map((entry) => Number(entry.date.slice(0, 4)))])].sort((a, b) => b - a),
    [expenses, today],
  );
  const yearlyMonthData = useMemo(() => {
    const byMonth = new Map<string, number>();
    for (const expense of expenses) {
      if (Number(expense.date.slice(0, 4)) !== selectedYear) continue;
      const month = monthOf(expense.date);
      byMonth.set(month, (byMonth.get(month) ?? 0) + expense.amount);
    }
    return [...byMonth.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, spent]) => {
      const [, monthNumber] = month.split('-').map(Number);
      return {
        month,
        label: monthLabel(month),
        shortLabel: new Date(selectedYear, monthNumber - 1, 1).toLocaleDateString('en-GB', { month: 'short' }),
        spent,
        income: monthlyIncome,
      };
    });
  }, [expenses, selectedYear, monthlyIncome]);
  const insightMonthData = useMemo(() => {
    const currentYear = Number(today.slice(0, 4));
    const totals = new Map<string, number>();
    for (const expense of expenses) {
      const expenseYear = Number(expense.date.slice(0, 4));
      if (expenseYear !== selectedYear || (selectedYear >= currentYear && expense.date > today)) continue;
      const month = monthOf(expense.date);
      totals.set(month, (totals.get(month) ?? 0) + expense.amount);
    }
    return [...totals.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, spent]) => ({ month, label: monthLabel(month), spent }));
  }, [expenses, selectedYear, today]);
  const yearTotal = insightMonthData.reduce((total, item) => total + item.spent, 0);
  const peakMonth = insightMonthData.reduce<(typeof insightMonthData)[number] | null>(
    (peak, item) => !peak || item.spent > peak.spent ? item : peak,
    null,
  );
  const monthlyAverage = insightMonthData.length ? yearTotal / insightMonthData.length : 0;
  const spent = monthExpenses.reduce((total, item) => total + item.amount, 0);
  const draftIncomeNumber = Number(incomeDraft);
  const activeIncome = editingIncome && incomeDraft.trim() !== '' && Number.isFinite(draftIncomeNumber) && draftIncomeNumber >= 0
    ? draftIncomeNumber
    : monthlyIncome;
  const remaining = activeIncome - spent;
  const rawUsage = activeIncome > 0 ? (spent / activeIncome) * 100 : spent > 0 ? 100 : 0;
  const usage = Math.min(100, Math.round(rawUsage));
  const categoryTotals = useMemo(() => categories.map((item) => ({
    ...item,
    spent: monthExpenses.filter((entry) => entry.category === item.name).reduce((total, entry) => total + entry.amount, 0),
  })), [categories, monthExpenses]);
  const pieData = categoryTotals.filter((item) => item.spent > 0).map((item) => ({ name: item.name, value: item.spent }));
  const tagData = useMemo(() => {
    const totals = new Map<string, number>();
    for (const expense of monthExpenses) {
      for (const tag of expense.tags) totals.set(tag, (totals.get(tag) ?? 0) + expense.amount);
    }
    return [...totals.entries()].map(([tag, value]) => ({ tag, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [monthExpenses]);
  const availableTags = useMemo(
    () => [...new Set(monthExpenses.flatMap((expense) => expense.tags))].sort((a, b) => a.localeCompare(b)),
    [monthExpenses],
  );
  const filteredExpenses = useMemo(
    () => monthExpenses.filter((expense) =>
      (categoryFilter === 'all' || expense.category === categoryFilter) &&
      (tagFilter === 'all' || expense.tags.includes(tagFilter)),
    ),
    [monthExpenses, categoryFilter, tagFilter],
  );
  const daysInMonth = new Date(Number(selectedMonth.slice(0, 4)), Number(selectedMonth.slice(5, 7)), 0).getDate();

  const todayExpenses = useMemo(() => expenses.filter((e) => e.date === today), [expenses, today]);
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
  
  const totalLoanDue = useMemo(() => loans.filter(l => l.type === 'payable' && l.status === 'pending').reduce((sum, l) => sum + Number(l.amount), 0), [loans]);

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
  const trendData = Array.from({ length: daysInMonth }, (_, index) => {
    const day = String(index + 1).padStart(2, '0');
    const dayExpenses = monthExpenses.filter((item) => item.date.slice(8, 10) === day);
    return { day: String(index + 1), amount: dayExpenses.reduce((sum, item) => sum + item.amount, 0) };
  });

  function clearForm() {
    setAmount('');
    setDate(today);
    setCategory(categories[0]?.name ?? '');
    setCustomName('');
    setCustomCategoryMode(false);
    setTagInput('');
    setNote('');
    setEditingId(null);
    setAmountError(false);
  }
  function submitExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedAmount = Number(amount);
    const typedCategory = customCategoryMode ? customName.trim() : category;
    const chosenCategory = categories.find((item) => item.name.toLocaleLowerCase() === typedCategory.toLocaleLowerCase())?.name ?? typedCategory;
    if (!amount || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setAmountError(true);
      return;
    }
    setAmountError(false);
    if (!date || !chosenCategory) return;
    if (!categories.some((item) => item.name === chosenCategory)) {
      setCategories((current) => [...current, { name: chosenCategory, budget: 0 }]);
    }
    const updated: Expense = {
      id: editingId ?? newExpenseId(),
      date, amount: parsedAmount, category: chosenCategory, note: note.trim(), tags: parseTags(tagInput),
    };
    const isFirstEntry = expenses.length === 0;
    
    if (editingId) {
      void updateExpense(updated);
    } else {
      void addExpense(updated);
    }
    if (monthOf(date) !== selectedMonth) setSelectedMonth(monthOf(date));
    setSelectedYear(Number(date.slice(0, 4)));
    clearForm();
    
    if (isGuest && !editingId && isFirstEntry) {
      window.dispatchEvent(new Event('open-auth-modal'));
    }
  }
  function startEdit(expense: Expense) {
    setEditingId(expense.id);
    setAmount(String(expense.amount));
    setDate(expense.date);
    setCategory(expense.category);
    setCustomName('');
    setCustomCategoryMode(false);
    setTagInput(expense.tags.map((tag) => `#${tag}`).join(', '));
    setNote(expense.note);
  }
  function saveIncome(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = Number(incomeDraft);
    if (!Number.isFinite(next) || next < 0) return;
    setMonthlyIncome(next);
    setEditingIncome(false);
  }
  function changeCategoryColor(name: string, color: string) {
    setCategories((current) => current.map((item) => item.name === name ? { ...item, color } : item));
  }

  function changeBudget(name: string, raw: string) {
    const cleaned = raw.replace(/^-/, '').replace(/^0+(?=\d)/, '');
    const next = Math.max(0, Number(cleaned) || 0);
    setCategories((current) => current.map((item) => item.name === name ? { ...item, budget: next } : item));
  }

  function renameCategory(oldName: string, newName: string) {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) {
      setEditingCategoryTarget(null);
      return;
    }
    
    const existingCategory = categories.find((c) => c.name.toLowerCase() === trimmed.toLowerCase());
    
    if (existingCategory && existingCategory.name !== oldName) {
      void recategorize(oldName, existingCategory.name);
      setCategories((current) => {
        const oldBudget = current.find((c) => c.name === oldName)?.budget || 0;
        return current
          .filter((c) => c.name !== oldName)
          .map((c) => c.name === existingCategory.name ? { ...c, budget: c.budget + oldBudget } : c);
      });
      if (category === oldName) setCategory(existingCategory.name);
      if (categoryFilter === oldName) setCategoryFilter(existingCategory.name);
    } else {
      setCategories((current) => current.map((c) => c.name === oldName ? { ...c, name: trimmed } : c));
      void recategorize(oldName, trimmed);
      if (category === oldName) setCategory(trimmed);
      if (categoryFilter === oldName) setCategoryFilter(trimmed);
    }
    
    setEditingCategoryTarget(null);
  }

  function saveCategoryEdit() {
    if (!editingCategoryTarget) return;
    const target = editingCategoryTarget;
    changeCategoryColor(target, editingCategoryColor);
    changeBudget(target, editingCategoryBudget);
    renameCategory(target, editingCategoryName);
    setEditingCategoryTarget(null);
  }

  function deleteCategory(name: string) {
    setCategories((current) => current.filter((c) => c.name !== name));
    void recategorize(name, 'Uncategorized');
    if (category === name) setCategory('Uncategorized');
    if (categoryFilter === name) setCategoryFilter('all');
  }
  function shiftMonth(amountBy: number) {
    const [year, month] = selectedMonth.split('-').map(Number);
    const next = new Date(year, month - 1 + amountBy, 1);
    const nextMonth = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(nextMonth);
    setSelectedYear(next.getFullYear());
  }
  function exportCsv() {
    const rows = [['Date', 'Amount (BDT)', 'Category', 'Tags', 'Note'], ...monthExpenses.map((item) => [item.date, String(item.amount), item.category, item.tags.map((tag) => `#${tag}`).join(' '), item.note])];
    const csv = rows.map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `little-ledger-${selectedMonth}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
  const balanceTone = remaining < 0 || rawUsage > 90 ? 'over' : rawUsage >= 70 ? 'careful' : 'steady';
  const chartTip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => (
    active && payload?.length ? <div className="rounded-xl border border-[#dce5dc] bg-[#fffdf8] px-3 py-2 text-xs shadow-lg">
      <div className="mb-1 text-[#7a8980]">{label}</div><strong className="text-[#24483c]">{fmtMoney(payload[0].value)}</strong>
    </div> : null
  );
  const yearlyChartTip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color?: string }>; label?: string }) => (
    active && payload?.length ? <div className="rounded-xl border border-[#dce5dc] bg-[#fffdf8] px-3 py-2 text-xs shadow-lg">
      <div className="mb-2 font-semibold text-[#7a8980]">{label}</div>
      {payload.map((item) => <div key={item.name} className="flex items-center justify-between gap-4">
        <span className="flex items-center gap-1.5 text-[#62796d]"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />{item.name}</span>
        <strong className="text-[#24483c]">{fmtMoney(item.value)}</strong>
      </div>)}
    </div> : null
  );



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

  return (
    <main className="money-page min-h-[100dvh] px-4 pb-12 pt-5 sm:px-7 lg:px-10">
      <div className="mx-auto max-w-[1180px]">
        {/* Header removed, now using global TopNav */}

        <section className="rise-in mb-5 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-sm font-medium text-[#789086]">A little more clarity, every day.</p>
            <h1 className="font-display text-[32px] font-bold leading-tight tracking-[-.055em] text-[#24483c] sm:text-[42px]">{activeTab === 'daily' ? <>Your money, <span className="text-[#d78967]">today.</span></> : activeTab === 'monthly' ? <>Your money, <span className="text-[#d78967]">this month.</span></> : <>A year in <span className="text-[#d78967]">perspective.</span></>}</h1>
          </div>
          {activeTab === 'daily' ? null : activeTab === 'monthly' ? <div className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[#dce5dc] bg-[#fbfaf5]/80 p-2 sm:w-auto">
            <motion.button {...bounce} type="button" onClick={() => shiftMonth(-1)} aria-label="Previous month" data-testid="button-previous-month" className="grid h-9 w-9 place-items-center rounded-xl text-[#597369] hover:bg-[#edf2e9]"><ArrowLeft size={16} /></motion.button>
            <label className="flex min-w-[160px] flex-1 items-center justify-center gap-2 px-1 text-sm font-semibold text-[#355a4d] sm:flex-none">
              <CalendarDays size={16} className="text-[#789086]" />
              <span className="sr-only">Selected month</span>
              <input aria-label="Selected month" data-testid="input-selected-month" type="month" value={selectedMonth} onChange={(event) => {
                if (!event.target.value) return;
                setSelectedMonth(event.target.value);
                setSelectedYear(Number(event.target.value.slice(0, 4)));
              }} className="w-[145px] cursor-pointer bg-transparent text-center text-sm font-semibold text-[#355a4d]" />
            </label>
            <motion.button {...bounce} type="button" onClick={() => shiftMonth(1)} aria-label="Next month" data-testid="button-next-month" className="grid h-9 w-9 place-items-center rounded-xl text-[#597369] hover:bg-[#edf2e9]"><ArrowRight size={16} /></motion.button>
          </div> : <label className="flex items-center gap-2 rounded-2xl border border-[#dce5dc] bg-[#fbfaf5]/80 px-4 py-3 text-sm font-semibold text-[#355a4d]">
            <CalendarDays size={16} className="text-[#789086]" />
            <span>Year</span>
            <span className="relative inline-flex items-center"><motion.select {...bounce} aria-label="Analytics year" data-testid="select-analytics-year" value={selectedYear} onChange={(event) => setSelectedYear(Number(event.target.value))} className="cursor-pointer bg-transparent text-sm font-semibold text-[#355a4d] appearance-none pr-10 transition-colors focus:outline-none focus:ring-0 focus:border-transparent">
              {availableYears.map((year) => <option key={year} value={year}>{year}</option>)}
            </motion.select><ChevronDown size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#82958a]" /></span>
          </label>}
        </section>

        <nav aria-label="Ledger views" className="mb-5 flex rounded-2xl border border-[#dce5dc] dark:border-[#384f46] bg-[#f3f4ed] dark:bg-[#1d2a25]/80 p-1">
          <motion.button {...bounce} type="button" aria-current={activeTab === 'daily' ? 'page' : undefined} data-testid="tab-daily-ledger" onClick={() => setActiveTab('daily')} className={`flex h-10 flex-1 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition ${activeTab === 'daily' ? 'bg-white dark:bg-[#1a2622] text-[#315548] dark:text-[#d1dbd6] shadow-sm' : 'text-[#819087] dark:text-[#88a096] hover:text-[#355a4d] dark:text-[#d1dbd6]'}`}><CalendarDays size={16} />Daily Ledger</motion.button>
          <motion.button {...bounce} type="button" aria-current={activeTab === 'monthly' ? 'page' : undefined} data-testid="tab-monthly-ledger" onClick={() => setActiveTab('monthly')} className={`flex h-10 flex-1 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition ${activeTab === 'monthly' ? 'bg-white dark:bg-[#1a2622] text-[#315548] dark:text-[#d1dbd6] shadow-sm' : 'text-[#819087] dark:text-[#88a096] hover:text-[#355a4d] dark:text-[#d1dbd6]'}`}><CalendarDays size={16} />Monthly Ledger</motion.button>
          <motion.button {...bounce} type="button" aria-current={activeTab === 'yearly' ? 'page' : undefined} data-testid="tab-yearly-overview" onClick={() => setActiveTab('yearly')} className={`flex h-10 flex-1 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition ${activeTab === 'yearly' ? 'bg-white dark:bg-[#1a2622] text-[#315548] dark:text-[#d1dbd6] shadow-sm' : 'text-[#819087] dark:text-[#88a096] hover:text-[#355a4d] dark:text-[#d1dbd6]'}`}><BarChart3 size={16} />Yearly Overview</motion.button>
        </nav>

        
        {activeTab === 'daily' ? <>
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
              <div className="mt-2 flex justify-between text-[11px] text-[#8a9990] dark:text-[#88a096]"><span>৳0</span><span>{todayRemainingMonthlyPool < 0 ? `${fmtMoney(Math.abs(todayRemainingMonthlyPool))} over pool` : `${fmtMoney(todayRemainingMonthlyPool)} remaining this month`}</span><span>{fmtMoney(startOfDayBudget)}</span></div>
              <p className="mt-4 flex items-center gap-2 text-xs leading-relaxed text-[#71857a] dark:text-[#88a096]">
                {todaySpent === 0 ? <CircleHelp size={14} /> : todayRemainingMonthlyPool < 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {todaySpent === 0 ? 'A fresh page. Add your first expense when you’re ready.' : todayRemainingMonthlyPool < 0 ? 'You’ve gone beyond your total monthly budget.' : `You used ${todayUsage}% of your available monthly budget today.`}
              </p>
            </div>
          </div>
        </section>

        <section className="glass-card mb-5 rounded-[24px] p-5 sm:p-6" data-testid="daily-detail-panel">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div><p className="mb-1 text-xs font-semibold uppercase tracking-[.12em] text-[#9a8c77]">Daily detail</p><h2 className="font-display text-[21px] font-bold tracking-[-.04em] text-[#294d40] dark:text-[#e4e9e7]">{new Date(`${today}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</h2></div>
            <span className="rounded-full bg-[#edf2e9] dark:bg-[#253630] px-3 py-1 text-xs font-semibold text-[#628675]">{todayExpenses.length} {todayExpenses.length === 1 ? 'entry' : 'entries'}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-[#f4f5ef] dark:bg-[#23312c]/80 p-4"><p className="text-xs text-[#819087] dark:text-[#88a096]">Available Budget</p><p data-testid="text-detail-daily-income" className="mt-1 font-display text-xl font-bold text-[#355a4d] dark:text-[#d1dbd6]">{fmtMoney(remaining)}</p></div>
            <div className="rounded-2xl bg-[#f4f5ef] dark:bg-[#23312c]/80 p-4"><p className="text-xs text-[#819087] dark:text-[#88a096]">Total spent today</p><p data-testid="text-detail-daily-spent" className="mt-1 font-display text-xl font-bold text-[#355a4d] dark:text-[#d1dbd6]">{fmtMoney(todaySpent)}</p></div>
            <div className="rounded-2xl bg-[#f4f5ef] dark:bg-[#23312c]/80 p-4"><p className="text-xs text-[#819087] dark:text-[#88a096]">Total Loan Due</p><p data-testid="text-detail-daily-savings" className="mt-1 font-display text-xl font-bold text-[#b8584b]">{fmtMoney(totalLoanDue)}</p></div>
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
            {todayPieData.length ? <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center w-full">
              <div className="col-span-1 flex justify-center">
                <div className="relative h-[190px] w-[190px]">
                  <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={todayPieData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={82} paddingAngle={3} stroke="none" cornerRadius={4}>{todayPieData.map((entry) => <Cell key={entry.name} fill={colorForCategory(entry.name, categories)} />)}</Pie><ChartTooltip content={chartTip} /></PieChart></ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><strong data-testid="text-category-spend-total" className="font-display text-[19px] font-bold text-[#315548] dark:text-[#d1dbd6]">{fmtMoney(todaySpent)}</strong><span className="text-[10px] text-[#8a9990] dark:text-[#88a096]">total spent</span></div>
                </div>
              </div>
              <div className="col-span-1 w-full space-y-3">
                {todayPieData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between gap-2 relative">
                    <div className="flex min-w-0 items-center gap-2">
                      <motion.button {...bounce} type="button" onClick={() => setColorPickerTarget(colorPickerTarget === `pie-${item.name}` ? null : `pie-${item.name}`)} aria-label={`Change color for ${item.name}`} className="h-3 w-3 shrink-0 rounded-full shadow-sm hover:scale-110 transition-transform" style={{ backgroundColor: colorForCategory(item.name, categories) }} />
                      {colorPickerTarget === `pie-${item.name}` && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setColorPickerTarget(null)} />
                          <div className="absolute top-full left-0 mt-2 z-50 w-48 rounded-xl bg-white dark:bg-[#1a2622] p-3 shadow-xl border border-[#dce5dc] dark:border-[#384f46]">
                             <div className="flex flex-wrap gap-2 mb-3">
                               {PREDEFINED_COLORS.map(c => (
                                 <motion.button {...bounce} type="button" aria-label={`Select color ${c}`} key={c} onClick={() => { changeCategoryColor(item.name, c); setColorPickerTarget(null); }} className="h-6 w-6 rounded-full hover:scale-110 transition-transform shadow-sm" style={{ backgroundColor: c }} />
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
                    <span data-testid={`text-donut-amount-${item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} className="shrink-0 text-xs font-semibold text-[#355a4d] dark:text-[#d1dbd6]">{fmtMoney(item.value)}</span>
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
              <tbody>{todayFilteredExpenses.map((item) => <tr key={item.id} data-testid={`row-expense-${item.id}`} className="group border-b border-[#edf0e9] dark:border-[#2a3c35] last:border-0 hover:bg-gray-50 dark:hover:bg-white/5">
                <td data-testid={`text-expense-date-${item.id}`} className="py-3.5 pr-3 text-xs text-[#74877d] dark:text-[#9bb0a6]">{new Date(`${item.date}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</td>
                <td className="py-3.5 pr-3"><span className="inline-flex items-center gap-2 text-xs font-medium text-[#4d6c5e] dark:text-[#aabcb3]"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: colorForCategory(item.category, categories) }} />{item.category}</span></td>
                <td data-testid={`text-expense-tags-${item.id}`} className="py-3.5 pr-3"><div className="flex max-w-[170px] flex-wrap gap-1">{item.tags.map((tag) => <span key={tag} className="rounded-md bg-[#edf2e9] dark:bg-[#253630] px-1.5 py-1 text-[10px] text-[#628675] dark:text-[#aabcb3]">#{tag}</span>)}</div></td>
                <td data-testid={`text-expense-note-${item.id}`} className="max-w-[180px] truncate py-3.5 pr-3 text-xs text-[#93a097] dark:text-[#7b9087]">{item.note || '—'}</td>
                <td data-testid={`text-expense-amount-${item.id}`} className="py-3.5 pr-3 text-right text-sm font-semibold text-[#355a4d] dark:text-[#d1dbd6]">{fmtMoney(item.amount)}</td>
                <td className="py-3.5 text-right"><div className="flex justify-end gap-1"><motion.button whileTap={{ scale: 0.9 }} transition={springTransition} type="button" aria-label={`Edit ${item.category} expense`} data-testid={`button-edit-expense-${item.id}`} onClick={() => startEdit(item)} className="rounded-full p-2 text-[#789086] dark:text-[#88a096] opacity-75 transition-colors hover:bg-[#e9f0e8] hover:text-[#347d68] dark:hover:bg-[#344a42] dark:hover:text-[#aabcb3]"><Edit3 size={14} /></motion.button><motion.button whileTap={{ scale: 0.9 }} transition={springTransition} type="button" aria-label={`Delete ${item.category} expense`} data-testid={`button-delete-expense-${item.id}`} onClick={() => setExpenseToDelete(item.id)} className="rounded-full p-2 text-[#a88e87] opacity-75 transition-colors hover:bg-[#f8e9e4] hover:text-[#ba5b4d] dark:hover:bg-[#4a2b27] dark:hover:text-[#e4a39b]"><Trash2 size={14} /></motion.button></div></td>
              </tr>)}</tbody>
            </table>
          </div> : <div className="rounded-2xl bg-[#f4f4ec] dark:bg-[#121b18]/65 px-5 py-8 text-center"><p data-testid="text-no-filter-results" className="text-sm font-semibold text-[#547165] dark:text-[#aabcb3]">No expenses match those filters</p><p className="mt-1 text-xs text-[#8a9990] dark:text-[#88a096]">Try another category or tag.</p></div> : <div className="flex flex-col items-center justify-center rounded-2xl bg-[#f4f4ec] dark:bg-[#121b18]/65 px-5 py-10 text-center"><div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-[#e6eee4] dark:bg-[#2c3f38] text-[#638b73] dark:text-[#88a096]"><CalendarDays size={19} /></div><p data-testid="text-empty-ledger" className="font-display text-base font-bold text-[#4a6c5c] dark:text-[#aabcb3]">Your page is still blank</p><p className="mt-1 max-w-[270px] text-xs leading-relaxed text-[#87968c] dark:text-[#88a096]">When you spend today, leave yourself a little note here. It all stays on this device.</p></div>}
          <div className="mt-4 flex items-center justify-between border-t border-[#e6ebe3] dark:border-[#2a3c35] pt-4 text-xs"><span className="text-[#839289] dark:text-[#88a096]">{todayExpenses.length} {todayExpenses.length === 1 ? 'entry' : 'entries'} today</span><span className="font-semibold text-[#426457] dark:text-[#aabcb3]">Day total <strong data-testid="text-ledger-total" className="ml-2 font-display text-sm text-[#24483c] dark:text-[#e4e9e7]">{fmtMoney(todaySpent)}</strong></span></div>
        </section>
        </> : activeTab === 'monthly' ? <>


        <section className="rise-in-delay glass-card relative mb-5 overflow-hidden rounded-[26px] p-5 sm:p-7">
          <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border-[1px] border-[#dbe7d8]/80" />
          <div className="pointer-events-none absolute -right-2 -top-10 h-44 w-44 rounded-full border-[1px] border-[#e6ebe0]" />
          <div className="relative grid gap-7 md:grid-cols-[1.15fr_.85fr] md:items-center">
            <div>
              <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.12em] text-[#789086]"><span className="h-[1px] w-5 bg-[#a3b8a8]" /> Monthly income</div>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                {editingIncome ? <form onSubmit={saveIncome} className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-2xl font-bold text-[#24483c]">৳</span>
                  <input aria-label="Monthly income in BDT" data-testid="input-monthly-income" type="number" min="0" step="0.01" required autoFocus value={incomeDraft} onChange={(event) => setIncomeDraft(event.target.value)} className="h-11 w-36 rounded-xl border border-[#cbdace] bg-white/70 px-3 text-lg font-semibold text-[#24483c] focus:outline-none focus:ring-0 focus:border-transparent" />
                  <motion.button {...bounce} type="submit" data-testid="button-save-income" className="h-9 rounded-lg bg-[#347d68] px-3 text-xs font-semibold text-white hover:bg-[#2d705d]">Save</motion.button>
                  <motion.button {...bounce} type="button" aria-label="Cancel income edit" data-testid="button-cancel-income" onClick={() => setEditingIncome(false)} className="grid h-9 w-9 place-items-center rounded-lg text-[#768980] hover:bg-[#edf1e8]"><X size={16} /></motion.button>
                </form> : <>
                  <div data-testid="text-monthly-allowance" className="font-display text-[43px] font-bold leading-none tracking-[-.06em] text-[#24483c] sm:text-[54px]">{fmtMoney(monthlyIncome)}</div>
                  <motion.button {...bounce} type="button" aria-label="Edit monthly income" data-testid="button-edit-income" onClick={() => { setIncomeDraft(String(monthlyIncome)); setEditingIncome(true); }} className="rounded-lg px-2 py-1 text-xs font-semibold text-[#628675] hover:bg-[#edf2e9]">Edit</motion.button>
                </>}
                <div className="text-sm text-[#819087]">per month</div>
              </div>
              <div className="mt-7 flex flex-wrap gap-x-9 gap-y-4">
                <div><div className="mb-1 text-xs text-[#819087]">Spent so far</div><div data-testid="text-monthly-spent" className="font-display text-[22px] font-bold tracking-[-.04em] text-[#355a4d]">{fmtMoney(spent)}</div></div>
                <div><div className="mb-1 text-xs text-[#819087]">Still yours</div><div data-testid="text-monthly-remaining" className={`font-display text-[22px] font-bold tracking-[-.04em] ${remaining < 0 ? 'text-[#b8584b]' : 'text-[#347d68]'}`}>{remaining < 0 ? `−${fmtMoney(Math.abs(remaining))}` : fmtMoney(remaining)}</div></div>
              </div>
            </div>
            <div className="rounded-[20px] border border-white/70 bg-white/35 p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-[#446558]">Your month at a glance</span>
                <span data-testid="text-allowance-usage" className={`rounded-full px-2.5 py-1 text-xs font-semibold ${balanceTone === 'over' ? 'bg-[#fae5df] text-[#a7463c]' : balanceTone === 'careful' ? 'bg-[#f6edcf] text-[#927629]' : 'bg-[#e1eee2] text-[#39795e]'}`}>{usage}% used</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-[#e6ebe3]">
                <div data-testid="progress-allowance" className={`h-full rounded-full transition-[width] duration-500 ${balanceTone === 'over' ? 'bg-[#c85f51]' : balanceTone === 'careful' ? 'bg-[#d9b74f]' : 'bg-[#65a17d]'}`} style={{ width: `${usage}%` }} />
              </div>
              <div className="mt-2 flex justify-between text-[11px] text-[#8a9990]"><span>৳0</span><span>{remaining < 0 ? `${fmtMoney(Math.abs(remaining))} over` : `${fmtMoney(remaining)} to go`}</span><span>{fmtMoney(activeIncome)}</span></div>
              <p className="mt-4 flex items-center gap-2 text-xs leading-relaxed text-[#71857a]">
                {spent === 0 ? <CircleHelp size={14} /> : remaining < 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {spent === 0 ? 'A fresh page. Add your first expense when you’re ready.' : remaining < 0 ? 'You’ve gone a little beyond this month’s income.' : `${fmtMoney(remaining)} is still available for the rest of your month.`}
              </p>
            </div>
          </div>
        </section>

        <section className="glass-card mb-5 rounded-[24px] p-5 sm:p-6" data-testid="monthly-detail-panel">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div><p className="mb-1 text-xs font-semibold uppercase tracking-[.12em] text-[#9a8c77]">Monthly detail</p><h2 className="font-display text-[21px] font-bold tracking-[-.04em] text-[#294d40]">{monthLabel(selectedMonth)}</h2></div>
            <span className="rounded-full bg-[#edf2e9] px-3 py-1 text-xs font-semibold text-[#628675]">{monthExpenses.length} {monthExpenses.length === 1 ? 'entry' : 'entries'}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-[#f4f5ef]/80 p-4"><p className="text-xs text-[#819087]">Monthly income</p><p data-testid="text-detail-income" className="mt-1 font-display text-xl font-bold text-[#355a4d]">{fmtMoney(activeIncome)}</p></div>
            <div className="rounded-2xl bg-[#f4f5ef]/80 p-4"><p className="text-xs text-[#819087]">Total spent</p><p data-testid="text-detail-spent" className="mt-1 font-display text-xl font-bold text-[#355a4d]">{fmtMoney(spent)}</p></div>
            <div className={`rounded-2xl p-4 ${remaining < 0 ? 'bg-[#fae9e4]' : 'bg-[#e8f0e7]'}`}><p className="text-xs text-[#819087]">{remaining < 0 ? 'Deficit' : 'Savings'}</p><p data-testid="text-detail-savings" className={`mt-1 font-display text-xl font-bold ${remaining < 0 ? 'text-[#b8584b]' : 'text-[#347d68]'}`}>{remaining < 0 ? `−${fmtMoney(Math.abs(remaining))}` : fmtMoney(remaining)}</p></div>
          </div>
        </section>

        {editModal}

          <section className="glass-card mb-5 rounded-[24px] p-5 sm:p-6 w-full">
            <div className="mb-4 flex items-end justify-between"><div><p className="mb-1 text-xs font-semibold uppercase tracking-[.12em] text-[#9a8c77]">The shape of your spending</p><h2 className="font-display text-[21px] font-bold tracking-[-.04em] text-[#294d40]">Where it went</h2></div><span className="text-xs text-[#8a9990]">{monthExpenses.length} {monthExpenses.length === 1 ? 'entry' : 'entries'}</span></div>
            {pieData.length ? <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center w-full">
              <div className="col-span-1 flex justify-center">
                <div className="relative h-[190px] w-[190px]">
                  <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={82} paddingAngle={3} stroke="none" cornerRadius={4}>{pieData.map((entry) => <Cell key={entry.name} fill={colorForCategory(entry.name, categories)} />)}</Pie><ChartTooltip content={chartTip} /></PieChart></ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><strong data-testid="text-category-spend-total" className="font-display text-[19px] font-bold text-[#315548]">{fmtMoney(spent)}</strong><span className="text-[10px] text-[#8a9990]">total spent</span></div>
                </div>
              </div>
              <div className="col-span-1 w-full space-y-3">
                {pieData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between gap-2 relative">
                    <div className="flex min-w-0 items-center gap-2">
                      <motion.button {...bounce} type="button" onClick={() => setColorPickerTarget(colorPickerTarget === `pie-${item.name}` ? null : `pie-${item.name}`)} aria-label={`Change color for ${item.name}`} className="h-3 w-3 shrink-0 rounded-full shadow-sm hover:scale-110 transition-transform" style={{ backgroundColor: colorForCategory(item.name, categories) }} />
                      {colorPickerTarget === `pie-${item.name}` && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setColorPickerTarget(null)} />
                          <div className="absolute top-full left-0 mt-2 z-50 w-48 rounded-xl bg-white p-3 shadow-xl border border-[#dce5dc]">
                             <div className="flex flex-wrap gap-2 mb-3">
                               {PREDEFINED_COLORS.map(c => (
                                 <motion.button {...bounce} type="button" aria-label={`Select color ${c}`} key={c} onClick={() => { changeCategoryColor(item.name, c); setColorPickerTarget(null); }} className="h-6 w-6 rounded-full hover:scale-110 transition-transform shadow-sm" style={{ backgroundColor: c }} />
                               ))}
                             </div>
                             <div className="border-t border-[#e6ebe3] pt-3 flex items-center justify-between">
                               <span className="text-xs font-semibold text-[#789086]">Custom color</span>
                               <input type="color" value={colorForCategory(item.name, categories)} onChange={(e) => changeCategoryColor(item.name, e.target.value)} className="h-7 w-7 cursor-pointer border-0 p-0 rounded bg-transparent" />
                             </div>
                          </div>
                        </>
                      )}
                      <span className="truncate text-xs text-[#62796d]">{item.name}</span>
                    </div>
                    <span data-testid={`text-donut-amount-${item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} className="shrink-0 text-xs font-semibold text-[#355a4d]">{fmtMoney(item.value)}</span>
                  </div>
                ))}
              </div>
            </div> : <div className="flex min-h-[190px] flex-col items-center justify-center rounded-2xl bg-[#f4f4ec]/70 text-center"><div className="mb-3 grid h-11 w-11 place-items-center rounded-full bg-[#e7eee4] text-[#668b75]"><Wallet size={19} /></div><p className="text-sm font-semibold text-[#547165]">Nothing spent just yet</p><p className="mt-1 max-w-[220px] text-xs leading-relaxed text-[#8a9990]">Your categories will take shape here as you add expenses.</p></div>}
          </section>

        <section className="glass-card mb-5 rounded-[24px] p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2"><div><p className="mb-1 text-xs font-semibold uppercase tracking-[.12em] text-[#9a8c77]">One day at a time</p><h2 className="font-display text-[21px] font-bold tracking-[-.04em] text-[#294d40]">Daily rhythm</h2></div><div className="flex items-center gap-2 text-[11px] text-[#7e9287]"><span className="h-2 w-2 rounded-full bg-[#4d9275]" />Daily spend · BDT</div></div>
          <div className="h-[205px] w-full">
            {monthExpenses.length ? <ResponsiveContainer width="100%" height="100%"><AreaChart data={trendData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}><defs><linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#559778" stopOpacity={.25} /><stop offset="100%" stopColor="#559778" stopOpacity={.015} /></linearGradient></defs><CartesianGrid vertical={false} stroke="#e8ede5" strokeDasharray="3 5" /><XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#87968c' }} interval={Math.max(0, Math.floor(daysInMonth / 9) - 1)} tickFormatter={(value) => `${value}`} /><YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#87968c' }} width={52} tickFormatter={(value) => value >= 1000 ? `৳${(value / 1000).toFixed(value % 1000 ? 1 : 0)}k` : `৳${value}`} /><ChartTooltip content={chartTip} /><Area type="monotone" dataKey="amount" stroke="#4d9275" strokeWidth={2.5} fill="url(#spendFill)" activeDot={{ r: 4, fill: '#4d9275', stroke: '#f9f8f1', strokeWidth: 2 }} /></AreaChart></ResponsiveContainer> : <div className="flex h-full flex-col items-center justify-center rounded-2xl bg-[#f4f4ec]/70"><p className="text-sm font-semibold text-[#547165]">Your rhythm will appear here</p><p className="mt-1 text-xs text-[#8a9990]">Log a few days of spending to see the pattern.</p></div>}
          </div>
        </section>

        <section className="glass-card mb-5 rounded-[24px] p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2"><div><p className="mb-1 text-xs font-semibold uppercase tracking-[.12em] text-[#9a8c77]">Follow the little labels</p><h2 className="font-display text-[21px] font-bold tracking-[-.04em] text-[#294d40]">Top spending tags</h2></div><p className="text-[11px] text-[#87968c]">An expense with multiple tags appears under each one.</p></div>
          {tagData.length ? <div className="grid items-center gap-4 md:grid-cols-[1.25fr_.75fr]">
            <div className="h-[230px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tagData} layout="vertical" margin={{ top: 4, right: 18, left: 4, bottom: 4 }}>
                  <CartesianGrid horizontal={false} stroke="#e8ede5" strokeDasharray="3 5" />
                  <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#87968c' }} tickFormatter={(value) => value >= 1000 ? `৳${(value / 1000).toFixed(value % 1000 ? 1 : 0)}k` : `৳${value}`} />
                  <YAxis type="category" dataKey="tag" width={94} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#62796d' }} tickFormatter={(value) => `#${value}`} />
                  <ChartTooltip content={chartTip} />
                  <Bar dataKey="value" fill="#559778" radius={[0, 7, 7, 0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {tagData.map((item) => <div key={item.tag} data-testid={`row-tag-total-${item.tag.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} className="flex items-center justify-between gap-3 rounded-xl bg-[#f4f5ef]/75 px-3 py-2">
                <span className="truncate text-xs font-medium text-[#62796d]">#{item.tag}</span><span className="shrink-0 text-xs font-semibold text-[#355a4d]">{fmtMoney(item.value)}</span>
              </div>)}
            </div>
          </div> : <div className="flex min-h-[115px] flex-col items-center justify-center rounded-2xl bg-[#f4f4ec]/70 text-center">
            <p className="text-sm font-semibold text-[#547165]">No tags in {monthLabel(selectedMonth)} yet</p>
            <p className="mt-1 text-xs text-[#8a9990]">Add tags to an expense to see the breakdown.</p>
          </div>}
        </section>

        <section className="glass-card mb-5 rounded-[24px] p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="mb-1 text-xs font-semibold uppercase tracking-[.12em] text-[#9a8c77]">A gentle check-in</p><h2 className="font-display text-[21px] font-bold tracking-[-.04em] text-[#294d40]">Category budgets</h2></div><p className="text-xs text-[#87968c]">Adjust any amount to suit your month</p></div>
          <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {categoryTotals.map((item) => {
              const ratio = item.budget > 0 ? item.spent / item.budget : item.spent > 0 ? 1 : 0;
              const barColor = ratio >= 1 ? '#c66655' : ratio >= .75 ? '#d4aa46' : '#62a07b';
              return <div key={item.name} className="group rounded-2xl border border-[#e4e9e1] bg-[#fffdf8]/45 p-4" data-testid={`budget-row-${item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>
                <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 relative">
                      <span className="h-3 w-3 shrink-0 rounded-full shadow-sm" style={{ backgroundColor: colorForCategory(item.name, categories) }} />
                      <div className="truncate text-sm font-semibold text-[#416356]">{item.name}</div>
                      <div className="flex gap-1 opacity-60 group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <motion.button {...bounce} type="button" aria-label={`Edit ${item.name}`} onClick={() => { setEditingCategoryTarget(item.name); setEditingCategoryName(item.name); setEditingCategoryColor(colorForCategory(item.name, categories)); setEditingCategoryBudget(item.budget.toString()); }} className="rounded-full p-2 text-[#789086] transition-colors hover:bg-[#edf2e9] hover:text-[#347d68]"><Edit3 size={14} /></motion.button>
                        <motion.button {...bounce} type="button" aria-label={`Delete ${item.name}`} onClick={() => setCategoryToDelete(item.name)} className="rounded-full p-2 text-[#a88e87] transition-colors hover:bg-[#fae9e4] hover:text-[#ba5b4d]"><Trash2 size={14} /></motion.button>
                      </div>
                    </div>
                    <div className="mt-1 text-[11px] text-[#87968c]">{item.budget === 0 && item.spent === 0 ? 'No budget set' : item.budget === 0 ? `${fmtMoney(item.spent)} spent · no budget` : `${fmtMoney(item.spent)} spent`}</div>
                  </div>
                  <label className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#f0f2eb] px-2 py-1.5 text-[11px] text-[#87968c]"><span>Budget</span><span className="font-semibold text-[#547165]">৳</span><input aria-label={`${item.name} monthly budget in BDT`} data-testid={`input-budget-${item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} type="number" min="0" step="50" value={item.budget.toString()} onChange={(event) => changeBudget(item.name, event.target.value)} onKeyDown={(e) => { if (['-', '+', 'e', 'E', '.'].includes(e.key)) e.preventDefault(); }} onBlur={(e) => { e.target.value = item.budget.toString(); }} className="w-[80px] bg-transparent text-right text-xs font-semibold text-[#416356] outline-none" /></label>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#e8ece4]"><div data-testid={`progress-budget-${item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} className="h-full rounded-full transition-[width] duration-500" style={{ width: `${item.budget > 0 ? Math.min(100, ratio * 100) : item.spent > 0 ? 100 : 0}%`, backgroundColor: barColor }} /></div>
                <div className="mt-2 flex justify-between text-[10px] text-[#91a096]"><span>{item.budget > 0 ? `${Math.round(ratio * 100)}% of budget` : 'Spending tracked'}</span><span>{item.budget > 0 ? `${fmtMoney(Math.max(item.budget - item.spent, 0))} left` : 'Set budget above'}</span></div>
              </div>;
            })}
          </div>
        </section>

        <section className="glass-card rounded-[24px] p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="mb-1 text-xs font-semibold uppercase tracking-[.12em] text-[#9a8c77]">The little details</p><h2 className="font-display text-[21px] font-bold tracking-[-.04em] text-[#294d40]">Your ledger</h2></div><motion.button {...bounce} type="button" onClick={exportCsv} data-testid="button-export-csv" className="flex h-9 items-center gap-2 rounded-xl border border-[#dce5dc] bg-[#fffdf8]/70 px-3 text-xs font-semibold text-[#537364] hover:bg-[#edf2e9]"><Download size={14} />Download CSV</motion.button></div>
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-[#819087]">Filter by category</span><span className="relative block"><motion.select {...bounce} aria-label="Filter expenses by category" data-testid="select-filter-category" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="h-10 w-full rounded-xl border border-[#dce5dc] bg-[#fffdf8]/75 px-3 text-xs text-[#4d6c5e] appearance-none pr-10 cursor-pointer transition-colors focus:outline-none focus:ring-0 focus:border-transparent"><option value="all">All categories</option>{categories.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}</motion.select><ChevronDown size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#82958a]" /></span></label>
            <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-[#819087]">Filter by tag</span><span className="relative block"><motion.select {...bounce} aria-label="Filter expenses by tag" data-testid="select-filter-tag" value={tagFilter} onChange={(event) => setTagFilter(event.target.value)} className="h-10 w-full rounded-xl border border-[#dce5dc] bg-[#fffdf8]/75 px-3 text-xs text-[#4d6c5e] appearance-none pr-10 cursor-pointer transition-colors focus:outline-none focus:ring-0 focus:border-transparent"><option value="all">All tags</option>{availableTags.map((item) => <option key={item} value={item}>#{item}</option>)}</motion.select><ChevronDown size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#82958a]" /></span></label>
          </div>
          {monthExpenses.length ? filteredExpenses.length ? <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead><tr className="border-b border-[#e6ebe3] text-[10px] font-semibold uppercase tracking-[.1em] text-[#95a198]"><th className="pb-3 pr-3 font-semibold">Date</th><th className="pb-3 pr-3 font-semibold">Category</th><th className="pb-3 pr-3 font-semibold">Tags</th><th className="pb-3 pr-3 font-semibold">Note</th><th className="pb-3 pr-3 text-right font-semibold">Amount</th><th className="pb-3 text-right font-semibold">Edit</th></tr></thead>
              <tbody>{filteredExpenses.map((item) => <tr key={item.id} data-testid={`row-expense-${item.id}`} className="group border-b border-[#edf0e9] last:border-0 hover:bg-gray-50">
                <td data-testid={`text-expense-date-${item.id}`} className="py-3.5 pr-3 text-xs text-[#74877d]">{new Date(`${item.date}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</td>
                <td className="py-3.5 pr-3"><span className="inline-flex items-center gap-2 text-xs font-medium text-[#4d6c5e]"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: colorForCategory(item.category, categories) }} />{item.category}</span></td>
                <td data-testid={`text-expense-tags-${item.id}`} className="py-3.5 pr-3"><div className="flex max-w-[170px] flex-wrap gap-1">{item.tags.map((tag) => <span key={tag} className="rounded-md bg-[#edf2e9] px-1.5 py-1 text-[10px] text-[#628675]">#{tag}</span>)}</div></td>
                <td data-testid={`text-expense-note-${item.id}`} className="max-w-[180px] truncate py-3.5 pr-3 text-xs text-[#93a097]">{item.note || '—'}</td>
                <td data-testid={`text-expense-amount-${item.id}`} className="py-3.5 pr-3 text-right text-sm font-semibold text-[#355a4d]">{fmtMoney(item.amount)}</td>
                <td className="py-3.5 text-right"><div className="flex justify-end gap-1"><motion.button whileTap={{ scale: 0.9 }} transition={springTransition} type="button" aria-label={`Edit ${item.category} expense`} data-testid={`button-edit-expense-${item.id}`} onClick={() => startEdit(item)} className="rounded-full p-2 text-[#789086] opacity-75 transition-colors hover:bg-[#e9f0e8] hover:text-[#347d68]"><Edit3 size={14} /></motion.button><motion.button whileTap={{ scale: 0.9 }} transition={springTransition} type="button" aria-label={`Delete ${item.category} expense`} data-testid={`button-delete-expense-${item.id}`} onClick={() => setExpenseToDelete(item.id)} className="rounded-full p-2 text-[#a88e87] opacity-75 transition-colors hover:bg-[#f8e9e4] hover:text-[#ba5b4d]"><Trash2 size={14} /></motion.button></div></td>
              </tr>)}</tbody>
            </table>
          </div> : <div className="rounded-2xl bg-[#f4f4ec]/65 px-5 py-8 text-center"><p data-testid="text-no-filter-results" className="text-sm font-semibold text-[#547165]">No expenses match those filters</p><p className="mt-1 text-xs text-[#8a9990]">Try another category or tag.</p></div> : <div className="flex flex-col items-center justify-center rounded-2xl bg-[#f4f4ec]/65 px-5 py-10 text-center"><div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-[#e6eee4] text-[#638b73]"><CalendarDays size={19} /></div><p data-testid="text-empty-ledger" className="font-display text-base font-bold text-[#4a6c5c]">Your page is still blank</p><p className="mt-1 max-w-[270px] text-xs leading-relaxed text-[#87968c]">{monthExpenses.length === 0 && expenses.length ? `No entries in ${monthLabel(selectedMonth)}. Pick another month or start a fresh note.` : 'When you spend, leave yourself a little note here. It all stays on this device.'}</p></div>}
          <div className="mt-4 flex items-center justify-between border-t border-[#e6ebe3] pt-4 text-xs"><span className="text-[#839289]">{monthExpenses.length} {monthExpenses.length === 1 ? 'entry' : 'entries'} in {monthLabel(selectedMonth)}</span><span className="font-semibold text-[#426457]">Month total <strong data-testid="text-ledger-total" className="ml-2 font-display text-sm">{fmtMoney(spent)}</strong></span></div>
        </section>
        </> : <>
          <section className="mb-5 grid gap-4 md:grid-cols-3" data-testid="yearly-insight-cards">
            <article className="glass-card rounded-[24px] p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[.1em] text-[#9a8c77]">Highest spending month</p>
              {peakMonth ? <div className="mt-3"><p data-testid="text-peak-month" className="font-display text-xl font-bold text-[#294d40]">{peakMonth.label}</p><p className="mt-1 text-sm font-semibold text-[#d78967]">{fmtMoney(peakMonth.spent)}</p></div> : <p className="mt-3 text-sm text-[#87968c]">No recorded months yet</p>}
            </article>
            <article className="glass-card rounded-[24px] p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[.1em] text-[#9a8c77]">{selectedYear === Number(today.slice(0, 4)) ? 'Total spent year-to-date' : `Total spent in ${selectedYear}`}</p>
              <p data-testid="text-year-total" className="mt-3 font-display text-2xl font-bold text-[#294d40]">{fmtMoney(yearTotal)}</p>
              <p className="mt-1 text-xs text-[#87968c]">{yearlyMonthData.length} active {yearlyMonthData.length === 1 ? 'month' : 'months'}</p>
            </article>
            <article className="glass-card rounded-[24px] p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[.1em] text-[#9a8c77]">Monthly average spend</p>
              <p data-testid="text-year-average" className="mt-3 font-display text-2xl font-bold text-[#294d40]">{fmtMoney(monthlyAverage)}</p>
              <p className="mt-1 text-xs text-[#87968c]">Average across months with expenses</p>
            </article>
          </section>

          <section className="glass-card rounded-[24px] p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
              <div><p className="mb-1 text-xs font-semibold uppercase tracking-[.12em] text-[#9a8c77]">Income and spending</p><h2 className="font-display text-[21px] font-bold tracking-[-.04em] text-[#294d40]">Monthly comparison · {selectedYear}</h2></div>
              <span className="text-xs text-[#87968c]">Only months with recorded expenses</span>
            </div>
            {yearlyMonthData.length ? <div className="h-[330px] w-full" data-testid="yearly-comparison-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearlyMonthData} margin={{ top: 12, right: 12, left: 4, bottom: 4 }}>
                  <CartesianGrid vertical={false} stroke="#e8ede5" strokeDasharray="3 5" />
                  <XAxis dataKey="shortLabel" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#87968c' }} />
                  <YAxis tickLine={false} axisLine={false} width={56} tick={{ fontSize: 10, fill: '#87968c' }} tickFormatter={(value) => value >= 1000 ? `৳${(value / 1000).toFixed(value % 1000 ? 1 : 0)}k` : `৳${value}`} />
                  <ChartTooltip content={yearlyChartTip} />
                  <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                  <Bar dataKey="spent" name="Spent" fill="#559778" radius={[6, 6, 0, 0]} maxBarSize={42} />
                  <Bar dataKey="income" name="Monthly income" fill="#d4ad48" radius={[6, 6, 0, 0]} maxBarSize={42} />
                </BarChart>
              </ResponsiveContainer>
            </div> : <div className="flex min-h-[250px] flex-col items-center justify-center rounded-2xl bg-[#f4f4ec]/70 text-center">
              <BarChart3 size={22} className="mb-3 text-[#668b75]" />
              <p className="text-sm font-semibold text-[#547165]">No recorded spending in {selectedYear}</p>
              <p className="mt-1 text-xs text-[#8a9990]">Add an expense in the Monthly Ledger to start this year’s analytics.</p>
            </div>}
          </section>
        </>}
        <footer className="flex items-center justify-center gap-2 py-7 text-[11px] text-[#93a097]"><span>Just for you</span><span className="h-1 w-1 rounded-full bg-[#d78967]" /><span>Your numbers never leave this device</span></footer>
      </div>
      
      <AnimatePresence>{editingCategoryTarget && (
        <div key="modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div {...overlayFade} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setEditingCategoryTarget(null)}></motion.div>
          <motion.form {...modalPop} onSubmit={(e) => requireAuth(e, () => saveCategoryEdit())} className="relative glass-card max-w-md w-full rounded-[28px] border border-white/80 p-6 sm:p-8 bg-white/95 max-h-[90vh] overflow-y-auto z-10 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-display text-xl font-bold text-[#294d40]">Edit category</h3>
              <motion.button {...bounce} type="button" aria-label="Close" onClick={() => setEditingCategoryTarget(null)} className="grid h-8 w-8 place-items-center rounded-full bg-[#f4f5ef] text-[#627a6d] hover:bg-[#e8ebe3]"><X size={16} /></motion.button>
            </div>
            <label className="mb-4 block"><span className="mb-1.5 block text-[11px] font-semibold text-[#819087]">Name</span>
              <input autoFocus aria-label="Category name" value={editingCategoryName} onChange={(e) => setEditingCategoryName(e.target.value)} className="h-11 w-full rounded-xl border border-[#dce5dc] bg-white px-3 text-sm text-[#416356] focus:outline-none focus:ring-0 focus:border-transparent" />
            </label>
            <label className="mb-4 block"><span className="mb-1.5 block text-[11px] font-semibold text-[#819087]">Monthly budget (৳)</span>
              <input aria-label="Category budget" type="number" min="0" step="50" value={editingCategoryBudget} onChange={(e) => setEditingCategoryBudget(e.target.value)} onKeyDown={(e) => { if (['-', '+', 'e', 'E', '.'].includes(e.key)) e.preventDefault(); }} className="h-11 w-full rounded-xl border border-[#dce5dc] bg-white px-3 text-sm text-[#416356] focus:outline-none focus:ring-0 focus:border-transparent" />
            </label>
            <div className="mb-6"><span className="mb-2 block text-[11px] font-semibold text-[#819087]">Color</span>
              <div className="flex flex-wrap items-center gap-2">
                {PREDEFINED_COLORS.map((c) => (
                  <motion.button {...bounce} type="button" aria-label={`Select color ${c}`} key={c} onClick={() => setEditingCategoryColor(c)} className={`h-7 w-7 rounded-full shadow-sm transition-transform hover:scale-110 ${editingCategoryColor.toLowerCase() === c.toLowerCase() ? 'ring-2 ring-offset-2 ring-[#347d68]' : ''}`} style={{ backgroundColor: c }} />
                ))}
                <input type="color" aria-label="Custom color" value={editingCategoryColor} onChange={(e) => setEditingCategoryColor(e.target.value)} className="h-7 w-7 cursor-pointer border-0 p-0 rounded bg-transparent" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <motion.button {...bounce} type="button" onClick={() => setEditingCategoryTarget(null)} className="flex-1 rounded-xl bg-[#f4f5ef] py-3 text-sm font-semibold text-[#627a6d] hover:bg-[#e8ebe3] transition">Cancel</motion.button>
              <motion.button {...bounce} type="submit" className="flex-1 rounded-xl bg-[#347d68] py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#2b6857] transition">Save changes</motion.button>
            </div>
          </motion.form>
        </div>
      )}</AnimatePresence>

      <ConfirmModal
        isOpen={!!categoryToDelete}
        title="Delete Category?"
        description={`Are you sure you want to delete the "${categoryToDelete}" category? Expenses in this category will be marked as "Uncategorized".`}
        onCancel={() => setCategoryToDelete(null)}
        onConfirm={() => requireAuth(undefined, () => { deleteCategory(categoryToDelete!); setCategoryToDelete(null); })}
      />

      <ConfirmModal
        isOpen={!!expenseToDelete}
        title="Delete Expense?"
        description="Are you sure you want to delete this expense from your ledger? This action cannot be undone."
        onCancel={() => setExpenseToDelete(null)}
        onConfirm={() => requireAuth(undefined, () => { void deleteExpense(expenseToDelete!); setExpenseToDelete(null); })}
      />

    </main>
  );
}

