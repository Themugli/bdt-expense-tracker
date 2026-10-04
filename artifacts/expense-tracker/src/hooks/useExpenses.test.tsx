import { renderHook, act } from '@testing-library/react';
import { useExpenses } from './useExpenses';
import { vi, describe, it, expect } from 'vitest';

// Mock Supabase to simulate network failure
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockRejectedValue(new Error('Network error'))
        }))
      }))
    })),
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() })),
    removeChannel: vi.fn(),
    realtime: { setAuth: vi.fn() },
    auth: { 
      getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'test-user-id' } } } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } })
    }
  }
}));

describe('useExpenses', () => {
  it('optimistically adds an expense and rolls back on API failure', async () => {
    const { result } = renderHook(() => useExpenses({ ledgerId: 'test-ledger', isGuest: false }));
    
    // Wait for the internal useEffect to set the scope
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // 1. Initial State
    expect(result.current.expenses).toEqual([]);

    // 2. Add Expense Optimistically
    const newExpense = { id: '123', amount: 500, category: 'Food', date: '2026-10-03', note: '', tags: [] };
    
    let promise: Promise<unknown> | undefined;
    act(() => {
      promise = result.current.addExpense(newExpense);
    });

    // It should be immediately available in the UI
    expect(result.current.expenses.length).toBe(1);
    expect(result.current.expenses[0].id).toBe('123');

    // 3. Wait for the API failure to resolve
    await act(async () => {
      await promise;
    });

    // 4. Assert Rollback occurred
    expect(result.current.expenses.length).toBe(0);
  });
});
