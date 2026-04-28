import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, MonthlyBudget, MonthlyStats } from '../types';

const TRANSACTIONS_KEY = '@family_budget_transactions';
const BUDGETS_KEY = '@family_budget_monthly_budgets';

// ─── Helpers ────────────────────────────────────────────────────────────────

export const getCurrentMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const formatMonth = (month: string): string => {
  const [year, m] = month.split('-');
  const date = new Date(Number(year), Number(m) - 1);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
};

export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

export const generateId = (): string =>
  `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// ─── Transactions ────────────────────────────────────────────────────────────

export const loadTransactions = async (): Promise<Transaction[]> => {
  const raw = await AsyncStorage.getItem(TRANSACTIONS_KEY);
  return raw ? JSON.parse(raw) : [];
};

export const saveTransactions = async (txs: Transaction[]): Promise<void> => {
  await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(txs));
};

export const addTransaction = async (tx: Omit<Transaction, 'id'>): Promise<Transaction> => {
  const all = await loadTransactions();
  const newTx: Transaction = { ...tx, id: generateId() };
  await saveTransactions([newTx, ...all]);
  return newTx;
};

export const updateTransaction = async (tx: Transaction): Promise<void> => {
  const all = await loadTransactions();
  const updated = all.map((t) => (t.id === tx.id ? tx : t));
  await saveTransactions(updated);
};

export const deleteTransaction = async (id: string): Promise<void> => {
  const all = await loadTransactions();
  await saveTransactions(all.filter((t) => t.id !== id));
};

export const getTransactionsByMonth = async (month: string): Promise<Transaction[]> => {
  const all = await loadTransactions();
  return all.filter((t) => t.month === month);
};

// ─── Monthly Budget ──────────────────────────────────────────────────────────

export const loadBudgets = async (): Promise<MonthlyBudget[]> => {
  const raw = await AsyncStorage.getItem(BUDGETS_KEY);
  return raw ? JSON.parse(raw) : [];
};

export const saveBudgets = async (budgets: MonthlyBudget[]): Promise<void> => {
  await AsyncStorage.setItem(BUDGETS_KEY, JSON.stringify(budgets));
};

export const getBudgetForMonth = async (month: string): Promise<MonthlyBudget> => {
  const all = await loadBudgets();
  return (
    all.find((b) => b.month === month) ?? {
      month,
      income: 0,
      savingsGoalPercent: 20,
    }
  );
};

export const setBudgetForMonth = async (budget: MonthlyBudget): Promise<void> => {
  const all = await loadBudgets();
  const idx = all.findIndex((b) => b.month === budget.month);
  if (idx >= 0) {
    all[idx] = budget;
  } else {
    all.push(budget);
  }
  await saveBudgets(all);
};

// ─── Stats ────────────────────────────────────────────────────────────────────

export const getMonthlyStats = async (month: string): Promise<MonthlyStats> => {
  const txs = await getTransactionsByMonth(month);
  const byCategory: Record<string, number> = {};

  let totalExpenses = 0;
  let totalIncome = 0;

  for (const tx of txs) {
    if (tx.type === 'expense') {
      totalExpenses += tx.amount;
      byCategory[tx.categoryId] = (byCategory[tx.categoryId] ?? 0) + tx.amount;
    } else {
      totalIncome += tx.amount;
    }
  }

  const budget = await getBudgetForMonth(month);
  const savingsGoal = (budget.income * budget.savingsGoalPercent) / 100;
  const totalSavings = Math.max(0, totalIncome - totalExpenses);

  return { totalIncome, totalExpenses, totalSavings, byCategory };
};
