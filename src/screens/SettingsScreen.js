import { Alert, ScrollView, Switch, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { colors, globalStyles, spacing } from '../theme';

export function SettingsScreen() {
  const { t, settings, saveSettings } = useSettings();
  const { clearPin, hasPin, biometricAvailable, setBiometricEnabled } = useAuth();

  async function toggleLanguage() {
    await saveSettings({ language: settings.language === 'en' ? 'hi' : 'en' });
  }

  async function toggleBiometric(value) {
    if (value && !biometricAvailable) {
      Alert.alert(t.appName, 'No enrolled fingerprint found on this device.');
      return;
    }
    await setBiometricEnabled(value);
  }

  return (
    <ScrollView style={globalStyles.screen} contentContainerStyle={globalStyles.content}>
      <Text style={globalStyles.title}>{t.settings}</Text>
      <View style={globalStyles.card}>
        <View style={globalStyles.between}>
          <View>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '900' }}>{t.language}</Text>
            <Text style={globalStyles.subtitle}>{settings.language === 'en' ? 'English' : 'हिन्दी'}</Text>
          </View>
          <Button title={settings.language === 'en' ? 'हिन्दी' : 'English'} onPress={toggleLanguage} variant="secondary" />
        </View>
      </View>
      <View style={globalStyles.card}>
        <View style={globalStyles.between}>
          <View style={{ flex: 1, paddingRight: spacing.md }}>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '900' }}>{t.biometricEnabled}</Text>
            <Text style={globalStyles.subtitle}>{biometricAvailable ? 'Available' : 'Unavailable'}</Text>
          </View>
          <Switch value={Boolean(settings.biometric_enabled)} onValueChange={toggleBiometric} thumbColor={settings.biometric_enabled ? colors.primary : colors.card} />
        </View>
      </View>
      <View style={globalStyles.card}>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: '900' }}>{t.pinEnabled}</Text>
        <Text style={globalStyles.subtitle}>{hasPin ? 'PIN is active on app launch.' : 'Set a PIN from the lock screen after clearing.'}</Text>
        {hasPin ? <Button title="Clear PIN" onPress={clearPin} variant="danger" /> : null}
      </View>
      <View style={globalStyles.card}>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: '900' }}>{t.backup}</Text>
        <Text style={globalStyles.subtitle}>{t.backupHint}</Text>
      </View>
    </ScrollView>
  );
}
