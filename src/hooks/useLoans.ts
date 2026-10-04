import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/useToast';
import { newExpenseId as newLoanId } from '@/hooks/useExpenses';
import type { Loan } from '@/types';

export function useLoans() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLoans = useCallback(async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) {
        setLoans([]);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('loans')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLoans(data as Loan[]);
    } catch (err) {
      console.error('Failed to fetch loans:', err);
      toast({ variant: 'destructive', title: 'Could not load loans', description: 'Failed to connect to the server.' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  const addLoan = async (loan: Omit<Loan, 'id'>) => {
    const newLoan = { ...loan, id: newLoanId() } as Loan;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) return false;

      const { error } = await supabase.from('loans').insert({
        ...newLoan,
        user_id: userId,
      });

      if (error) throw error;
      setLoans((prev) => [newLoan, ...prev]);
      return true;
    } catch (err) {
      console.error('Failed to add loan:', err);
      toast({ variant: 'destructive', title: 'Failed to save', description: 'Could not save this loan.' });
      return false;
    }
  };

  const updateLoan = async (updated: Loan) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) return false;

      const { error } = await supabase
        .from('loans')
        .update({
          type: updated.type,
          amount: updated.amount,
          person_name: updated.person_name,
          due_date: updated.due_date,
          notes: updated.notes,
          status: updated.status,
        })
        .eq('id', updated.id)
        .eq('user_id', userId);

      if (error) throw error;
      setLoans((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      return true;
    } catch (err) {
      console.error('Failed to update loan:', err);
      toast({ variant: 'destructive', title: 'Failed to update', description: 'Could not update this loan.' });
      return false;
    }
  };

  const deleteLoan = async (id: string) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) return false;

      const { error } = await supabase
        .from('loans')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
      setLoans((prev) => prev.filter((l) => l.id !== id));
      return true;
    } catch (err) {
      console.error('Failed to delete loan:', err);
      toast({ variant: 'destructive', title: 'Failed to delete', description: 'Could not delete this loan.' });
      return false;
    }
  };

  return { loans, isLoading, addLoan, updateLoan, deleteLoan, refresh: fetchLoans };
}
