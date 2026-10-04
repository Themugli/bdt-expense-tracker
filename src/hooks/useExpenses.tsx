import { useEffect, useMemo, useRef, useState } from 'react';
import type { PostgrestError, RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/useToast';
import { ToastAction } from '@/components/ui/toast';

/* ──────────────────────────────────────────────────────────────────────────
   Types & helpers
   ────────────────────────────────────────────────────────────────────────── */

import type { Expense } from '@/types';

/**
 * idle       – no profile selected
 * local      – Guest Mode: data lives only in this browser
 * connecting – signed in, loading from the cloud / joining Realtime
 * live       – signed in, cloud loaded and Realtime subscribed
 * offline    – signed in, but the cloud or Realtime is unreachable
 */
export type SyncStatus = 'idle' | 'local' | 'connecting' | 'live' | 'offline';

type ExpenseRow = {
  id: string;
  user_id: string;
  ledger_id: string;
  date: string;
  amount: number | string;
  category: string;
  note: string | null;
  tags: string[] | null;
};

type Scope =
  | { kind: 'local'; key: string; storageKey: string; ledgerId: string }
  | { kind: 'cloud'; key: string; storageKey: string; ledgerId: string; userId: string };

type Store = { key: string | null; items: Expense[] };
type MutationKind = 'add' | 'update' | 'delete' | 'recategorize';

const LOG = '[expenses-sync]';
const EMPTY: Expense[] = [];
const ROW_COLUMNS = 'id,user_id,ledger_id,date,amount,category,note,tags';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SYNC_QUEUE_KEY = 'little-ledger-sync-queue';

const categoryAliases: Record<string, string> = {
  'Protein / Fitness': 'Fitness / Protein',
  'Miscellaneous / Savings': 'Miscellaneous',
};
export function normalizeCategoryName(name: string) {
  return categoryAliases[name] ?? name;
}

/** Device-only storage for a profile. Also acts as an "outbox" that is
 *  uploaded once to the cloud the first time a signed-in profile syncs. */
export const legacyExpensesKey = (ledgerId: string) => `little-ledger-expenses-usr-${ledgerId}`;
/** Offline cache of the cloud ledger, scoped to BOTH the Supabase user and
 *  the local profile so one account's cache can never be shown to another. */
const cloudCacheKey = (userId: string, ledgerId: string) => `little-ledger-cloud-${userId}-${ledgerId}`;

/** UUID v4 that also works outside secure contexts (e.g. LAN dev server). */
export function newExpenseId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function sanitizeExpense(raw: unknown): Expense | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Partial<Expense> & { amount?: unknown };
  const amount = Number(item.amount);
  if (typeof item.id !== 'string' || typeof item.date !== 'string' || !Number.isFinite(amount) || amount <= 0) return null;
  const category = typeof item.category === 'string' && item.category.trim() ? normalizeCategoryName(item.category) : 'Uncategorized';
  return {
    id: item.id,
    date: item.date.slice(0, 10),
    amount,
    category,
    note: typeof item.note === 'string' ? item.note : '',
    tags: Array.isArray(item.tags) ? item.tags.filter((t): t is string => typeof t === 'string') : [],
  };
}

function readExpenses(storageKey: string): Expense[] | null {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.map(sanitizeExpense).filter((e): e is Expense => e !== null);
  } catch (error) {
    console.warn(LOG, `could not read ${storageKey}`, error);
    return null;
  }
}

function initialItems(scope: Scope | null): Expense[] {
  if (!scope) return [];
  if (scope.kind === 'cloud') return readExpenses(scope.storageKey) ?? readExpenses(legacyExpensesKey(scope.ledgerId)) ?? [];
  return readExpenses(scope.storageKey) ?? [];
}

function rowToExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    date: String(row.date).slice(0, 10),
    amount: Number(row.amount),
    category: normalizeCategoryName(row.category || 'Uncategorized'),
    note: row.note ?? '',
    tags: Array.isArray(row.tags) ? row.tags : [],
  };
}

/** Clamps values to the DB constraints so a valid UI entry never fails a CHECK. */
function expenseFields(e: Expense) {
  return {
    date: e.date,
    amount: Math.round(e.amount * 100) / 100,
    category: (e.category.trim() || 'Uncategorized').slice(0, 40),
    note: e.note.slice(0, 80),
    tags: e.tags.slice(0, 12),
  };
}

