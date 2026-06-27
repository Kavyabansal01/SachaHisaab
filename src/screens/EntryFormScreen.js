import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Button } from '../components/Button';
import { FormField } from '../components/FormField';
import { useLedger } from '../context/LedgerContext';
import { useSettings } from '../context/SettingsContext';
import { globalStyles } from '../theme';
import { nowIso } from '../utils/format';

export function EntryFormScreen({ navigation, route }) {
  const { t } = useSettings();
  const ledger = useLedger();
  const [form, setForm] = useState({
    amount: '',
    date: nowIso().slice(0, 10),
    note: '',
  });
  const [saving, setSaving] = useState(false);

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save() {
    const amount = Number(form.amount);
    if (!amount || amount <= 0) {
      Alert.alert(t.appName, 'Enter a valid amount.');
      return;
    }
    setSaving(true);
    await ledger.saveEntry({
      customer_id: route.params.customerId,
      type: route.params.sectionType,
      amount,
      date: form.date,
      note: form.note,
    });
    setSaving(false);
    navigation.goBack();
  }

  return (
    <KeyboardAvoidingView style={globalStyles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={globalStyles.content}>
        <FormField label={t.amount} value={form.amount} onChangeText={(value) => update('amount', value)} keyboardType="numeric" />
        <FormField label={t.date} value={form.date} onChangeText={(value) => update('date', value)} />
        <FormField label={t.note} value={form.note} onChangeText={(value) => update('note', value)} multiline />
        <Button title={t.save} onPress={save} loading={saving} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
