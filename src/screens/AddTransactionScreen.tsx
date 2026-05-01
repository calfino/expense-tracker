import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, StatusBar, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { CATEGORIES } from '../constants/categories';
import { addTransaction, updateTransaction } from '../utils/firestoreStorage';
import { useAuth } from '../context/AuthContext';
import { Transaction, CategoryId } from '../types';

type RouteParams = {
  transaction?: Transaction;
  defaultType?: 'income' | 'expense';
};

const AddTransactionScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { familyId } = useAuth();
  const route = useRoute();
  const { transaction, defaultType } = (route.params as RouteParams) ?? {};

  const isEditing = !!transaction;

  const [type, setType] = useState<'income' | 'expense'>(
    transaction?.type ?? defaultType ?? 'expense',
  );
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : '');
  const [categoryId, setCategoryId] = useState<CategoryId>(
    transaction?.categoryId ?? 'food',
  );
  const [note, setNote] = useState(transaction?.note ?? '');
  const [date, setDate] = useState(transaction?.date ?? new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0.');
      return;
    }

    setSaving(true);
    const month = date.substring(0, 7); // Extract YYYY-MM from YYYY-MM-DD

    try {
      if (!familyId) throw new Error('No family linked to account.');
      if (isEditing && transaction) {
        await updateTransaction(familyId, {
          ...transaction,
          type,
          amount: parsed,
          categoryId: type === 'expense' ? categoryId : 'other',
          note: note.trim(),
          date,
          month,
        });
      } else {
        await addTransaction(familyId, {
          type,
          amount: parsed,
          categoryId: type === 'expense' ? categoryId : 'other',
          note: note.trim(),
          date,
          month,
        });
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Failed to save transaction. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const accentColor = type === 'income' ? Colors.income : Colors.expense;
  const accentBg = type === 'income' ? Colors.incomeBg : Colors.expenseBg;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.screen}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEditing ? 'Edit Transaction' : 'Add Transaction'}</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveHeaderBtn} disabled={saving}>
            <Text style={styles.saveHeaderText}>{saving ? 'Saving…' : 'Save'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Type Toggle */}
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[styles.typeBtn, type === 'expense' && { backgroundColor: Colors.expense }]}
              onPress={() => setType('expense')}
            >
              <MaterialIcons name="arrow-upward" size={18} color={type === 'expense' ? Colors.white : Colors.textSecondary} />
              <Text style={[styles.typeBtnText, type === 'expense' && { color: Colors.white }]}>Expense</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeBtn, type === 'income' && { backgroundColor: Colors.income }]}
              onPress={() => setType('income')}
            >
              <MaterialIcons name="arrow-downward" size={18} color={type === 'income' ? Colors.white : Colors.textSecondary} />
              <Text style={[styles.typeBtnText, type === 'income' && { color: Colors.white }]}>Income</Text>
            </TouchableOpacity>
          </View>

          {/* Amount */}
          <View style={[styles.amountCard, { borderTopColor: accentColor }]}>
            <Text style={styles.fieldLabel}>Amount</Text>
            <View style={styles.amountRow}>
              <Text style={[styles.currSign, { color: accentColor }]}>Rp</Text>
              <TextInput
                style={[styles.amountInput, { color: accentColor }]}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={Colors.gray300}
                autoFocus={!isEditing}
              />
            </View>
          </View>

          {/* Category (expenses only) */}
          {type === 'expense' && (
            <View style={styles.card}>
              <Text style={styles.fieldLabel}>Category</Text>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map((cat) => {
                  const selected = categoryId === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.catChip,
                        { borderColor: cat.color },
                        selected && { backgroundColor: cat.color },
                      ]}
                      onPress={() => setCategoryId(cat.id)}
                    >
                      <MaterialIcons
                        name={cat.icon as any}
                        size={16}
                        color={selected ? Colors.white : cat.color}
                      />
                      <Text style={[styles.catChipText, { color: selected ? Colors.white : cat.color }]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Note */}
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Note (optional)</Text>
            <TextInput
              style={styles.noteInput}
              value={note}
              onChangeText={setNote}
              placeholder="e.g. Grocery run at Walmart"
              placeholderTextColor={Colors.gray300}
              multiline
              maxLength={200}
            />
          </View>

          {/* Date */}
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Date</Text>
            <TextInput
              style={styles.dateInput}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.gray300}
              keyboardType="numbers-and-punctuation"
              maxLength={10}
            />
            <Text style={styles.dateHint}>Format: YYYY-MM-DD (e.g. {new Date().toISOString().split('T')[0]})</Text>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: accentColor }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            <MaterialIcons name={isEditing ? 'check' : 'add'} size={20} color={Colors.white} />
            <Text style={styles.saveBtnText}>{saving ? 'Saving…' : isEditing ? 'Update Transaction' : 'Add Transaction'}</Text>
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary,
    paddingBottom: 16, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.white, flex: 1, textAlign: 'center', marginHorizontal: 8 },
  saveHeaderBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10 },
  saveHeaderText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  scroll: { flex: 1 },
  content: { padding: 16 },
  typeRow: {
    flexDirection: 'row', backgroundColor: Colors.white, borderRadius: 16, padding: 4,
    marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  typeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: 12, gap: 6,
  },
  typeBtnText: { fontSize: 15, fontWeight: '700', color: Colors.textSecondary },
  amountCard: {
    backgroundColor: Colors.white, borderRadius: 18, padding: 20,
    marginBottom: 16, borderTopWidth: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  amountRow: { flexDirection: 'row', alignItems: 'center' },
  currSign: { fontSize: 24, fontWeight: '800', marginRight: 6 },
  amountInput: { flex: 1, fontSize: 38, fontWeight: '900' },
  card: {
    backgroundColor: Colors.white, borderRadius: 18, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5, backgroundColor: Colors.white,
  },
  catChipText: { fontSize: 12, fontWeight: '700' },
  noteInput: {
    fontSize: 15, color: Colors.textPrimary,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    paddingVertical: 8, minHeight: 48,
  },
  dateInput: {
    fontSize: 16, color: Colors.textPrimary,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    paddingVertical: 8,
  },
  dateHint: { fontSize: 11, color: Colors.textMuted, marginTop: 6 },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 18, borderRadius: 18, gap: 8,
    marginTop: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 5,
  },
  saveBtnText: { fontSize: 17, fontWeight: '800', color: Colors.white },
});

export default AddTransactionScreen;
