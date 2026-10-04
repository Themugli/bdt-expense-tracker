export interface Expense {
  id: string;
  date: string;
  amount: number;
  category: string;
  note: string;
  tags: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
}

export interface Loan {
  id: string;
  type: 'payable' | 'receivable';
  amount: number;
  person_name: string;
  due_date: string | null;
  notes: string;
  status: 'pending' | 'settled';
}
