# Full-Stack QA Diagnostic Report

## 1. DBMS & Backend Logic

### Row Level Security (RLS) Loopholes
**Severity: Low/Medium**
The current RLS policies strictly bind access to `((SELECT auth.uid()) = user_id)`. This prevents cross-tenant data leakage perfectly. However, because `ledger_id` is passed from the client, a malicious user could theoretically inject another user's `ledger_id` into their own rows (e.g. `ledger_id = 'usr_victim'`). Because `user_id` is still their own, they wouldn't see the victim's data, but they could clutter the database. 

**Patch SQL:**
```sql
-- Ensure ledger_id always matches the user's own auth.uid() or 'guest'
ALTER TABLE public.expenses ADD CONSTRAINT expenses_ledger_id_check 
CHECK (ledger_id = user_id::text OR ledger_id = 'default');
```

### Missing Database Indexes
**Severity: Medium**
The primary read query in `use-expenses.tsx` executes:
`.order('date', { ascending: false }).order('created_at', { ascending: false })`
While `expenses_user_ledger_date_idx` covers `date DESC`, it lacks `created_at DESC`. As the database scales, Postgres will be forced to perform in-memory sorts for rows on the exact same date.

**Patch SQL:**
```sql
DROP INDEX IF EXISTS expenses_user_ledger_date_idx;
CREATE INDEX expenses_user_ledger_date_created_idx 
ON public.expenses (user_id, ledger_id, date DESC, created_at DESC);
```

## 2. JavaScript & React State

### Durable Outbox Race Condition (Offline Sync Data Loss)
**Severity: Critical (High)**
In `use-expenses.tsx`, `onOnline` parses the `SYNC_QUEUE_KEY`, `await`s the network requests sequentially, and then executes `localStorage.removeItem(SYNC_QUEUE_KEY)`. 
If the user clicks "Add to my ledger" *while* `onOnline` is awaiting its inserts, the new expense is pushed into `SYNC_QUEUE_KEY`. When `onOnline` finishes, it blindly calls `removeItem()`, deleting the user's newly added expense before it ever syncs!

**Code Fix (`use-expenses.tsx`):**
```typescript
const onOnline = async () => {
  const queue = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]');
  if (queue.length === 0) return;
  
  // Clear immediately before awaiting, so new inserts go into a fresh queue
  localStorage.removeItem(SYNC_QUEUE_KEY); 
  
  for (const item of queue) {
    if (item.type === 'insert') {
      await supabase.from('expenses').insert(item.payload).catch(console.error);
    }
  }
  void api.syncNow(sc);
};
```

### Unhandled Promise Rejections & Cleanups
**Severity: Low**
In `auth.tsx`, when updating `ledger_id` on login, the code uses `void supabase.auth.updateUser(...)`. If this fails, the error is swallowed and the UI doesn't react, meaning cross-device migration could silently fail.

**Code Fix (`auth.tsx`):**
```typescript
supabase.auth.updateUser({ data: { ledger_id: resolvedId } }).catch(console.error);
```

## 3. UI, CSS, and HTML (Visual Bugs)

### CSS Overflow on Massive Amounts
**Severity: Low**
In the "Category budgets" section (`App.tsx`), if a user inputs a massive amount (e.g., `999,999,999.00`), the budget display `<span>/ ৳999,999,999.00</span>` lacks a `truncate` utility. Because it's within a `flex-wrap` container, it will aggressively wrap to the next line or shatter the fixed-width UI on narrow mobile screens like iPhone SE.

**Code Fix (`App.tsx`):**
```tsx
- <p className="shrink-0 text-right font-display font-semibold text-[#4e6b5d]">
+ <p className="shrink-0 text-right font-display font-semibold text-[#4e6b5d] truncate max-w-[120px]">
```

### HTML Validity
**Severity: Low**
The Z-indexes on the category color picker modals (`z-40` and `z-50`) correctly trap clicks. However, the `select` element for categories lacks an explicit fallback if the `categories` array is somehow completely empty (which throws a React key error or renders an invisible dropdown). Empty states for zero expenses are handled gracefully, but zero categories break the form.
