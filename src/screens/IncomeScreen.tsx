import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, StatusBar,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import BudgetProgress from '../components/BudgetProgress';
import TransactionItem from '../components/TransactionItem';
import {
  getCurrentMonth, formatMonth, formatCurrency,
  getTransactionsByMonth, getBudgetForMonth, setBudgetForMonth,
  deleteTransaction,
} from '../utils/firestoreStorage';
import { useAuth } from '../context/AuthContext';
import { Transaction, MonthlyBudget } from '../types';

const IncomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { familyId } = useAuth();
  const [month] = useState(getCurrentMonth());
  const [budget, setBudgetState] = useState<MonthlyBudget>({ month, income: 0, savingsGoalPercent: 20 });
  const [incomeInput, setIncomeInput] = useState('');
  const [incomeTxs, setIncomeTxs] = useState<Transaction[]>([]);
  const [editing, setEditing] = useState(false);

  const load = async () => {
    if (!familyId) return;
    const [b, txs] = await Promise.all([
      getBudgetForMonth(familyId, month),
      getTransactionsByMonth(familyId, month),
    ]);
    setBudgetState(b);
    setIncomeInput(b.income > 0 ? String(b.income) : '');
    setIncomeTxs(txs.filter((t) => t.type === 'income'));
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const saveIncome = async () => {
    if (!familyId) return;
    const val = parseFloat(incomeInput);
    if (isNaN(val) || val < 0) { Alert.alert('Invalid amount'); return; }
    const updated: MonthlyBudget = { ...budget, income: val };
    await setBudgetForMonth(familyId, updated);
    setBudgetState(updated);
    setEditing(false);
  };

  const totalIncomeRecords = incomeTxs.reduce((s, t) => s + t.amount, 0);
  const savingsGoalAmt = (budget.income * budget.savingsGoalPercent) / 100;

  const handleDelete = async (id: string) => {
    if (!familyId) return;
    await deleteTransaction(familyId, id);
    load();
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={styles.headerTitle}>Income</Text>
          <Text style={styles.headerSub}>{formatMonth(month)}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddTransaction', { defaultType: 'income' })}>
          <MaterialIcons name="add" size={26} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Monthly Income</Text>
          <Text style={styles.cardSub}>Set your expected income for {formatMonth(month)}</Text>
          {editing ? (
            <View style={styles.inputRow}>
              <Text style={styles.currSym}>Rp</Text>
              <TextInput
                style={styles.input}
                value={incomeInput}
                onChangeText={setIncomeInput}
                keyboardType="decimal-pad"
                placeholder="0"
                autoFocus
              />
              <TouchableOpacity style={styles.saveBtn} onPress={saveIncome}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.display} onPress={() => setEditing(true)}>
              <Text style={styles.incomeVal}>{formatCurrency(budget.income)}</Text>
              <MaterialIcons name="edit" size={18} color={Colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {budget.income > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Allocation Plan</Text>
            <View style={styles.allocRow}>
              <View style={[styles.allocBox, { backgroundColor: Colors.primaryBg }]}>
                <MaterialIcons name="receipt-long" size={22} color={Colors.primary} />
                <Text style={styles.allocLabel}>Expenses</Text>
                <Text style={[styles.allocVal, { color: Colors.primary }]}>{formatCurrency(budget.income - savingsGoalAmt)}</Text>
              </View>
              <View style={[styles.allocBox, { backgroundColor: Colors.savingsBg }]}>
                <MaterialIcons name="savings" size={22} color={Colors.savings} />
                <Text style={styles.allocLabel}>Savings Goal</Text>
                <Text style={[styles.allocVal, { color: Colors.savings }]}>{formatCurrency(savingsGoalAmt)}</Text>
              </View>
            </View>
            <BudgetProgress label={`Savings Target (${budget.savingsGoalPercent}%)`} current={savingsGoalAmt} max={budget.income} color={Colors.savings} bgColor={Colors.savingsBg} />
          </View>
        )}

        <View style={styles.rowHeader}>
          <Text style={styles.cardTitle}>Income Records</Text>
          <Text style={[styles.badge, { backgroundColor: Colors.incomeBg, color: Colors.income }]}>{formatCurrency(totalIncomeRecords)}</Text>
        </View>

        {incomeTxs.length === 0 ? (
          <View style={styles.empty}>
            <MaterialIcons name="account-balance" size={52} color={Colors.gray300} />
            <Text style={styles.emptyTxt}>No income records</Text>
            <Text style={styles.emptySub}>Tap + to log an income source</Text>
          </View>
        ) : (
          incomeTxs.map((tx) => (
            <TransactionItem key={tx.id} transaction={tx} onDelete={handleDelete}
              onPress={() => navigation.navigate('AddTransaction', { transaction: tx })} />
          ))
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.primary, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.white },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  addBtn: { width: 46, height: 46, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  content: { padding: 16 },
  card: { backgroundColor: Colors.white, borderRadius: 18, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  cardSub: { fontSize: 12, color: Colors.textMuted, marginBottom: 14 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  currSym: { fontSize: 22, fontWeight: '700', color: Colors.primary },
  input: { flex: 1, fontSize: 22, fontWeight: '700', color: Colors.textPrimary, borderBottomWidth: 2, borderBottomColor: Colors.primary, paddingBottom: 4 },
  saveBtn: { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  saveBtnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  display: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  incomeVal: { fontSize: 28, fontWeight: '800', color: Colors.income },
  allocRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  allocBox: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center', gap: 6 },
  allocLabel: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary, textAlign: 'center' },
  allocVal: { fontSize: 16, fontWeight: '800', textAlign: 'center' },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, fontSize: 13, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyTxt: { fontSize: 16, fontWeight: '600', color: Colors.textSecondary, marginTop: 12 },
  emptySub: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
});

export default IncomeScreen;
