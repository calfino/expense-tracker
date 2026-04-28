import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

interface Props {
  title: string;
  value: string;
  subtitle?: string;
  color?: string;
  bgColor?: string;
  icon?: React.ReactNode;
}

const SummaryCard: React.FC<Props> = ({
  title,
  value,
  subtitle,
  color = Colors.primary,
  bgColor = Colors.primaryBg,
  icon,
}) => {
  return (
    <View style={[styles.card, { backgroundColor: bgColor, borderLeftColor: color }]}>
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={styles.title}>{title}</Text>
          <Text style={[styles.value, { color }]}>{value}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {icon ? (
          <View style={[styles.iconWrap, { backgroundColor: color + '22' }]}>{icon}</View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  info: { flex: 1 },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  value: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
});

export default SummaryCard;
