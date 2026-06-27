import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, globalStyles, spacing } from '../theme';
import { daysBetween, formatMoney } from '../utils/format';

export function CustomerRow({ customer, onPress }) {
  const overdue = Number(customer.outstanding || 0) > 0 && daysBetween(customer.last_entry_date || customer.created_at) >= Number(customer.reminder_days || 7);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [globalStyles.card, pressed && styles.pressed]}>
      <View style={globalStyles.between}>
        <View style={styles.nameBlock}>
          <Text style={styles.name}>{customer.name}</Text>
          <Text style={styles.phone}>{customer.phone}</Text>
        </View>
        <Text style={[styles.amount, overdue && styles.overdue]}>{formatMoney(customer.outstanding)}</Text>
      </View>
      {overdue ? <Text style={styles.badge}>Overdue</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.8,
  },
  nameBlock: {
    flex: 1,
    paddingRight: spacing.md,
  },
  name: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  phone: {
    color: colors.muted,
    fontSize: 16,
    marginTop: 4,
  },
  amount: {
    color: colors.primary,
    fontSize: 19,
    fontWeight: '900',
  },
  overdue: {
    color: colors.danger,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FDECEC',
    color: colors.danger,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
    fontWeight: '800',
  },
});
