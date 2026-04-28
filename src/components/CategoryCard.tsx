import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Category } from '../types';

interface Props {
  category: Category;
  amount: number;
  selected?: boolean;
  onPress?: () => void;
}

const CategoryCard: React.FC<Props> = ({ category, amount, selected, onPress }) => {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        { borderColor: selected ? category.color : 'transparent' },
        selected && { backgroundColor: category.bgColor },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[styles.iconWrap, { backgroundColor: category.bgColor }]}>
        <MaterialIcons name={category.icon as any} size={20} color={category.color} />
      </View>
      <Text style={styles.label} numberOfLines={2}>
        {category.label}
      </Text>
      {amount > 0 && (
        <Text style={[styles.amount, { color: category.color }]}>
          ${amount.toLocaleString()}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 90,
    alignItems: 'center',
    padding: 10,
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: '#fff',
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
    lineHeight: 14,
  },
  amount: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
});

export default CategoryCard;
