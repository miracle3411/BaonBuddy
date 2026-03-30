import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import Purchases from 'react-native-purchases';

import { Colors } from './src/constants/colors';
import { getSettings } from './src/storage/storage';

// Screens
import WelcomeScreen from './src/screens/Onboarding/WelcomeScreen';
import SetAllowanceScreen from './src/screens/Onboarding/SetAllowanceScreen';
import SetResetDateScreen from './src/screens/Onboarding/SetResetDateScreen';
import HomeScreen from './src/screens/Home/HomeScreen';
import AddExpenseScreen from './src/screens/AddExpense/AddExpenseScreen';
import HistoryScreen from './src/screens/History/HistoryScreen';
import GoalsScreen from './src/screens/Goals/GoalsScreen';
import SettingsScreen from './src/screens/Settings/SettingsScreen';

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
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.purple,
        tabBarInactiveTintColor: Colors.gray,
        tabBarStyle: {
          borderTopColor: Colors.grayLight,
          paddingBottom: 4,
          height: 56,
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
        options={{
          title: 'Bagong Gastos',
          headerTintColor: Colors.purple,
          presentation: 'modal',
        }}
      />
    </RootStack.Navigator>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasOnboarded, setHasOnboarded] = useState(false);

  useEffect(() => {
    // Configure RevenueCat
    const REVENUECAT_GOOGLE_KEY = 'test_zErSzrKALOdeWQJRdVnFimSmrZL';
    Purchases.configure({ apiKey: REVENUECAT_GOOGLE_KEY });

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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.white }}>
        <ActivityIndicator size="large" color={Colors.purple} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!hasOnboarded ? (
          <RootStack.Screen name="Onboarding" component={OnboardingNavigator} />
        ) : null}
        <RootStack.Screen name="Main" component={MainNavigator} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
