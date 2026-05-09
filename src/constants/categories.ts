import { Category } from '../types';

export const CATEGORIES: Category[] = [
  {
    id: 'education',
    label: 'Kids Education',
    icon: 'school',
    color: '#3B82F6',
    bgColor: '#EFF6FF',
  },
  {
    id: 'babysitter',
    label: 'Babysitter',
    icon: 'child-care',
    color: '#8B5CF6',
    bgColor: '#F5F3FF',
  },
  {
    id: 'electricity',
    label: 'Electricity',
    icon: 'bolt',
    color: '#F59E0B',
    bgColor: '#FFFBEB',
  },
  {
    id: 'water',
    label: 'Water Bill',
    icon: 'water-drop',
    color: '#06B6D4',
    bgColor: '#ECFEFF',
  },
  {
    id: 'food',
    label: 'Food & Groceries',
    icon: 'restaurant',
    color: '#10B981',
    bgColor: '#ECFDF5',
  },
  {
    id: 'transportation',
    label: 'Transportation',
    icon: 'directions-car',
    color: '#6366F1',
    bgColor: '#EEF2FF',
  },
  {
    id: 'health',
    label: 'Health & Medical',
    icon: 'local-hospital',
    color: '#EF4444',
    bgColor: '#FEF2F2',
  },
  {
    id: 'entertainment',
    label: 'Entertainment',
    icon: 'theaters',
    color: '#EC4899',
    bgColor: '#FDF2F8',
  },
  {
    id: 'clothing',
    label: 'Clothing',
    icon: 'checkroom',
    color: '#F97316',
    bgColor: '#FFF7ED',
  },
  {
    id: 'laundry',
    label: 'Laundry Bill',
    icon: 'local-laundry-service',
    color: '#0EA5E9',
    bgColor: '#F0F9FF',
  },
  {
    id: 'home_supplies',
    label: 'Home & Equipment',
    icon: 'home-repair-service',
    color: '#D97706',
    bgColor: '#FEF3C7',
  },
  {
    id: 'fy_bill',
    label: 'FY Bill',
    icon: 'receipt',
    color: '#475569',
    bgColor: '#F1F5F9',
  },
  {
    id: 'jct_bill',
    label: 'JCT Bill',
    icon: 'receipt-long',
    color: '#475569',
    bgColor: '#F1F5F9',
  },
  {
    id: 'groceries_snacks',
    label: 'Groceries & Snacks',
    icon: 'shopping-cart',
    color: '#10B981',
    bgColor: '#ECFDF5',
  },
  {
    id: 'credit_card',
    label: 'Credit Card Bill',
    icon: 'credit-card',
    color: '#DC2626',
    bgColor: '#FEF2F2',
  },
  {
    id: 'other',
    label: 'Other',
    icon: 'more-horiz',
    color: '#64748B',
    bgColor: '#F8FAFC',
  },
];

export const getCategoryById = (id: string): Category =>
  CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
