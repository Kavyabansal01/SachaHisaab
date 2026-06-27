import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { CustomerRow } from '../components/CustomerRow';
import { EmptyState } from '../components/EmptyState';
import { StatCard } from '../components/StatCard';
import { useLedger } from '../context/LedgerContext';
import { useSettings } from '../context/SettingsContext';
import { colors, globalStyles, spacing } from '../theme';
import { formatMoney } from '../utils/format';

export function DashboardScreen() {
  const { t } = useSettings();
  const ledger = useLedger();
  const navigation = useNavigation();
  const [data, setData] = useState({ totals: {}, overdue: [], todayCollections: 0 });
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const next = await ledger.loadDashboard();
    setData(next);
    setLoading(false);
  }, [ledger.refreshKey]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <FlatList
      style={globalStyles.screen}
      contentContainerStyle={globalStyles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      ListHeaderComponent={
        <View>
          <Text style={globalStyles.title}>{t.appName}</Text>
          <Text style={globalStyles.subtitle}>{t.tagline}</Text>
          <View style={[globalStyles.row, { marginTop: spacing.md }]}>
            <StatCard label={t.lend} value={formatMoney(data.totals?.lend_total)} />
            <StatCard label={t.borrow} value={formatMoney(data.totals?.borrow_total)} tone="danger" />
          </View>
          <View style={globalStyles.row}>
            <StatCard label={t.todayCollections} value={formatMoney(data.todayCollections)} tone="success" />
            <StatCard label={t.overdue} value={String(data.overdue?.length || 0)} tone="danger" />
          </View>
          <Text style={{ color: colors.text, fontSize: 21, fontWeight: '900', marginVertical: spacing.md }}>{t.overdue}</Text>
        </View>
      }
      data={data.overdue}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => <CustomerRow customer={item} onPress={() => navigation.navigate('CustomerLedger', { customerId: item.id })} />}
      ListEmptyComponent={<EmptyState title="No overdue accounts" hint="Accounts needing attention will appear here." />}
    />
  );
}
