export type CategoryId =
  | 'education'
  | 'babysitter'
  | 'electricity'
  | 'water'
  | 'food'
  | 'transportation'
  | 'health'
  | 'entertainment'
  | 'clothing'
  | 'other';

export interface Category {
  id: CategoryId;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
}

export type TransactionType = 'expense' | 'income';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: CategoryId;
  note: string;
  date: string; // ISO string
  month: string; // YYYY-MM
}

export interface MonthlyBudget {
  month: string; // YYYY-MM
  income: number;
  savingsGoalPercent: number; // e.g. 20 means 20%
}

export interface MonthlyStats {
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  byCategory: Record<string, number>;
}
