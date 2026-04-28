import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import BudgetProgress from '../components/BudgetProgress';
import {
  getCurrentMonth, formatMonth, formatCurrency,
  getMonthlyStats, getBudgetForMonth, setBudgetForMonth,
} from '../utils/storage';
import { MonthlyBudget, MonthlyStats } from '../types';

const SavingsScreen: React.FC = () => {
  const [month] = useState(getCurrentMonth());
  const [budget, setBudgetState] = useState<MonthlyBudget>({ month, income: 0, savingsGoalPercent: 20 });
  const [stats, setStats] = useState<MonthlyStats>({ totalIncome: 0, totalExpenses: 0, totalSavings: 0, byCategory: {} });
  const [goalInput, setGoalInput] = useState('20');
  const [editingGoal, setEditingGoal] = useState(false);

  const load = async () => {
    const [b, s] = await Promise.all([getBudgetForMonth(month), getMonthlyStats(month)]);
    setBudgetState(b);
    setStats(s);
    setGoalInput(String(b.savingsGoalPercent));
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const saveGoal = async () => {
    const val = parseFloat(goalInput);
    if (isNaN(val) || val < 0 || val > 100) {
      Alert.alert('Invalid value', 'Savings goal must be between 0 and 100.');
      return;
    }
    const updated: MonthlyBudget = { ...budget, savingsGoalPercent: val };
    await setBudgetForMonth(updated);
    setBudgetState(updated);
    setEditingGoal(false);
  };

  const savingsGoalAmt = (budget.income * budget.savingsGoalPercent) / 100;
  const actualSavings = Math.max(0, stats.totalIncome - stats.totalExpenses);
  const onTrack = actualSavings >= savingsGoalAmt;

  const tips = [
    { icon: 'lightbulb', text: 'Try the 50/30/20 rule: 50% needs, 30% wants, 20% savings.' },
    { icon: 'local-grocery-store', text: 'Plan meals weekly to cut food expenses by up to 30%.' },
    { icon: 'bolt', text: 'Unplug devices when not in use to reduce electricity bills.' },
    { icon: 'school', text: 'Look for free or subsidised education resources for kids.' },
  ];

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Savings</Text>
          <Text style={styles.headerSub}>{formatMonth(month)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: onTrack ? Colors.accentBg : Colors.expenseBg }]}>
          <MaterialIcons name={onTrack ? 'check-circle' : 'warning'} size={14} color={onTrack ? Colors.accent : Colors.expense} />
          <Text style={[styles.statusText, { color: onTrack ? Colors.accent : Colors.expense }]}>
            {onTrack ? 'On Track' : 'Behind Goal'}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Hero Card */}
        <View style={[styles.heroCard, { backgroundColor: onTrack ? Colors.accent : Colors.primary }]}>
          <Text style={styles.heroLabel}>Current Savings</Text>
          <Text style={styles.heroValue}>{formatCurrency(actualSavings)}</Text>
          <Text style={styles.heroSub}>
            Goal: {formatCurrency(savingsGoalAmt)} · {budget.income > 0 ? `${Math.round((actualSavings / savingsGoalAmt) * 100)}% achieved` : 'Set income first'}
          </Text>
        </View>

        {/* Savings Goal % */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Savings Goal</Text>
          <Text style={styles.cardSub}>Percentage of income to save each month</Text>

          {editingGoal ? (
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={goalInput}
                onChangeText={setGoalInput}
                keyboardType="decimal-pad"
                autoFocus
                maxLength={5}
              />
              <Text style={styles.pctSym}>%</Text>
              <TouchableOpacity style={styles.saveBtn} onPress={saveGoal}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.display} onPress={() => setEditingGoal(true)}>
              <Text style={styles.goalVal}>{budget.savingsGoalPercent}%</Text>
              <MaterialIcons name="edit" size={18} color={Colors.primary} />
            </TouchableOpacity>
          )}

          {/* Quick presets */}
          <View style={styles.presetsRow}>
            {[10, 15, 20, 25, 30].map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.preset, budget.savingsGoalPercent === p && { backgroundColor: Colors.primary }]}
                onPress={async () => {
                  const updated: MonthlyBudget = { ...budget, savingsGoalPercent: p };
                  await setBudgetForMonth(updated);
                  setBudgetState(updated);
                  setGoalInput(String(p));
                }}
              >
                <Text style={[styles.presetText, budget.savingsGoalPercent === p && { color: Colors.white }]}>{p}%</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Progress */}
        {budget.income > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Monthly Breakdown</Text>
            <View style={styles.statRow}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Income</Text>
                <Text style={[styles.statVal, { color: Colors.income }]}>{formatCurrency(stats.totalIncome)}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Expenses</Text>
                <Text style={[styles.statVal, { color: Colors.expense }]}>{formatCurrency(stats.totalExpenses)}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Saved</Text>
                <Text style={[styles.statVal, { color: Colors.savings }]}>{formatCurrency(actualSavings)}</Text>
              </View>
            </View>
            <BudgetProgress
              label="Savings vs Goal"
              current={actualSavings}
              max={savingsGoalAmt}
              color={Colors.accent}
              bgColor={Colors.accentBg}
            />
            <BudgetProgress
              label="Expenses vs Income"
              current={stats.totalExpenses}
              max={budget.income}
              color={Colors.primary}
              bgColor={Colors.primaryBg}
            />
          </View>
        )}

        {/* Tips */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💡 Saving Tips</Text>
          {tips.map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <View style={styles.tipIcon}>
                <MaterialIcons name={tip.icon as any} size={18} color={Colors.primary} />
              </View>
              <Text style={styles.tipText}>{tip.text}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.primary, paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.white },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '700' },
  scroll: { flex: 1 },
  content: { padding: 16 },
  heroCard: { borderRadius: 20, padding: 24, marginBottom: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 4 },
  heroLabel: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 0.8 },
  heroValue: { fontSize: 38, fontWeight: '900', color: Colors.white, marginTop: 6 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 6 },
  card: { backgroundColor: Colors.white, borderRadius: 18, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  cardSub: { fontSize: 12, color: Colors.textMuted, marginBottom: 14 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  input: { flex: 1, fontSize: 28, fontWeight: '800', color: Colors.textPrimary, borderBottomWidth: 2, borderBottomColor: Colors.primary, paddingBottom: 4 },
  pctSym: { fontSize: 22, fontWeight: '700', color: Colors.primary },
  saveBtn: { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  saveBtnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  display: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  goalVal: { fontSize: 32, fontWeight: '900', color: Colors.primary },
  presetsRow: { flexDirection: 'row', gap: 8 },
  preset: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: Colors.gray100 },
  presetText: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  statRow: { flexDirection: 'row', marginBottom: 16 },
  statBox: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
  statVal: { fontSize: 15, fontWeight: '800' },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  tipIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.primaryBg, alignItems: 'center', justifyContent: 'center' },
  tipText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
});

export default SavingsScreen;