function upsertItem(items: Expense[], item: Expense, atIndex = 0): Expense[] {
  const idx = items.findIndex((i) => i.id === item.id);
  if (idx === -1) {
    const next = items.slice();
    next.splice(Math.min(Math.max(atIndex, 0), next.length), 0, item);
    return next;
  }
  const next = items.slice();
  next[idx] = item;
  return next;
}

/* ──────────────────────────────────────────────────────────────────────────
   Error handling
   ────────────────────────────────────────────────────────────────────────── */

export class SyncError extends Error {
  readonly op: string;
  readonly status: number;
  readonly code: string;
  readonly details: string | null;
  readonly hint: string | null;
  readonly userMessage: string;

  constructor(init: { op: string; status: number; code?: string | null; message: string; details?: string | null; hint?: string | null }) {
    super(init.message);
    this.name = 'SyncError';
    this.op = init.op;
    this.status = init.status;
    this.code = init.code ?? '';
    this.details = init.details ?? null;
    this.hint = init.hint ?? null;
    this.userMessage = friendlyMessage(this.status, this.code, this.message);
  }
}

function friendlyMessage(status: number, code: string, message: string): string {
  const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
  if (offline || status === 0 || /failed to fetch|networkerror|load failed|network request failed/i.test(message)) {
    return 'You appear to be offline, so this change couldn’t reach the server.';
  }
  if (code === 'PGRST301' || /jwt expired/i.test(message)) return 'Your session has expired. Please sign in again.';
  if (code === 'not-found') return 'This expense no longer exists or you don’t have access to it.';
  if (status === 401 || status === 403 || code === '42501') return 'You don’t have permission to change this. Please sign in again.';
  if (code === '22003') return 'That amount is too large to save.';
  if (code === '23514' || code === '22P02' || code === '23502') return 'Some of the values in this entry aren’t valid.';
  if (code === '42703' || code === 'PGRST204') return 'The database is missing a required update. Please contact support.';
  if (status === 429) return 'Too many requests right now. Please wait a moment and try again.';
  if (status >= 500) return 'The server ran into a problem. Please try again shortly.';
  return 'Something went wrong while saving. Please try again.';
}

type PostgrestLike<T> = { data: T | null; error: PostgrestError | null; status: number; statusText: string };

/**
 * Runs a Supabase query with explicit error handling:
 *  - catches thrown exceptions (network/abort/etc.)
 *  - checks the returned `error` object
 *  - checks the HTTP status (non-2xx is a failure even without `error`)
 * Logs full detail to the console and throws a SyncError with a friendly message.
 */
async function exec<T>(op: string, context: Record<string, unknown>, run: () => PromiseLike<PostgrestLike<T>>): Promise<T | null> {
  let result: PostgrestLike<T>;
  try {
    result = await run();
  } catch (thrown) {
    const message = thrown instanceof Error ? thrown.message : String(thrown);
    console.error(LOG, `${op} threw before a response was received`, { context, error: thrown });
    throw new SyncError({ op, status: 0, code: 'network', message });
  }
  const { data, error, status, statusText } = result;
  if (error || status < 200 || status >= 300) {
    const syncError = new SyncError({
      op,
      status,
      code: error?.code,
      message: error?.message || statusText || `HTTP ${status}`,
      details: error?.details,
      hint: error?.hint,
    });
    console.error(LOG, `${op} failed`, {
      status,
      statusText,
      code: error?.code,
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
      context,
    });
    throw syncError;
  }
  return data;
}

const failureTitles: Record<MutationKind, string> = {
  add: 'Expense not saved',
  update: 'Changes not saved',
  delete: 'Expense not deleted',
  recategorize: 'Category change not synced',
};

function notifyFailure(kind: MutationKind, error: unknown, retry: () => void) {
  const message = error instanceof SyncError ? error.userMessage : 'Something went wrong while saving. Please try again.';
  if (!(error instanceof SyncError)) console.error(LOG, `${kind} failed with an unexpected error`, error);
  toast({
    variant: 'destructive',
    title: failureTitles[kind],
    description: `${message} Your ledger was restored to how it was.`,
    action: (
      <ToastAction altText="Try again" onClick={retry}>
        Try again
      </ToastAction>
    ),
  });
}

