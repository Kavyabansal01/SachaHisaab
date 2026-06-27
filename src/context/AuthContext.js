import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { useSettings } from './SettingsContext';

const PIN_KEY = 'sacha_hisaab_pin';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { settings, saveSettings } = useSettings();
  const [initializing, setInitializing] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    let active = true;
    async function bootAuth() {
      const pin = await SecureStore.getItemAsync(PIN_KEY);
      const hardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = hardware ? await LocalAuthentication.isEnrolledAsync() : false;
      if (active) {
        setHasPin(Boolean(pin));
        setBiometricAvailable(Boolean(hardware && enrolled));
        setUnlocked(!pin && !settings.pin_enabled && !settings.biometric_enabled);
        setInitializing(false);
      }
    }
    bootAuth();
    return () => {
      active = false;
    };
  }, [settings.pin_enabled, settings.biometric_enabled]);

  async function setPin(pin) {
    await SecureStore.setItemAsync(PIN_KEY, pin);
    setHasPin(true);
    await saveSettings({ pin_enabled: 1 });
    setUnlocked(true);
  }

  async function clearPin() {
    await SecureStore.deleteItemAsync(PIN_KEY);
    setHasPin(false);
    await saveSettings({ pin_enabled: 0, biometric_enabled: 0 });
    setUnlocked(true);
  }

  async function unlockWithPin(pin) {
    const stored = await SecureStore.getItemAsync(PIN_KEY);
    const ok = stored === pin;
    setUnlocked(ok);
    return ok;
  }

  async function unlockWithBiometric() {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Sacha Hisaab',
      fallbackLabel: 'Use PIN',
    });
    setUnlocked(Boolean(result.success));
    return Boolean(result.success);
  }

  async function setBiometricEnabled(enabled) {
    await saveSettings({ biometric_enabled: enabled ? 1 : 0 });
  }

  const value = useMemo(
    () => ({
      initializing,
      unlocked,
      hasPin,
      biometricAvailable,
      setPin,
      clearPin,
      unlockWithPin,
      unlockWithBiometric,
      setBiometricEnabled,
    }),
    [initializing, unlocked, hasPin, biometricAvailable]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return value;
}
