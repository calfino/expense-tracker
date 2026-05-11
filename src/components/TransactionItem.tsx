import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Transaction } from '../types';
import { getCategoryById } from '../constants/categories';
import { Colors } from '../constants/colors';
import { formatCurrency } from '../utils/storage';
import CustomModal from './CustomModal';

interface Props {
  transaction: Transaction;
  onPress?: (tx: Transaction) => void;
  onDelete?: (id: string) => void;
}

const TransactionItem: React.FC<Props> = ({ transaction, onPress, onDelete }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const category = getCategoryById(transaction.categoryId);
  const isExpense = transaction.type === 'expense';
  const date = new Date(transaction.date);
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <>
      <TouchableOpacity
        style={styles.container}
        onPress={() => onPress?.(transaction)}
        activeOpacity={0.75}
      >
        {/* Icon */}
        <View style={[styles.iconWrap, { backgroundColor: category.bgColor }]}>
          <MaterialIcons name={category.icon as any} size={22} color={category.color} />
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.description} numberOfLines={1}>
            {transaction.note || category.label}
          </Text>
          <Text style={styles.meta}>
            {category.label} · {formattedDate}
          </Text>
        </View>

        {/* Amount */}
        <View style={styles.amountWrap}>
          <Text style={[styles.amount, { color: isExpense ? Colors.expense : Colors.income }]}>
            {isExpense ? '-' : '+'}
            {formatCurrency(transaction.amount)}
          </Text>
          {onDelete && (
            <Pressable
              onPress={(e) => { e.stopPropagation?.(); setShowConfirm(true); }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.deleteBtn}
            >
              <MaterialIcons name="delete-outline" size={20} color={Colors.expense} />
            </Pressable>
          )}
        </View>
      </TouchableOpacity>

      <CustomModal
        visible={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Delete Transaction"
        message={`Are you sure you want to delete "${transaction.note || category.label}"? This action cannot be undone.`}
        icon="delete-outline"
        iconColor={Colors.expense}
        primaryButtonText="Delete"
        secondaryButtonText="Cancel"
        onPrimaryPress={() => {
          setShowConfirm(false);
          onDelete?.(transaction.id);
        }}
        onSecondaryPress={() => setShowConfirm(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  info: { flex: 1 },
  description: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  meta: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  amountWrap: {
    alignItems: 'flex-end',
    gap: 4,
  },
  amount: {
    fontSize: 15,
    fontWeight: '700',
  },
  deleteBtn: {
    padding: 4,
  },
});

export default TransactionItem;
