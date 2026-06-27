import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { DashboardScreen } from '../screens/DashboardScreen';
import { CustomerListScreen } from '../screens/CustomerListScreen';
import { CustomerLedgerScreen } from '../screens/CustomerLedgerScreen';
import { CustomerFormScreen } from '../screens/CustomerFormScreen';
import { EntryFormScreen } from '../screens/EntryFormScreen';
import { RepaymentFormScreen } from '../screens/RepaymentFormScreen';
import { CalendarScreen } from '../screens/CalendarScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { colors } from '../theme';
import { useSettings } from '../context/SettingsContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function icon(label) {
  return ({ color }) => <Text style={{ color, fontSize: 22 }}>{label}</Text>;
}

function MainTabs() {
  const { t } = useSettings();
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { color: colors.text, fontWeight: '900' },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 13, fontWeight: '700' },
        tabBarStyle: { height: 62, paddingBottom: 8, paddingTop: 6 },
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: t.dashboard, tabBarIcon: icon('घर') }} />
      <Tab.Screen name="LendList" component={CustomerListScreen} initialParams={{ sectionType: 'LEND' }} options={{ title: t.lend, tabBarIcon: icon('+') }} />
      <Tab.Screen name="BorrowList" component={CustomerListScreen} initialParams={{ sectionType: 'BORROW' }} options={{ title: t.borrow, tabBarIcon: icon('-') }} />
      <Tab.Screen name="Calendar" component={CalendarScreen} options={{ title: t.calendar, tabBarIcon: icon('दिन') }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: t.settings, tabBarIcon: icon('⚙') }} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.background }, headerTitleStyle: { color: colors.text, fontWeight: '900' } }}>
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="CustomerLedger" component={CustomerLedgerScreen} options={{ title: 'Ledger' }} />
      <Stack.Screen name="CustomerForm" component={CustomerFormScreen} options={{ title: 'Customer' }} />
      <Stack.Screen name="EntryForm" component={EntryFormScreen} options={{ title: 'Entry' }} />
      <Stack.Screen name="RepaymentForm" component={RepaymentFormScreen} options={{ title: 'Repayment' }} />
    </Stack.Navigator>
  );
}