/* ──────────────────────────────────────────────────────────────────────────
   Hook
   ────────────────────────────────────────────────────────────────────────── */

export function useExpenses({ ledgerId, isGuest }: { ledgerId: string | null; isGuest: boolean }) {
  // The Supabase user is the real owner of cloud rows (enforced by RLS).
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [authResolved, setAuthResolved] = useState(false);
  useEffect(() => {
    let active = true;
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) console.error(LOG, 'getSession failed', error);
        setAuthUserId(data.session?.user.id ?? null);
        setAuthResolved(true);
      })
      .catch((error) => {
        console.error(LOG, 'getSession threw', error);
        if (active) setAuthResolved(true);
      });
    // Keep this callback synchronous — Supabase warns against awaiting inside it.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUserId(session?.user.id ?? null);
      setAuthResolved(true);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  // Guest Mode never touches the cloud. Signed-in profiles sync once the
  // Supabase session is known; until then they write to the device outbox.
  const scope = useMemo<Scope | null>(() => {
    if (!ledgerId) return null;
    if (!isGuest && authUserId) {
      return { kind: 'cloud', key: `cloud:${authUserId}:${ledgerId}`, storageKey: cloudCacheKey(authUserId, ledgerId), ledgerId, userId: authUserId };
    }
    return { kind: 'local', key: `local:${ledgerId}`, storageKey: legacyExpensesKey(ledgerId), ledgerId };
  }, [ledgerId, isGuest, authUserId]);

  // State is tagged with the scope it belongs to. When the profile/account
  // changes we swap the whole store, so one profile's data can never be
  // written under another profile's key (even for a single render).
  const [store, setStore] = useState<Store>(() => ({ key: scope?.key ?? null, items: initialItems(scope) }));
  const scopeKey = scope?.key ?? null;
  if (store.key !== scopeKey) setStore({ key: scopeKey, items: initialItems(scope) });
  const expenses = store.key === scopeKey ? store.items : EMPTY;

  const [status, setStatus] = useState<SyncStatus>(scope ? (scope.kind === 'local' && isGuest ? 'local' : 'connecting') : 'idle');

  const scopeRef = useRef(scope);
  scopeRef.current = scope;
  const storeRef = useRef(store);
  storeRef.current = store;

  // In-flight optimistic mutations. Used so a refetch or Realtime echo that
  // arrives mid-request doesn't clobber what the user just did.
  const pendingRef = useRef({ inserts: new Map<string, Expense>(), updates: new Map<string, Expense>(), deletes: new Set<string>() });
  // Legacy device entries that failed to upload; kept visible until they do.
  const outboxRef = useRef<Expense[]>([]);
  // Realtime events received while a full fetch is in flight are replayed on top of it.
  const fetchingRef = useRef(0);
  const replayRef = useRef<Array<(items: Expense[]) => Expense[]>>([]);

  // Persist the store under the key it belongs to (offline cache / guest data).
  useEffect(() => {
    if (!store.key || !scope || store.key !== scope.key) return;
    try {
      localStorage.setItem(scope.storageKey, JSON.stringify(store.items));
    } catch (error) {
      console.warn(LOG, 'could not persist expenses to localStorage', error);
    }
  }, [store, scope]);

  const api = useMemo(() => {
    const applyToScope = (key: string, fn: (items: Expense[]) => Expense[]) => {
      setStore((s) => (s.key === key ? { key, items: fn(s.items) } : s));
    };

    const snapshot = (id: string) => {
      const items = storeRef.current.items;
      const index = items.findIndex((i) => i.id === id);
      return { previous: index === -1 ? undefined : items[index], index };
    };

    /** Restores a single entity to its pre-mutation state. Targeted (rather
     *  than replacing the whole array) so concurrent successful changes and
     *  Realtime updates from other devices are not thrown away. */
    const rollback = (key: string, id: string, previous: Expense | undefined, index: number) => {
      applyToScope(key, (items) => (previous ? upsertItem(items, previous, index) : items.filter((i) => i.id !== id)));
    };

    const mergeWithPending = (server: Expense[]): Expense[] => {
      const { inserts, updates, deletes } = pendingRef.current;
      const byId = new Map(server.map((e) => [e.id, e] as const));
      for (const [id, e] of updates) if (byId.has(id)) byId.set(id, e);
      for (const id of deletes) byId.delete(id);
      const extras = [...inserts.values(), ...outboxRef.current].filter((e) => !byId.has(e.id) && !deletes.has(e.id));
      return [...extras, ...byId.values()];
    };

    /** One-time upload of entries saved on this device before cloud sync.
     *  Ids are made stable first and the upload ignores duplicates, so a
     *  retry after a partial failure can never create duplicate rows. */
    const migrateLegacy = async (sc: Extract<Scope, { kind: 'cloud' }>) => {
      const legacyKey = legacyExpensesKey(sc.ledgerId);
      const legacy = readExpenses(legacyKey);
      if (!legacy) return;
      if (legacy.length === 0) {
        localStorage.removeItem(legacyKey);
        return;
      }
      const stable = legacy.map((e) => (UUID_RE.test(e.id) ? e : { ...e, id: newExpenseId() }));
      localStorage.setItem(legacyKey, JSON.stringify(stable));
      try {
        await exec('migrate-local-expenses', { count: stable.length, ledgerId: sc.ledgerId }, () =>
          supabase
            .from('expenses')
            .upsert(stable.map((e) => ({ id: e.id, user_id: sc.userId, ledger_id: sc.ledgerId, ...expenseFields(e) })), { onConflict: 'id', ignoreDuplicates: true }),
        );
        localStorage.removeItem(legacyKey);
        outboxRef.current = [];
        toast({ title: 'Ledger synced to the cloud', description: `${stable.length} expense${stable.length === 1 ? '' : 's'} saved on this device ${stable.length === 1 ? 'was' : 'were'} uploaded to your account.` });
      } catch (error) {
        outboxRef.current = stable;
        throw error;
      }
    };

    let lastLoadErrorAt = 0;
    const syncNow = async (sc: Extract<Scope, { kind: 'cloud' }>) => {
      try {
        try {
          await migrateLegacy(sc);
        } catch (error) {
          console.error(LOG, 'legacy upload failed; will retry on next sync', error);
        }
        fetchingRef.current += 1;
        const rows = await exec<ExpenseRow[]>('select', { ledgerId: sc.ledgerId }, () =>
          supabase
            .from('expenses')
            .select(ROW_COLUMNS)
            // RLS already restricts rows to auth.uid(); the explicit filter is defence in depth.
            .eq('user_id', sc.userId)
            .eq('ledger_id', sc.ledgerId)
            .order('date', { ascending: false })
            .order('created_at', { ascending: false }),
        );
        if (scopeRef.current?.key !== sc.key) return;
        const merged = mergeWithPending((rows ?? []).map(rowToExpense));
        const replays = replayRef.current;
        replayRef.current = [];
        applyToScope(sc.key, () => replays.reduce((items, fn) => fn(items), merged));
      } catch (error) {
        if (scopeRef.current?.key !== sc.key) return;
        setStatus('offline');
        // Avoid a toast storm while the socket keeps retrying.
        if (Date.now() - lastLoadErrorAt > 60_000) {
          lastLoadErrorAt = Date.now();
          const message = error instanceof SyncError ? error.userMessage : 'Unexpected error.';
          toast({ variant: 'destructive', title: 'Couldn’t load your latest expenses', description: `${message} Showing the copy saved on this device.` });
        }
      } finally {
        fetchingRef.current = Math.max(0, fetchingRef.current - 1);
        if (fetchingRef.current === 0) replayRef.current = [];
      }
    };

    const applyRemote = (key: string, fn: (items: Expense[]) => Expense[]) => {
      if (fetchingRef.current > 0) replayRef.current.push(fn);
      applyToScope(key, fn);
    };

    /* ── Mutations ─────────────────────────────────────────────────────── */

    const addExpense = async (expense: Expense): Promise<boolean> => {
      const sc = scopeRef.current;
      if (!sc) return false;
      const { previous, index } = snapshot(expense.id);
      applyToScope(sc.key, (items) => upsertItem(items, expense, 0)); // optimistic
      if (sc.kind === 'local') return true;

      pendingRef.current.inserts.set(expense.id, expense);
      try {
        const row = await exec<ExpenseRow>('insert', { id: expense.id }, () =>
          supabase
            .from('expenses')
            .insert({ id: expense.id, user_id: sc.userId, ledger_id: sc.ledgerId, ...expenseFields(expense) })
            .select(ROW_COLUMNS)
            .single(),
        );
        if (row) applyToScope(sc.key, (items) => upsertItem(items, rowToExpense(row)));
        return true;
      } catch (error) {
        // A retry after a lost response: the row is already there, which is success.
        if (error instanceof SyncError && error.code === '23505') {
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
      } finally {
        pendingRef.current.inserts.delete(expense.id);
      }
    };

    const updateExpense = async (expense: Expense): Promise<boolean> => {
      const sc = scopeRef.current;
      if (!sc) return false;
      const { previous, index } = snapshot(expense.id);
      applyToScope(sc.key, (items) => upsertItem(items, expense, index)); // optimistic
      if (sc.kind === 'local') return true;

      pendingRef.current.updates.set(expense.id, expense);
      try {
        const row = await exec<ExpenseRow>('update', { id: expense.id }, () =>
          supabase
            .from('expenses')
            .update(expenseFields(expense))
            .eq('id', expense.id)
            .eq('user_id', sc.userId)
            .eq('ledger_id', sc.ledgerId)
            .select(ROW_COLUMNS)
            .maybeSingle(),
        );
        // RLS filters silently: an UPDATE that matches 0 rows returns no error.
        if (!row) throw new SyncError({ op: 'update', status: 404, code: 'not-found', message: 'Update matched no rows' });
        applyToScope(sc.key, (items) => upsertItem(items, rowToExpense(row)));
        return true;
      } catch (error) {
        rollback(sc.key, expense.id, previous, index);
        notifyFailure('update', error, () => void updateExpense(expense));
        if (error instanceof SyncError && error.code === 'not-found') void syncNow(sc);
        return false;
      } finally {
        pendingRef.current.updates.delete(expense.id);
      }
    };

    const deleteExpense = async (id: string): Promise<boolean> => {
      const sc = scopeRef.current;
      if (!sc) return false;
      const { previous, index } = snapshot(id);
      applyToScope(sc.key, (items) => items.filter((i) => i.id !== id)); // optimistic
      if (sc.kind === 'local') return true;

      pendingRef.current.deletes.add(id);
      try {
        // 0 rows deleted means it was already gone (e.g. deleted on another
        // device) — the desired end state, so it's treated as success.
        await exec('delete', { id }, () =>
          supabase.from('expenses').delete().eq('id', id).eq('user_id', sc.userId).eq('ledger_id', sc.ledgerId).select('id'),
        );
        outboxRef.current = outboxRef.current.filter((e) => e.id !== id);
        return true;
      } catch (error) {
        rollback(sc.key, id, previous, index);
        notifyFailure('delete', error, () => void deleteExpense(id));
        return false;
      } finally {
        pendingRef.current.deletes.delete(id);
      }
    };

    /** Moves every expense in `from` to `to` (category rename / merge / delete). */
    const recategorize = async (from: string, to: string): Promise<boolean> => {
      const sc = scopeRef.current;
      if (!sc || from === to) return false;
      const affected = new Set(storeRef.current.items.filter((i) => i.category === from).map((i) => i.id));
      if (affected.size === 0) return true;
      applyToScope(sc.key, (items) => items.map((i) => (i.category === from ? { ...i, category: to } : i))); // optimistic
      if (sc.kind === 'local') return true;

      try {
        await exec('recategorize', { from, to, count: affected.size }, () =>
          supabase
            .from('expenses')
            .update({ category: to.slice(0, 40) })
            .eq('user_id', sc.userId)
            .eq('ledger_id', sc.ledgerId)
            .eq('category', from)
            .select('id'),
        );
        return true;
      } catch (error) {
        applyToScope(sc.key, (items) => items.map((i) => (affected.has(i.id) && i.category === to ? { ...i, category: from } : i)));
        notifyFailure('recategorize', error, () => void recategorize(from, to));
        return false;
      }
    };

    return { applyToScope, applyRemote, syncNow, addExpense, updateExpense, deleteExpense, recategorize };
  }, []);

  /* ── Cloud lifecycle: initial sync + Realtime subscription ───────────── */
  useEffect(() => {
    if (!scope) {
      setStatus('idle');
      return;
    }
    if (scope.kind === 'local') {
      // Signed-in profile without a Supabase session: changes stay in the
      // device outbox and are uploaded once a session is available.
      setStatus(isGuest ? 'local' : authResolved ? 'offline' : 'connecting');
      return;
    }

    const sc = scope;
    let cancelled = false;
    let channel: RealtimeChannel | null = null;
    let subscribedOnce = false;
    pendingRef.current = { inserts: new Map(), updates: new Map(), deletes: new Set() };
    outboxRef.current = [];
    setStatus('connecting');

    const onUpsert = (payload: { new: unknown }) => {
      const row = payload.new as Partial<ExpenseRow> | null;
      // RLS already guarantees ownership; these checks are defence in depth.
      if (!row?.id || row.user_id !== sc.userId || row.ledger_id !== sc.ledgerId) return;
      const { inserts, updates, deletes } = pendingRef.current;
      if (inserts.has(row.id) || updates.has(row.id) || deletes.has(row.id)) return; // our own request will settle it
      const expense = rowToExpense(row as ExpenseRow);
      api.applyRemote(sc.key, (items) => {
        const next = upsertItem(items, expense);
        // Ensure the list remains sorted by date when remote updates arrive
        return next.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      });
    };
    const onDelete = (payload: { old: unknown }) => {
      // With RLS on, DELETE payloads contain only the primary key.
      const id = (payload.old as { id?: string } | null)?.id;
      const { inserts, deletes } = pendingRef.current;
      if (!id || inserts.has(id) || deletes.has(id)) return; // our own request will settle it
      api.applyRemote(sc.key, (items) => (items.some((i) => i.id === id) ? items.filter((i) => i.id !== id) : items));
    };

    (async () => {
      // Make sure the socket carries the user's JWT, otherwise RLS evaluates
      // as anon and every event is silently dropped.
      try {
        await supabase.realtime.setAuth();
      } catch (error) {
        console.error(LOG, 'realtime.setAuth failed', error);
      }
      if (cancelled) return;

      channel = supabase
        .channel(`expenses:${sc.userId}:${sc.ledgerId}`)
        // INSERT/UPDATE are filtered server-side to this profile's ledger.
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'expenses', filter: `ledger_id=eq.${sc.ledgerId}` }, onUpsert)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'expenses', filter: `ledger_id=eq.${sc.ledgerId}` }, onUpsert)
        // DELETE events can't be filtered; unknown ids are simply ignored.
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'expenses' }, onDelete)
        .subscribe((state, err) => {
          if (cancelled) return;
          if (state === 'SUBSCRIBED') {
            setStatus('live');
            // After a reconnect, refetch to fill any gap of missed events.
            if (subscribedOnce) void api.syncNow(sc);
            subscribedOnce = true;
          } else if (state === 'CHANNEL_ERROR' || state === 'TIMED_OUT' || state === 'CLOSED') {
            console.error(LOG, `realtime channel ${state}`, err ?? '');
            setStatus('offline');
          }
        });
    })();

    // Initial load runs in parallel with the subscription so the ledger
    // still loads even if WebSockets are blocked on this network.
    void api.syncNow(sc);

    const onOnline = async () => {
      const queue = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]');
      if (queue.length > 0) {
        // Clear immediately before awaiting, so new inserts go into a fresh queue
        localStorage.removeItem(SYNC_QUEUE_KEY);
        for (const item of queue) {
          if (item.type === 'insert') {
             const { error } = await supabase.from('expenses').insert(item.payload);
             if (error) console.error(error);
          }
        }
      }
      void api.syncNow(sc);
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') void api.syncNow(sc);
    };
    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onVisible);
      if (channel) void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope?.key, api, authResolved]);

  return {
    expenses,
    status,
    isCloud: scope?.kind === 'cloud',
    addExpense: api.addExpense,
    updateExpense: api.updateExpense,
    deleteExpense: api.deleteExpense,
    recategorize: api.recategorize,
    refresh: () => {
      const sc = scopeRef.current;
      if (sc?.kind === 'cloud') void api.syncNow(sc);
    },
  };
}
