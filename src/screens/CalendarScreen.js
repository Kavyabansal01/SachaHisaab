import { useCallback, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useLedger } from '../context/LedgerContext';
import { useSettings } from '../context/SettingsContext';
import { colors, globalStyles, spacing } from '../theme';
import { formatMoney, todayKey } from '../utils/format';

export function CalendarScreen() {
  const { t } = useSettings();
  const ledger = useLedger();
  const [rows, setRows] = useState([]);
  const month = todayKey().slice(0, 7);

  useFocusEffect(
    useCallback(() => {
      async function load() {
        const activity = await ledger.loadCalendarActivity(month);
        setRows(activity);
      }
      load();
    }, [month, ledger.refreshKey])
  );

  const byDay = useMemo(() => {
    return rows.reduce((map, item) => {
      map[item.day] = [...(map[item.day] || []), item];
      return map;
    }, {});
  }, [rows]);

  const days = Array.from({ length: new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0).getDate() }, (_, index) => `${month}-${String(index + 1).padStart(2, '0')}`);

  return (
    <ScrollView style={globalStyles.screen} contentContainerStyle={globalStyles.content}>
      <Text style={globalStyles.title}>{t.calendar}</Text>
      <Text style={globalStyles.subtitle}>{month}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.md }}>
        {days.map((day) => {
          const active = byDay[day]?.length;
          return (
            <View key={day} style={{ width: '14.28%', padding: 3 }}>
              <View style={{ minHeight: 54, borderRadius: 8, borderWidth: 1, borderColor: active ? colors.primary : colors.border, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: '900' }}>{Number(day.slice(8))}</Text>
                {active ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 4 }} /> : null}
              </View>
            </View>
          );
        })}
      </View>
      <Text style={{ color: colors.text, fontSize: 21, fontWeight: '900', marginVertical: spacing.md }}>Daily details</Text>
      {Object.keys(byDay).map((day) => (
        <View key={day} style={globalStyles.card}>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: '900' }}>{day}</Text>
          {byDay[day].map((item) => (
            <Text key={`${item.kind}-${day}`} style={globalStyles.subtitle}>{item.kind}: {item.count} | {formatMoney(item.amount)}</Text>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}
