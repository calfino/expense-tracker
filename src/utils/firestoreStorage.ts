import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, setDoc, getDoc, query, where, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Transaction, MonthlyBudget, MonthlyStats } from '../types';

// ─── Helpers (unchanged from original storage.ts) ────────────────────────────

export const getBillingMonth = (dateInput: string | Date): string => {
  let d: Date;
  if (typeof dateInput === 'string' && dateInput.includes('-')) {
    const [y, m, day] = dateInput.split('-');
    d = new Date(Number(y), Number(m) - 1, Number(day));
  } else {
    d = new Date(dateInput);
  }

  // If date is 25th or later, it belongs to the next month's cycle
  if (d.getDate() >= 25) {
    d.setMonth(d.getMonth() + 1);
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const getCurrentMonth = (): string => {
  return getBillingMonth(new Date());
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

// ─── Path helpers ─────────────────────────────────────────────────────────────

const txCol = (familyId: string) =>
  collection(db, 'families', familyId, 'transactions');

const budgetDocRef = (familyId: string, month: string) =>
  doc(db, 'families', familyId, 'budgets', month);

// ─── Transactions ─────────────────────────────────────────────────────────────

export const addTransaction = async (
  familyId: string,
  tx: Omit<Transaction, 'id'>
): Promise<Transaction> => {
  const ref = await addDoc(txCol(familyId), { ...tx, createdAt: serverTimestamp() });
  return { ...tx, id: ref.id };
};

export const updateTransaction = async (
  familyId: string,
  tx: Transaction
): Promise<void> => {
  const { id, ...data } = tx;
  await updateDoc(doc(txCol(familyId), id), data);
};

export const deleteTransaction = async (
  familyId: string,
  id: string
): Promise<void> => {
  await deleteDoc(doc(txCol(familyId), id));
};

export const getTransactionsByMonth = async (
  familyId: string,
  month: string
): Promise<Transaction[]> => {
  const q = query(txCol(familyId), where('month', '==', month));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Transaction));
};

// ─── Monthly Budget ──────────────────────────────────────────────────────────

export const getBudgetForMonth = async (
  familyId: string,
  month: string
): Promise<MonthlyBudget> => {
  const snap = await getDoc(budgetDocRef(familyId, month));
  return snap.exists()
    ? (snap.data() as MonthlyBudget)
    : { month, income: 0, savingsGoalPercent: 20 };
};

export const setBudgetForMonth = async (
  familyId: string,
  budget: MonthlyBudget
): Promise<void> => {
  await setDoc(budgetDocRef(familyId, budget.month), budget, { merge: true });
};

// ─── Stats ────────────────────────────────────────────────────────────────────

export const getMonthlyStats = async (
  familyId: string,
  month: string
): Promise<MonthlyStats> => {
  const txs = await getTransactionsByMonth(familyId, month);
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

  return {
    totalIncome,
    totalExpenses,
    totalSavings: Math.max(0, totalIncome - totalExpenses),
    byCategory,
  };
};
