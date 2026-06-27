import { useCallback, useMemo, useState } from 'react';
import { FlatList, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Button } from '../components/Button';
import { CustomerRow } from '../components/CustomerRow';
import { EmptyState } from '../components/EmptyState';
import { useLedger } from '../context/LedgerContext';
import { useSettings } from '../context/SettingsContext';
import { colors, globalStyles, spacing } from '../theme';

export function CustomerListScreen() {
  const { t } = useSettings();
  const route = useRoute();
  const navigation = useNavigation();
  const ledger = useLedger();
  const sectionType = route.params?.sectionType || 'LEND';
  const [customers, setCustomers] = useState([]);
  const [query, setQuery] = useState('');

  const title = sectionType === 'BORROW' ? t.suppliers : t.customers;

  const load = useCallback(async () => {
    const rows = await ledger.listCustomers(sectionType);
    setCustomers(rows);
  }, [sectionType, ledger.refreshKey]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return customers;
    }
    return customers.filter((item) => `${item.name} ${item.phone}`.toLowerCase().includes(needle));
  }, [customers, query]);

  return (
    <FlatList
      style={globalStyles.screen}
      contentContainerStyle={globalStyles.content}
      ListHeaderComponent={
        <View>
          <Text style={globalStyles.title}>{title}</Text>
          <TextInput style={globalStyles.input} value={query} onChangeText={setQuery} placeholder={t.search} />
          <Button title={`${t.add} ${sectionType === 'BORROW' ? t.supplier : t.customer}`} onPress={() => navigation.navigate('CustomerForm', { sectionType })} />
        </View>
      }
      data={filtered}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => <CustomerRow customer={item} onPress={() => navigation.navigate('CustomerLedger', { customerId: item.id })} />}
      ListEmptyComponent={<EmptyState title={`No ${title.toLowerCase()} yet`} hint="Add the first account to begin tracking." />}
      ListFooterComponent={<Text style={{ color: colors.muted, textAlign: 'center', marginTop: spacing.md }}>{filtered.length} accounts</Text>}
    />
  );
}
