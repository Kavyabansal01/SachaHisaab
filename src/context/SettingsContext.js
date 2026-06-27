import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { translations } from '../i18n';
import { loadSettings, updateSettings } from '../data/database';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({
    language: 'en',
    pin_enabled: 0,
    biometric_enabled: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function boot() {
      const stored = await loadSettings();
      if (active && stored) {
        setSettings(stored);
      }
      if (active) {
        setLoading(false);
      }
    }
    boot();
    return () => {
      active = false;
    };
  }, []);

  async function saveSettings(values) {
    const next = await updateSettings(values);
    setSettings(next);
    return next;
  }

  const value = useMemo(
    () => ({
      settings,
      loading,
      t: translations[settings.language] || translations.en,
      saveSettings,
    }),
    [settings, loading]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const value = useContext(SettingsContext);
  if (!value) {
    throw new Error('useSettings must be used inside SettingsProvider');
  }
  return value;
}
