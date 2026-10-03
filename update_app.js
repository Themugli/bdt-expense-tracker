const fs = require('fs');
let content = fs.readFileSync('artifacts/expense-tracker/src/App.tsx', 'utf-8');

// 1. Remove AuthLanding import and replace with AuthModal
content = content.replace(/AuthLanding/g, 'AuthModal');

// 2. Add showAuthModal state and requireAuth function inside Home
content = content.replace(
  'function Home() {',
  `function Home() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const requireAuth = (e?: React.SyntheticEvent, action?: () => void) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (!currentUser) {
      setShowAuthModal(true);
      return false;
    }
    if (action) action();
    return true;
  };
`
);

// 3. Add scroll and timer hooks for unauthenticated users inside Home
content = content.replace(
  'const today = localDate();',
  `const today = localDate();

  useEffect(() => {
    if (!currentUser && !showAuthModal) {
      const timer = setTimeout(() => setShowAuthModal(true), 15000);
      const handleScroll = () => {
        if (window.scrollY > 50) {
          setShowAuthModal(true);
        }
      };
      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        clearTimeout(timer);
        window.removeEventListener('scroll', handleScroll);
      };
    }
  }, [currentUser, showAuthModal]);
`
);

// 4. Remove if (!currentUser) return <AuthLanding...
content = content.replace(
  /if \(!currentUser\) \{[\s\S]*?return \([\s\S]*?<AuthModal[\s\S]*?\/\>[\s\S]*?\);[\s\S]*?\}/,
  ''
);

// 5. Add AuthModal at the end of the return statement
content = content.replace(
  /(\s*)(<\/main>)/,
  `$1  <AuthModal 
$1    isOpen={showAuthModal} 
$1    onClose={() => setShowAuthModal(false)}
$1    onLoginSuccess={(user, guest = false) => {
$1      setCurrentUser(user);
$1      setIsGuest(guest);
$1      setShowAuthModal(false);
$1    }}
$1  />
$1$2`
);

// 6. Hook up requireAuth to actions

// Add Expense button
content = content.replace(
  /onClick=\{\(\) => setAddingExpense\(true\)\}/g,
  `onClick={(e) => requireAuth(e, () => setAddingExpense(true))}`
);

// Edit Expense
content = content.replace(
  /onClick=\{\(e\) => \{ e\.preventDefault\(\); startEdit\(item\); \}\}/g,
  `onClick={(e) => requireAuth(e, () => startEdit(item))}`
);

// Delete Expense
content = content.replace(
  /onClick=\{\(e\) => \{ e\.preventDefault\(\); setExpenseToDelete\(item\.id\); \}\}/g,
  `onClick={(e) => requireAuth(e, () => setExpenseToDelete(item.id))}`
);

// Add Category
content = content.replace(
  /onClick=\{\(\) => setAddingCategory\(true\)\}/g,
  `onClick={(e) => requireAuth(e, () => setAddingCategory(true))}`
);

// Edit Category
content = content.replace(
  /onClick=\{\(e\) => \{ e\.preventDefault\(\); setEditingCategoryTarget\(item\.name\);[\s\S]*?\}\}/g,
  (match) => match.replace('e.preventDefault(); ', '').replace('onClick={(e) => { ', 'onClick={(e) => requireAuth(e, () => { ').replace(/\}$/, '})}')
);

// Delete Category
content = content.replace(
  /onClick=\{\(e\) => \{ e\.preventDefault\(\); setCategoryToDelete\(item\.name\); \}\}/g,
  `onClick={(e) => requireAuth(e, () => setCategoryToDelete(item.name))}`
);

// Filters (selects)
// We have select for month, select for category, select for tag
content = content.replace(
  /onChange=\{\(e\) => setSelectedMonth\(e\.target\.value\)\}/g,
  `onChange={(e) => { if (requireAuth(e)) setSelectedMonth(e.target.value); }}`
);
content = content.replace(
  /onChange=\{\(e\) => setFilterCategory\(e\.target\.value\)\}/g,
  `onChange={(e) => { if (requireAuth(e)) setFilterCategory(e.target.value); }}`
);
content = content.replace(
  /onChange=\{\(e\) => setFilterTag\(e\.target\.value\)\}/g,
  `onChange={(e) => { if (requireAuth(e)) setFilterTag(e.target.value); }}`
);

fs.writeFileSync('artifacts/expense-tracker/src/App.tsx', content);
console.log('App.tsx updated');
