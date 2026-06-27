import { ActivityIndicator, Pressable, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../theme';

export function Button({ title, onPress, variant = 'primary', disabled = false, loading = false }) {
  const backgroundColor =
    variant === 'danger' ? colors.danger : variant === 'secondary' ? colors.card : colors.primary;
  const textColor = variant === 'secondary' ? colors.primary : colors.card;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor, borderColor: variant === 'secondary' ? colors.primary : backgroundColor },
        (pressed || disabled) && styles.dimmed,
      ]}
    >
      {loading ? <ActivityIndicator color={textColor} /> : <Text style={[styles.text, { color: textColor }]}>{title}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 56,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    marginVertical: spacing.xs,
  },
  text: {
    fontSize: 18,
    fontWeight: '800',
  },
  dimmed: {
    opacity: 0.72,
  },
});
