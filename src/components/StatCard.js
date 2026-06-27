import { Text, View, StyleSheet } from 'react-native';
import { colors, globalStyles, spacing } from '../theme';

export function StatCard({ label, value, tone = 'default' }) {
  const color = tone === 'danger' ? colors.danger : tone === 'success' ? colors.success : colors.primary;
  return (
    <View style={[globalStyles.card, styles.card]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  label: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '700',
  },
  value: {
    marginTop: spacing.sm,
    fontSize: 24,
    fontWeight: '900',
  },
});
