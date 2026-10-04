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
