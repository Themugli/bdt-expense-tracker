import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# 1. We need to add an effect to pull categories/income from metadata on load
pull_effect = """
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
"""

# Find where prevUserId block ends
prev_user_block = """  if (currentUser?.id !== prevUserId) {
    setPrevUserId(currentUser?.id);
    setCategories(loadCategories(currentUser?.id));
    const incKey = currentUser ? `little-ledger-income-usr-${currentUser.id}` : INCOME_KEY;
    const savedIncome = readStored(incKey, DEFAULT_MONTHLY_INCOME);
    setMonthlyIncome(Number.isFinite(savedIncome) && savedIncome >= 0 ? savedIncome : DEFAULT_MONTHLY_INCOME);
  }"""

content = content.replace(prev_user_block, prev_user_block + pull_effect)

# 2. Add an effect to push changes to metadata
push_effect = """
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
    }, 2000); // debounce 2s
    return () => clearTimeout(timer);
  }, [categories, monthlyIncome, currentUser, isGuest]);
"""

content = content.replace("  const [activeTab, setActiveTab]", push_effect + "\n  const [activeTab, setActiveTab]")

with open("src/App.tsx", "w") as f:
    f.write(content)
