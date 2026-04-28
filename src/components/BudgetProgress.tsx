import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

interface Props {
  label: string;
  current: number;
  max: number;
  color?: string;
  bgColor?: string;
  showPercent?: boolean;
}

const BudgetProgress: React.FC<Props> = ({
  label,
  current,
  max,
  color = Colors.primary,
  bgColor = Colors.primaryBg,
  showPercent = true,
}) => {
  const pct = max > 0 ? Math.min((current / max) * 100, 100) : 0;
  const isOver = current > max && max > 0;

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {showPercent && (
          <Text style={[styles.pct, { color: isOver ? Colors.expense : color }]}>
            {Math.round(pct)}%
          </Text>
        )}
      </View>
      <View style={[styles.track, { backgroundColor: bgColor }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${pct}%` as any,
              backgroundColor: isOver ? Colors.expense : color,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  pct: {
    fontSize: 13,
    fontWeight: '700',
  },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});

export default BudgetProgress;
