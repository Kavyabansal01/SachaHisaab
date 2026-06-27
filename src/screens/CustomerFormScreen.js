import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Button } from '../components/Button';
import { FormField } from '../components/FormField';
import { useLedger } from '../context/LedgerContext';
import { useSettings } from '../context/SettingsContext';
import { globalStyles } from '../theme';

export function CustomerFormScreen({ navigation, route }) {
  const { t } = useSettings();
  const ledger = useLedger();
  const editingId = route.params?.customerId;
  const [form, setForm] = useState({
    name: '',
    phone: '',
    photo_uri: '',
    section_type: route.params?.sectionType || 'LEND',
    reminder_days: '7',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadCustomer() {
      if (editingId) {
        const customer = await ledger.getCustomer(editingId);
        if (active && customer) {
          setForm({ ...customer, reminder_days: String(customer.reminder_days || 7) });
        }
      }
    }
    loadCustomer();
    return () => {
      active = false;
    };
  }, [editingId, ledger.refreshKey]);

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save() {
    if (!form.name.trim()) {
      Alert.alert(t.appName, 'Name is required.');
      return;
    }
    if (!form.phone.trim()) {
      Alert.alert(t.appName, 'Phone number is required.');
      return;
    }
    setSaving(true);
    try {
      const id = await ledger.saveCustomer({ ...form, id: editingId });
      navigation.replace('CustomerLedger', { customerId: id });
    } catch (error) {
      const duplicate = String(error.message || '').includes('UNIQUE');
      Alert.alert(t.appName, duplicate ? 'Phone number already exists.' : 'Could not save account.');
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    Alert.alert(t.delete, 'Delete this account and all ledger data?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: t.delete,
        style: 'destructive',
        onPress: async () => {
          await ledger.deleteCustomer(editingId);
          navigation.popToTop();
        },
      },
    ]);
  }

  return (
    <KeyboardAvoidingView style={globalStyles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={globalStyles.content}>
        <FormField label={t.name} value={form.name} onChangeText={(value) => update('name', value)} />
        <FormField label={t.phone} value={form.phone} onChangeText={(value) => update('phone', value)} keyboardType="phone-pad" />
        <FormField label={t.reminderDays} value={String(form.reminder_days)} onChangeText={(value) => update('reminder_days', value)} keyboardType="number-pad" />
        <Button title={t.save} onPress={save} loading={saving} />
        {editingId ? <Button title={t.delete} onPress={remove} variant="danger" /> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
