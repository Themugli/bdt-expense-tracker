const fs = require('fs');
let content = fs.readFileSync('src/pages/DailyLedger.tsx', 'utf-8');

content = content.replace(
  'const { expenses, addExpense, updateExpense, deleteExpense, recategorize } = useExpenses({ ledgerId: currentUser?.id ?? null, isGuest });',
  'const { expenses, addExpense, updateExpense, deleteExpense, recategorize } = useExpenses({ ledgerId: currentUser?.id ?? null, isGuest });\n  const { loans } = useLoans();'
);

content = content.replace(
  "const totalLoanDue = useMemo(() => loans.filter(l => l.type === 'payable' && l.status === 'active').reduce((sum, l) => sum + Number(l.amount), 0), [loans]);",
  "const totalLoanDue = useMemo(() => loans.filter(l => l.type === 'payable' && l.status === 'pending').reduce((sum, l) => sum + Number(l.amount), 0), [loans]);"
);

fs.writeFileSync('src/pages/DailyLedger.tsx', content);
