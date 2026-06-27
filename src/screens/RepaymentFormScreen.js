import { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Switch, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { FormField } from '../components/FormField';
import { useLedger } from '../context/LedgerContext';
import { useSettings } from '../context/SettingsContext';
import { colors, globalStyles, spacing } from '../theme';
import { formatMoney, nowIso } from '../utils/format';

export function RepaymentFormScreen({ navigation, route }) {
  const { t } = useSettings();
  const ledger = useLedger();
  const customerId = route.params.customerId;
  const [entries, setEntries] = useState([]);
  const [manual, setManual] = useState(false);
  const [allocations, setAllocations] = useState({});
  const [form, setForm] = useState({ amount: '', date: nowIso().slice(0, 10), note: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadEntries() {
      const rows = await ledger.listEntries(customerId);
      if (active) {
        setEntries(rows.filter((item) => Number(item.balance_remaining) > 0));
      }
    }
    loadEntries();
    return () => {
      active = false;
    };
  }, [customerId, ledger.refreshKey]);

  const manualTotal = useMemo(
    () => Object.values(allocations).reduce((sum, value) => sum + Number(value || 0), 0),
    [allocations]
  );

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateAllocation(entryId, value) {
    setAllocations((current) => ({ ...current, [entryId]: value }));
  }

  async function save() {
    const amount = Number(form.amount);
    if (!amount || amount <= 0) {
      Alert.alert(t.appName, 'Enter a valid repayment amount.');
      return;
    }
    const manualRows = manual
      ? Object.entries(allocations)
          .map(([entryId, value]) => ({ entry_id: Number(entryId), amount_applied: Number(value || 0) }))
          .filter((item) => item.amount_applied > 0)
      : [];
    if (manual && Math.abs(manualTotal - amount) > 0.01) {
      Alert.alert(t.appName, 'Manual allocations must match the repayment amount.');
      return;
    }
    setSaving(true);
    await ledger.addRepayment({ customer_id: customerId, amount, date: form.date, note: form.note }, manualRows);
    setSaving(false);
    navigation.goBack();
  }

  return (
    <KeyboardAvoidingView style={globalStyles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={globalStyles.content}>
        <FormField label={t.amount} value={form.amount} onChangeText={(value) => update('amount', value)} keyboardType="numeric" />
        <FormField label={t.date} value={form.date} onChangeText={(value) => update('date', value)} />
        <FormField label={t.note} value={form.note} onChangeText={(value) => update('note', value)} multiline />
        <View style={[globalStyles.card, globalStyles.between]}>
          <View style={{ flex: 1, paddingRight: spacing.md }}>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '900' }}>{manual ? t.manualAllocation : t.autoAllocation}</Text>
            <Text style={globalStyles.subtitle}>{manual ? `${t.amount}: ${formatMoney(manualTotal)}` : 'Repayment will settle oldest dues first.'}</Text>
          </View>
          <Switch value={manual} onValueChange={setManual} thumbColor={manual ? colors.primary : colors.card} />
        </View>
        {manual
          ? entries.map((entry) => (
              <View key={entry.id} style={globalStyles.card}>
                <Text style={{ color: colors.text, fontSize: 17, fontWeight: '800' }}>{entry.date} - {formatMoney(entry.balance_remaining)}</Text>
                <FormField label={t.amount} value={allocations[entry.id] || ''} onChangeText={(value) => updateAllocation(entry.id, value)} keyboardType="numeric" />
              </View>
            ))
          : null}
        <Button title={t.save} onPress={save} loading={saving} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
