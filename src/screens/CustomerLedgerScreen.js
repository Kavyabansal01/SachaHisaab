import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Text, View } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useFocusEffect } from '@react-navigation/native';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { useLedger } from '../context/LedgerContext';
import { useSettings } from '../context/SettingsContext';
import { colors, globalStyles, spacing } from '../theme';
import { formatMoney } from '../utils/format';

export function CustomerLedgerScreen({ navigation, route }) {
  const { t } = useSettings();
  const ledger = useLedger();
  const customerId = route.params?.customerId;
  const [customer, setCustomer] = useState(null);
  const [entries, setEntries] = useState([]);
  const [repayments, setRepayments] = useState([]);

  const load = useCallback(async () => {
    const [nextCustomer, nextEntries, nextRepayments] = await Promise.all([
      ledger.getCustomer(customerId),
      ledger.listEntries(customerId),
      ledger.listRepayments(customerId),
    ]);
    setCustomer(nextCustomer);
    setEntries(nextEntries);
    setRepayments(nextRepayments);
  }, [customerId, ledger.refreshKey]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const history = useMemo(() => {
    return [
      ...entries.map((item) => ({ ...item, kind: 'entry' })),
      ...repayments.map((item) => ({ ...item, kind: 'repayment' })),
    ].sort((a, b) => String(b.date).localeCompare(String(a.date)) || b.id - a.id);
  }, [entries, repayments]);

  async function exportCsv() {
    const rows = ['kind,date,amount,settled,balance,note'];
    history.forEach((item) => {
      rows.push([item.kind, item.date, item.amount, item.amount_settled || '', item.balance_remaining || '', `"${String(item.note || '').replace(/"/g, '""')}"`].join(','));
    });
    const uri = `${FileSystem.cacheDirectory}sacha-hisaab-${customer.phone}.csv`;
    await FileSystem.writeAsStringAsync(uri, rows.join('\n'));
    await Sharing.shareAsync(uri, { mimeType: 'text/csv', dialogTitle: t.exportCsv });
  }

  async function exportPdf() {
    const rows = history
      .map((item) => `<tr><td>${item.kind}</td><td>${item.date}</td><td>${formatMoney(item.amount)}</td><td>${formatMoney(item.balance_remaining || 0)}</td><td>${item.note || ''}</td></tr>`)
      .join('');
    const html = `<html><body><h1>${customer.name}</h1><h2>${t.appName}</h2><p>${t.outstanding}: ${formatMoney(customer.outstanding)}</p><table border="1" cellspacing="0" cellpadding="6"><tr><th>Type</th><th>Date</th><th>Amount</th><th>Balance</th><th>Note</th></tr>${rows}</table></body></html>`;
    const file = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf', dialogTitle: t.exportPdf });
  }

  async function removeEntry(id) {
    Alert.alert(t.delete, 'Delete this entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: t.delete,
        style: 'destructive',
        onPress: async () => {
          await ledger.deleteEntry(id);
          await load();
        },
      },
    ]);
  }

  if (!customer) {
    return <EmptyState title="Loading ledger" />;
  }

  return (
    <FlatList
      style={globalStyles.screen}
      contentContainerStyle={globalStyles.content}
      ListHeaderComponent={
        <View>
          <Text style={globalStyles.title}>{customer.name}</Text>
          <Text style={globalStyles.subtitle}>{customer.phone}</Text>
          <View style={globalStyles.card}>
            <Text style={{ color: colors.muted, fontSize: 16, fontWeight: '700' }}>{t.outstanding}</Text>
            <Text style={{ color: colors.primary, fontSize: 34, fontWeight: '900', marginTop: spacing.xs }}>{formatMoney(customer.outstanding)}</Text>
          </View>
          <Button title={t.addEntry} onPress={() => navigation.navigate('EntryForm', { customerId, sectionType: customer.section_type })} />
          <Button title={t.addRepayment} onPress={() => navigation.navigate('RepaymentForm', { customerId })} variant="secondary" />
          <Button title={t.edit} onPress={() => navigation.navigate('CustomerForm', { customerId })} variant="secondary" />
          <View style={globalStyles.row}>
            <View style={{ flex: 1, marginRight: spacing.xs }}><Button title={t.exportPdf} onPress={exportPdf} variant="secondary" /></View>
            <View style={{ flex: 1, marginLeft: spacing.xs }}><Button title={t.exportCsv} onPress={exportCsv} variant="secondary" /></View>
          </View>
          <Text style={{ color: colors.text, fontSize: 21, fontWeight: '900', marginVertical: spacing.md }}>{t.transactions}</Text>
        </View>
      }
      data={history}
      keyExtractor={(item) => `${item.kind}-${item.id}`}
      renderItem={({ item }) => (
        <View style={globalStyles.card}>
          <View style={globalStyles.between}>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '900' }}>{item.kind === 'entry' ? t.entry : t.repayment}</Text>
            <Text style={{ color: item.kind === 'entry' ? colors.primary : colors.success, fontSize: 18, fontWeight: '900' }}>{formatMoney(item.amount)}</Text>
          </View>
          <Text style={globalStyles.subtitle}>{item.date}</Text>
          {item.kind === 'entry' ? <Text style={globalStyles.subtitle}>{t.runningBalance}: {formatMoney(item.balance_remaining)}</Text> : null}
          {item.note ? <Text style={{ color: colors.text, fontSize: 16, marginTop: spacing.sm }}>{item.note}</Text> : null}
          {item.kind === 'entry' ? <Button title={t.delete} onPress={() => removeEntry(item.id)} variant="danger" /> : null}
        </View>
      )}
      ListEmptyComponent={<EmptyState title="No transactions yet" hint="Add an entry or repayment to build the ledger." />}
    />
  );
}
