export const Colors = {
  // Primary Blue
  primary: '#1A73E8',
  primaryLight: '#4A9EFF',
  primaryDark: '#0D47A1',
  primaryBg: '#E8F1FD',

  // Accent Green
  accent: '#00BFA5',
  accentLight: '#64DFCE',
  accentDark: '#00897B',
  accentBg: '#E0F5F3',

  // Neutral Grays
  gray50: '#F8FAFB',
  gray100: '#F1F4F7',
  gray200: '#E2E8F0',
  gray300: '#CBD5E1',
  gray400: '#94A3B8',
  gray500: '#64748B',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1E293B',
  gray900: '#0F172A',

  // Semantic
  income: '#00BFA5',
  incomeBg: '#E0F5F3',
  expense: '#EF5350',
  expenseBg: '#FEECEC',
  savings: '#F59E0B',
  savingsBg: '#FEF3C7',

  // Surface
  white: '#FFFFFF',
  background: '#F1F4F7',
  surface: '#FFFFFF',
  surfaceAlt: '#F8FAFB',
  border: '#E2E8F0',

  // Text
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',

  // Category colors
  education: '#3B82F6',
  babysitter: '#8B5CF6',
  electricity: '#F59E0B',
  water: '#06B6D4',
  food: '#10B981',
  transportation: '#6366F1',
  health: '#EF4444',
  entertainment: '#EC4899',
  clothing: '#F97316',
  other: '#64748B',
};

export const CategoryColors: Record<string, { color: string; bg: string }> = {
  education:     { color: '#3B82F6', bg: '#EFF6FF' },
  babysitter:    { color: '#8B5CF6', bg: '#F5F3FF' },
  electricity:   { color: '#F59E0B', bg: '#FFFBEB' },
  water:         { color: '#06B6D4', bg: '#ECFEFF' },
  food:          { color: '#10B981', bg: '#ECFDF5' },
  transportation:{ color: '#6366F1', bg: '#EEF2FF' },
  health:        { color: '#EF4444', bg: '#FEF2F2' },
  entertainment: { color: '#EC4899', bg: '#FDF2F8' },
  clothing:      { color: '#F97316', bg: '#FFF7ED' },
  other:         { color: '#64748B', bg: '#F8FAFC' },
};
