import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
let Purchases: any = null;
try {
  Purchases = require('react-native-purchases').default;
} catch {
  // Native module not available in Expo Go
}
let Notifications: any = null;
try {
  Notifications = require('expo-notifications');
} catch {
  // Not available in Expo Go
}

import { Colors } from './src/constants/colors';
import { getSettings } from './src/storage/storage';
import { ThemeProvider, useTheme } from './src/hooks/useTheme';
import { LanguageProvider, useLanguage } from './src/hooks/useLanguage';
import { requestPermissions } from './src/hooks/useNotifications';

// Screens
import WelcomeScreen from './src/screens/Onboarding/WelcomeScreen';
import SetAllowanceScreen from './src/screens/Onboarding/SetAllowanceScreen';
import SetResetDateScreen from './src/screens/Onboarding/SetResetDateScreen';
import HomeScreen from './src/screens/Home/HomeScreen';
import AddExpenseScreen from './src/screens/AddExpense/AddExpenseScreen';
import HistoryScreen from './src/screens/History/HistoryScreen';
import GoalsScreen from './src/screens/Goals/GoalsScreen';
import AddGoalScreen from './src/screens/Goals/AddGoalScreen';
import SettingsScreen from './src/screens/Settings/SettingsScreen';
import AnalyticsScreen from './src/screens/Analytics/AnalyticsScreen';
import UpgradeScreen from './src/screens/Upgrade/UpgradeScreen';

// Notification handler
if (Notifications) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch {
    // Not available in Expo Go
  }
}

const OnboardingStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();

function OnboardingNavigator() {
  return (
    <OnboardingStack.Navigator screenOptions={{ headerShown: false }}>
      <OnboardingStack.Screen name="Welcome" component={WelcomeScreen} />
      <OnboardingStack.Screen name="SetAllowance" component={SetAllowanceScreen} />
      <OnboardingStack.Screen name="SetResetDate" component={SetResetDateScreen} />
    </OnboardingStack.Navigator>
  );
}

function TabNavigator() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.purple,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          height: 56 + (insets.bottom > 0 ? insets.bottom : 8),
        },
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'History') iconName = 'list';
          else if (route.name === 'Goals') iconName = 'flag';
          else if (route.name === 'Settings') iconName = 'settings';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Goals" component={GoalsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function MainNavigator() {
  const { colors } = useTheme();
  const { t } = useLanguage();

  return (
    <RootStack.Navigator>
      <RootStack.Screen
        name="Tabs"
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <RootStack.Screen
        name="AddExpense"
        component={AddExpenseScreen}
        options={({ route }: any) => ({
          title: route.params?.expense ? t('editExpense') : t('newExpense'),
          headerTintColor: Colors.purple,
          headerStyle: { backgroundColor: colors.background },
          headerTitleStyle: { color: colors.text },
          presentation: 'modal',
        })}
      />
      <RootStack.Screen
        name="AddGoal"
        component={AddGoalScreen}
        options={{
          title: t('newGoal'),
          headerTintColor: Colors.purple,
          headerStyle: { backgroundColor: colors.background },
          headerTitleStyle: { color: colors.text },
          presentation: 'modal',
        }}
      />
      <RootStack.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          title: 'Analytics',
          headerTintColor: Colors.purple,
          headerStyle: { backgroundColor: colors.background },
          headerTitleStyle: { color: colors.text },
          presentation: 'modal',
        }}
      />
      <RootStack.Screen
        name="Upgrade"
        component={UpgradeScreen}
        options={{
          title: 'Baon Buddy Pro',
          headerTintColor: Colors.purple,
          headerStyle: { backgroundColor: colors.background },
          headerTitleStyle: { color: colors.text },
          presentation: 'modal',
        }}
      />
    </RootStack.Navigator>
  );
}

function AppContent() {
  const { colors, isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [hasOnboarded, setHasOnboarded] = useState(false);

  useEffect(() => {
    // Configure RevenueCat (only if native module available)
    try {
      if (Purchases) {
        const REVENUECAT_GOOGLE_KEY = 'goog_dOEyCwYpORCfJhOMaLEtjnvcgcX';
        Purchases.configure({ apiKey: REVENUECAT_GOOGLE_KEY });
      }
    } catch {
      // RevenueCat not available in Expo Go
    }

    // Request notification permissions
    requestPermissions();

    // Check onboarding status
    checkOnboarding();
  }, []);

  async function checkOnboarding() {
    try {
      const settings = await getSettings();
      setHasOnboarded(settings.hasCompletedOnboarding);
    } catch (e) {
      setHasOnboarded(false);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={Colors.purple} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!hasOnboarded ? (
          <RootStack.Screen name="Onboarding" component={OnboardingNavigator} />
        ) : null}
        <RootStack.Screen name="Main" component={MainNavigator} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LanguageProvider>
          <AppContent />
        </LanguageProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
