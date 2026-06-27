import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LedgerProvider } from './src/context/LedgerContext';
import { SettingsProvider } from './src/context/SettingsContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { LockScreen } from './src/screens/LockScreen';
import { colors, globalStyles } from './src/theme';

function AppShell() {
  const { initializing, unlocked } = useAuth();

  if (initializing) {
    return (
      <View style={globalStyles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return unlocked ? <AppNavigator /> : <LockScreen />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <AuthProvider>
          <LedgerProvider>
            <NavigationContainer>
              <StatusBar style="dark" backgroundColor={colors.background} />
              <AppShell />
            </NavigationContainer>
          </LedgerProvider>
        </AuthProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
