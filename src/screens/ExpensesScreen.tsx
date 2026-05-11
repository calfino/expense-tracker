import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { CATEGORIES } from '../constants/categories';
import TransactionItem from '../components/TransactionItem';
import {
  getCurrentMonth, formatMonth, formatCurrency,
  getTransactionsByMonth, deleteTransaction,
} from '../utils/firestoreStorage';
import { useAuth } from '../context/AuthContext';
import { Transaction, CategoryId } from '../types';

type SortKey = 'date' | 'amount' | 'name';
type SortDir = 'asc' | 'desc';

const SORT_OPTIONS: { key: SortKey; label: string; iconAsc: string; iconDesc: string }[] = [
  { key: 'date',   label: 'Date',   iconAsc: 'arrow-upward',   iconDesc: 'arrow-downward' },
  { key: 'amount', label: 'Amount', iconAsc: 'arrow-upward',   iconDesc: 'arrow-downward' },
  { key: 'name',   label: 'Name',   iconAsc: 'arrow-upward',   iconDesc: 'arrow-downward' },
];

const sortTransactions = (list: Transaction[], key: SortKey, dir: SortDir): Transaction[] => {
  return [...list].sort((a, b) => {
    let cmp = 0;
    if (key === 'date')   cmp = a.date.localeCompare(b.date);
    if (key === 'amount') cmp = a.amount - b.amount;
    if (key === 'name')   cmp = a.note.toLowerCase().localeCompare(b.note.toLowerCase());
    return dir === 'asc' ? cmp : -cmp;
  });
};

const ExpensesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { familyId, billingCycleStartDay, customCategories } = useAuth();
  const [month, setMonth] = useState(getCurrentMonth(billingCycleStartDay));
  const allCategories = [...CATEGORIES, ...(customCategories || [])];
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterCat, setFilterCat] = useState<CategoryId | 'all'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const load = async () => {
    if (!familyId) return;
    const txs = await getTransactionsByMonth(familyId, month);
    setTransactions(txs.filter((t) => t.type === 'expense'));
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const handleDelete = async (id: string) => {
    if (!familyId) return;
    await deleteTransaction(familyId, id);
    load();
  };

  const handleSortPress = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const filtered = filterCat === 'all'
    ? transactions
    : transactions.filter((t) => t.categoryId === filterCat);

  const sorted = sortTransactions(filtered, sortKey, sortDir);

  const total = filtered.reduce((s, t) => s + t.amount, 0);
  const usedCats = Array.from(new Set(transactions.map((t) => t.categoryId)));

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={styles.headerTitle}>Expenses</Text>
          <Text style={styles.headerSub}>{formatMonth(month)}</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddTransaction', { defaultType: 'expense' })}
        >
          <MaterialIcons name="add" size={26} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Total Banner */}
      <View style={styles.banner}>
        <Text style={styles.bannerLabel}>Total Expenses</Text>
        <Text style={styles.bannerValue}>{formatCurrency(total)}</Text>
      </View>

      {/* Category Filter */}
      <View style={styles.filterWrap}>
        <FlatList
          data={[{ id: 'all', label: 'All' }, ...allCategories.filter((c) => usedCats.includes(c.id))] as any[]}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.chip, filterCat === item.id && { backgroundColor: Colors.primary }]}
              onPress={() => setFilterCat(item.id)}
            >
              <Text style={[styles.chipText, filterCat === item.id && { color: Colors.white }]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Sort Toolbar */}
      <View style={styles.sortBar}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        {SORT_OPTIONS.map((opt) => {
          const active = sortKey === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              style={[styles.sortChip, active && styles.sortChipActive]}
              onPress={() => handleSortPress(opt.key)}
            >
              <Text style={[styles.sortChipText, active && styles.sortChipTextActive]}>
                {opt.label}
              </Text>
              {active && (
                <MaterialIcons
                  name={sortDir === 'asc' ? 'arrow-upward' : 'arrow-downward'}
                  size={13}
                  color={Colors.white}
                  style={{ marginLeft: 3 }}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* List */}
      {sorted.length === 0 ? (
        <View style={styles.emptyWrap}>
          <MaterialIcons name="receipt-long" size={56} color={Colors.gray300} />
          <Text style={styles.emptyText}>No expenses found</Text>
          <Text style={styles.emptySubtext}>Tap + to record an expense</Text>
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TransactionItem
              transaction={item}
              onPress={() => navigation.navigate('AddTransaction', { transaction: item })}
              onDelete={handleDelete}
            />
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary,
    paddingBottom: 16, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    zIndex: 10, position: 'relative',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.white },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  addBtn: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  banner: {
    backgroundColor: Colors.expenseBg,
    paddingVertical: 14, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  bannerLabel: { fontSize: 12, color: Colors.expense, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  bannerValue: { fontSize: 26, fontWeight: '800', color: Colors.expense, marginTop: 2 },
  filterWrap: { backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  chip: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, backgroundColor: Colors.gray100,
    marginRight: 8,
  },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  // Sort bar
  sortBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  sortLabel: { fontSize: 12, fontWeight: '600', color: Colors.textMuted, marginRight: 2 },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: Colors.gray100,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sortChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  sortChipText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  sortChipTextActive: { color: Colors.white },
  // List
  list: { padding: 16 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60 },
  emptyText: { fontSize: 16, fontWeight: '600', color: Colors.textSecondary, marginTop: 16 },
  emptySubtext: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
});

export default ExpensesScreen;
