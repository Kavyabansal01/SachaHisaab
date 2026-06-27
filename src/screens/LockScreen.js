import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { FormField } from '../components/FormField';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { colors, globalStyles, spacing } from '../theme';

export function LockScreen() {
  const { t } = useSettings();
  const { hasPin, setPin, unlockWithPin, unlockWithBiometric, biometricAvailable } = useAuth();
  const [pin, setPinValue] = useState('');
  const [busy, setBusy] = useState(false);

  async function submitPin() {
    if (pin.length < 4) {
      Alert.alert(t.appName, 'PIN must be at least 4 digits.');
      return;
    }
    setBusy(true);
    const ok = hasPin ? await unlockWithPin(pin) : await setPin(pin);
    setBusy(false);
    if (hasPin && !ok) {
      Alert.alert(t.appName, 'Wrong PIN.');
    }
  }

  async function submitBiometric() {
    setBusy(true);
    const ok = await unlockWithBiometric();
    setBusy(false);
    if (!ok) {
      Alert.alert(t.appName, 'Fingerprint failed.');
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={globalStyles.centered}>
      <View style={{ width: '100%', padding: spacing.lg }}>
        <Text style={[globalStyles.title, { color: colors.primary, textAlign: 'center' }]}>{t.appName}</Text>
        <Text style={[globalStyles.subtitle, { textAlign: 'center', marginBottom: spacing.xl }]}>{t.tagline}</Text>
        <FormField label={hasPin ? t.enterPin : t.setPin} value={pin} onChangeText={setPinValue} keyboardType="number-pad" />
        <Button title={hasPin ? t.unlock : t.setPin} onPress={submitPin} loading={busy} />
        {hasPin && biometricAvailable ? <Button title={t.useBiometric} onPress={submitBiometric} variant="secondary" loading={busy} /> : null}
      </View>
    </KeyboardAvoidingView>
  );
}
