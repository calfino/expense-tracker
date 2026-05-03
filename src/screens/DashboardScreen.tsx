import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, StatusBar, Alert, Platform,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { CATEGORIES } from '../constants/categories';
import SummaryCard from '../components/SummaryCard';
import BudgetProgress from '../components/BudgetProgress';
import TransactionItem from '../components/TransactionItem';
import {
  getCurrentMonth, formatMonth, formatCurrency,
  getMonthlyStats, getTransactionsByMonth, getBudgetForMonth,
  deleteTransaction,
} from '../utils/firestoreStorage';
import { useAuth } from '../context/AuthContext';
import { MonthlyStats, Transaction, MonthlyBudget } from '../types';

const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { familyId, familyName, logout } = useAuth();
  const [month] = useState(getCurrentMonth());
  const [stats, setStats] = useState<MonthlyStats>({ totalIncome: 0, totalExpenses: 0, totalSavings: 0, byCategory: {} });
  const [recentTxs, setRecentTxs] = useState<Transaction[]>([]);
  const [budget, setBudget] = useState<MonthlyBudget>({ month, income: 0, savingsGoalPercent: 20 });
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!familyId) return;
    const [s, txs, b] = await Promise.all([
      getMonthlyStats(familyId, month),
      getTransactionsByMonth(familyId, month),
      getBudgetForMonth(familyId, month),
    ]);
    setStats(s);
    setRecentTxs(txs.slice(0, 5));
    setBudget(b);
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const savingsGoalAmt = (budget.income * budget.savingsGoalPercent) / 100;
  const spendingLimit = budget.income - savingsGoalAmt;

  const handleDelete = async (id: string) => {
    if (!familyId) return;
    await deleteTransaction(familyId, id);
    load();
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      // Alert.alert callbacks don't fire on web — use native confirm
      if ((window as any).confirm('Are you sure you want to sign out?')) {
        logout();
      }
    } else {
      Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{familyName ?? 'Family Budget'}</Text>
          <Text style={styles.headerSub}>{formatMonth(month)}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddTransaction')}>
          <MaterialIcons name="add" size={24} color={Colors.white} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.addBtn, { marginLeft: 8, backgroundColor: 'rgba(255,255,255,0.15)' }]} onPress={handleLogout}>
          <MaterialIcons name="logout" size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Overview Cards */}
        <View style={styles.cardsRow}>
          <View style={[styles.bigCard, { backgroundColor: Colors.primary }]}>
            <Text style={styles.bigCardLabel}>Total Income</Text>
            <Text style={styles.bigCardValue}>{formatCurrency(stats.totalIncome)}</Text>
            <MaterialIcons name="trending-up" size={24} color="rgba(255,255,255,0.6)" style={styles.bigCardIcon} />
          </View>
          <View style={[styles.bigCard, { backgroundColor: Colors.accent }]}>
            <Text style={styles.bigCardLabel}>Remaining</Text>
            <Text style={styles.bigCardValue}>{formatCurrency(Math.max(0, stats.totalIncome - stats.totalExpenses))}</Text>
            <MaterialIcons name="account-balance-wallet" size={24} color="rgba(255,255,255,0.6)" style={styles.bigCardIcon} />
          </View>
        </View>

        {/* Summary */}
        <View style={styles.section}>
          <SummaryCard
            title="Total Expenses"
            value={formatCurrency(stats.totalExpenses)}
            subtitle={budget.income > 0 ? `${Math.round((stats.totalExpenses / budget.income) * 100)}% of income` : 'Set income to track'}
            color={Colors.expense}
            bgColor={Colors.expenseBg}
            icon={<MaterialIcons name="receipt-long" size={22} color={Colors.expense} />}
          />
          <SummaryCard
            title="Current Savings"
            value={formatCurrency(stats.totalSavings)}
            subtitle={`Goal: ${formatCurrency(savingsGoalAmt)} (${budget.savingsGoalPercent}%)`}
            color={Colors.savings}
            bgColor={Colors.savingsBg}
            icon={<MaterialIcons name="savings" size={22} color={Colors.savings} />}
          />
        </View>

        {/* Budget Progress */}
        {budget.income > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Budget Overview</Text>
            <BudgetProgress
              label="Expenses vs Income"
              current={stats.totalExpenses}
              max={spendingLimit}
              color={Colors.primary}
              bgColor={Colors.primaryBg}
            />
            <BudgetProgress
              label="Savings Goal"
              current={stats.totalSavings}
              max={savingsGoalAmt}
              color={Colors.accent}
              bgColor={Colors.accentBg}
            />
          </View>
        )}

        {/* Category Breakdown */}
        {Object.keys(stats.byCategory).length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Spending by Category</Text>
            {CATEGORIES.filter((c) => stats.byCategory[c.id] > 0).map((cat) => (
              <View key={cat.id} style={styles.catRow}>
                <View style={[styles.catDot, { backgroundColor: cat.color }]} />
                <Text style={styles.catLabel}>{cat.label}</Text>
                <Text style={[styles.catAmount, { color: cat.color }]}>
                  {formatCurrency(stats.byCategory[cat.id])}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Recent Transactions */}
        <View style={styles.recentHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Expenses')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {recentTxs.length === 0 ? (
          <View style={styles.emptyWrap}>
            <MaterialIcons name="receipt" size={48} color={Colors.gray300} />
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySubtext}>Tap + to add your first entry</Text>
          </View>
        ) : (
          recentTxs.map((tx) => (
            <TransactionItem
              key={tx.id}
              transaction={tx}
              onPress={() => navigation.navigate('AddTransaction', { transaction: tx })}
              onDelete={handleDelete}
            />
          ))
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
    position: 'relative',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.white },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  addBtn: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  cardsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  bigCard: {
    flex: 1, borderRadius: 18, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 4,
    overflow: 'hidden',
  },
  bigCardLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 0.5 },
  bigCardValue: { fontSize: 20, fontWeight: '800', color: Colors.white, marginTop: 6 },
  bigCardIcon: { position: 'absolute', right: 14, bottom: 14 },
  section: { marginBottom: 4 },
  card: {
    backgroundColor: Colors.white, borderRadius: 18, padding: 16,
    marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 14 },
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  seeAll: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  catRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  catDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  catLabel: { flex: 1, fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  catAmount: { fontSize: 13, fontWeight: '700' },
  emptyWrap: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 16, fontWeight: '600', color: Colors.textSecondary, marginTop: 12 },
  emptySubtext: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
});

export default DashboardScreen;
