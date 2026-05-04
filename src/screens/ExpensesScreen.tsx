import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, StatusBar,
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

const ExpensesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { familyId, billingCycleStartDay, customCategories } = useAuth();
  const [month, setMonth] = useState(getCurrentMonth(billingCycleStartDay));
  const allCategories = [...CATEGORIES, ...(customCategories || [])];
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterCat, setFilterCat] = useState<CategoryId | 'all'>('all');

  const load = async () => {
    if (!familyId) return;
    const txs = await getTransactionsByMonth(familyId, month);
    setTransactions(txs.filter((t) => t.type === 'expense'));
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const handleDelete = (id: string) => {
    Alert.alert('Delete Transaction', 'Are you sure you want to delete this entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          if (!familyId) return;
          await deleteTransaction(familyId, id);
          load();
        },
      },
    ]);
  };

  const filtered = filterCat === 'all'
    ? transactions
    : transactions.filter((t) => t.categoryId === filterCat);

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

      {/* List */}
      {filtered.length === 0 ? (
        <View style={styles.emptyWrap}>
          <MaterialIcons name="receipt-long" size={56} color={Colors.gray300} />
          <Text style={styles.emptyText}>No expenses found</Text>
          <Text style={styles.emptySubtext}>Tap + to record an expense</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
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
  list: { padding: 16 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60 },
  emptyText: { fontSize: 16, fontWeight: '600', color: Colors.textSecondary, marginTop: 16 },
  emptySubtext: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
});

export default ExpensesScreen;
