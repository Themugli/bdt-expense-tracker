import re

with open('src/hooks/use-expenses.tsx', 'r') as f:
    content = f.read()

# 1. Add SYNC_QUEUE_KEY
content = content.replace("const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;", "const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;\nconst SYNC_QUEUE_KEY = 'little-ledger-sync-queue';")

# 2. Update addExpense catch block
old_catch = """        if (error instanceof SyncError && error.code === '23505') {
          console.info(LOG, 'insert hit an existing id; treating as already saved', { id: expense.id });
          return true;
        }
        rollback(sc.key, expense.id, previous, index);
        notifyFailure('add', error, () => void addExpense(expense));
        return false;
      }"""
      
new_catch = """        if (error instanceof SyncError && error.code === '23505') {
          console.info(LOG, 'insert hit an existing id; treating as already saved', { id: expense.id });
          return true;
        }
        
        // Save to persistent queue for offline recovery
        const queue = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]');
        queue.push({ type: 'insert', payload: { id: expense.id, user_id: sc.userId, ledger_id: sc.ledgerId, ...expenseFields(expense) } });
        localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
        
        rollback(sc.key, expense.id, previous, index);
        notifyFailure('add', error, () => void addExpense(expense));
        return false;
      }"""
content = content.replace(old_catch, new_catch)

# 3. Add online listener to the useEffect that handles online events
# Wait, let's look for `window.addEventListener('online', onOnline);`
old_online = """    const onOnline = () => { if (scope?.kind === 'cloud') void api.syncNow(scope); };
    const onVisible = () => { if (document.visibilityState === 'visible' && scope?.kind === 'cloud') void api.syncNow(scope); };"""

new_online = """    const onOnline = async () => { 
      if (scope?.kind === 'cloud') {
        const queue = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]');
        if (queue.length > 0) {
          for (const item of queue) {
            if (item.type === 'insert') {
               await supabase.from('expenses').insert(item.payload).catch(console.error);
            }
          }
          localStorage.removeItem(SYNC_QUEUE_KEY);
        }
        void api.syncNow(scope); 
      }
    };
    const onVisible = () => { if (document.visibilityState === 'visible' && scope?.kind === 'cloud') void api.syncNow(scope); };"""
content = content.replace(old_online, new_online)

with open('src/hooks/use-expenses.tsx', 'w') as f:
    f.write(content)
