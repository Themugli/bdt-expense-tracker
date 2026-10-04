import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';
import * as auth from '@/lib/auth';
import { vi, describe, it, expect } from 'vitest';

vi.mock('@/lib/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/auth')>();
  return { ...actual, getActiveSession: vi.fn() };
});

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() })),
    removeChannel: vi.fn(),
    realtime: { setAuth: vi.fn() },
    auth: { 
      getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'test-1' } } } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      mfa: { getAuthenticatorAssuranceLevel: vi.fn().mockResolvedValue({ data: { currentLevel: 'aal2' } }) }
    }
  }
}));

describe('App State Isolation', () => {
  it('clears form state when user logs out', async () => {
    // 1. Mock an authenticated session
    vi.mocked(auth.getActiveSession).mockReturnValue({ user: { id: 'test-1', email: 'test@test.com', name: 'Test User' }, isGuest: false });
    render(<App />);

    // 2. Simulate typing into the form
    const amountInput = await screen.findByTestId('input-expense-amount');
    fireEvent.change(amountInput, { target: { value: '999' } });
    expect((amountInput as HTMLInputElement).value).toBe('999');

    // 3. Simulate Logout by clicking the Log Out button
    // First, open the user menu
    const menuButton = await screen.findByText('Test User');
    fireEvent.click(menuButton);
    
    // Then, click Log Out
    const logoutButton = await screen.findByText('Log Out');
    fireEvent.click(logoutButton);

    // Wait for the AuthLanding screen to appear, then enter Guest Mode
    const guestButton = await screen.findByText('Continue as Guest');
    fireEvent.click(guestButton);

    // 4. Form should be wiped clean to prevent state leaking to Guest Mode
    // Wait for the ledger to render and get the new input reference
    const nextAmountInput = await screen.findByTestId('input-expense-amount');
    expect((nextAmountInput as HTMLInputElement).value).toBe('');
  });
});
