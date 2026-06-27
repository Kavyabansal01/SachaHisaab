import { Text, View, StyleSheet } from 'react-native';
import { colors, spacing } from '../theme';

export function EmptyState({ title, hint }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.title}>{title}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  hint: {
    color: colors.muted,
    fontSize: 16,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
