import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# 1. Imports
imports = """import {
  AuthLanding,
  type User,
  getActiveSession,
  saveActiveSession,
  getStoredUsers,
  saveStoredUsers,
} from './auth';
import { useExpenses, newExpenseId } from '@/hooks/use-expenses';"""
content = re.sub(
    r"import \{\s+AuthLanding,\s+type User,\s+getActiveSession,\s+saveActiveSession,\s+getStoredUsers,\s+saveStoredUsers,\s+\} from './auth';",
    imports,
    content
)

# 2. Hook declaration and useEffect removal
# Find exactly:
old_state = """  const today = localDate();
  const [expenses, setExpenses] = useState<Expense[]>(() => loadExpenses(currentUser?.id));
  const [categories, setCategories] = useState<Category[]>(() => loadCategories(currentUser?.id));
  const [monthlyIncome, setMonthlyIncome] = useState(() => {
    const key = currentUser ? `little-ledger-income-usr-${currentUser.id}` : INCOME_KEY;
    const saved = readStored(key, DEFAULT_MONTHLY_INCOME);
    return Number.isFinite(saved) && saved >= 0 ? saved : DEFAULT_MONTHLY_INCOME;
  });"""

new_state = """  const today = localDate();
  const { expenses, addExpense, updateExpense, deleteExpense, recategorize } = useExpenses(currentUser, isGuest);
  
  const [categories, setCategories] = useState<Category[]>(() => loadCategories(currentUser?.id));
  const [monthlyIncome, setMonthlyIncome] = useState(() => {
    const key = currentUser ? `little-ledger-income-usr-${currentUser.id}` : INCOME_KEY;
    const saved = readStored(key, DEFAULT_MONTHLY_INCOME);
    return Number.isFinite(saved) && saved >= 0 ? saved : DEFAULT_MONTHLY_INCOME;
  });"""

content = content.replace(old_state, new_state)

# Remove the useEffects for expenses
old_effect = """  useEffect(() => {
    if (currentUser) {
      setExpenses(loadExpenses(currentUser.id));
      const incKey = `little-ledger-income-usr-${currentUser.id}`;
      const savedIncome = readStored(incKey, DEFAULT_MONTHLY_INCOME);
      setMonthlyIncome(Number.isFinite(savedIncome) && savedIncome >= 0 ? savedIncome : DEFAULT_MONTHLY_INCOME);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    const key = currentUser ? `little-ledger-expenses-usr-${currentUser.id}` : EXPENSES_KEY;
    localStorage.setItem(key, JSON.stringify(expenses));
  }, [expenses, currentUser?.id]);"""

new_effect = """  useEffect(() => {
    if (currentUser) {
      const incKey = `little-ledger-income-usr-${currentUser.id}`;
      const savedIncome = readStored(incKey, DEFAULT_MONTHLY_INCOME);
      setMonthlyIncome(Number.isFinite(savedIncome) && savedIncome >= 0 ? savedIncome : DEFAULT_MONTHLY_INCOME);
    }
  }, [currentUser?.id]);"""

content = content.replace(old_effect, new_effect)

# 3. Add expense
old_submit = """    const updated: Expense = {
      id: editingId ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date, amount: parsedAmount, category: chosenCategory, note: note.trim(), tags: parseTags(tagInput),
    };
    setExpenses((current) => editingId
      ? current.map((item) => item.id === editingId ? updated : item)
      : [updated, ...current]);"""

new_submit = """    const updated: Expense = {
      id: editingId ?? newExpenseId(),
      date, amount: parsedAmount, category: chosenCategory, note: note.trim(), tags: parseTags(tagInput),
    };
    if (editingId) {
      void updateExpense(updated);
    } else {
      void addExpense(updated);
    }"""
content = content.replace(old_submit, new_submit)

# 4. Rename Category
old_rename_1 = """      setExpenses((current) => current.map((e) => e.category === oldName ? { ...e, category: existingCategory.name } : e));"""
new_rename_1 = """      void recategorize(oldName, existingCategory.name);"""
content = content.replace(old_rename_1, new_rename_1)

old_rename_2 = """      setCategories((current) => current.map((c) => c.name === oldName ? { ...c, name: trimmed } : c));
      setExpenses((current) => current.map((e) => e.category === oldName ? { ...e, category: trimmed } : e));"""
new_rename_2 = """      setCategories((current) => current.map((c) => c.name === oldName ? { ...c, name: trimmed } : c));
      void recategorize(oldName, trimmed);"""
content = content.replace(old_rename_2, new_rename_2)

# 5. Delete Category
old_delete = """    setCategories((current) => current.filter((c) => c.name !== name));
    setExpenses((current) => current.map((e) => e.category === name ? { ...e, category: 'Uncategorized' } : e));"""
new_delete = """    setCategories((current) => current.filter((c) => c.name !== name));
    void recategorize(name, 'Uncategorized');"""
content = content.replace(old_delete, new_delete)

# 6. Delete Expense
old_delete_exp = """onClick={() => { if (window.confirm('Delete this expense from your ledger?')) setExpenses((current) => current.filter((entry) => entry.id !== item.id)); }}"""
new_delete_exp = """onClick={() => { if (window.confirm('Delete this expense from your ledger?')) void deleteExpense(item.id); }}"""
content = content.replace(old_delete_exp, new_delete_exp)

with open('src/App.tsx', 'w') as f:
    f.write(content)
