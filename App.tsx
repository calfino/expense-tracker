import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import DashboardScreen from './src/screens/DashboardScreen';
import ExpensesScreen from './src/screens/ExpensesScreen';
import IncomeScreen from './src/screens/IncomeScreen';
import SavingsScreen from './src/screens/SavingsScreen';
import AddTransactionScreen from './src/screens/AddTransactionScreen';
import LoginScreen from './src/screens/LoginScreen';
import { Colors } from './src/constants/colors';

// ─── Tab Navigator ────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator();
type TabIconName = React.ComponentProps<typeof MaterialIcons>['name'];

const tabConfig: Record<string, { label: string; icon: TabIconName }> = {
  Dashboard: { label: 'Home', icon: 'home-filled' },
  Expenses:  { label: 'Expenses', icon: 'receipt-long' },
  Income:    { label: 'Income', icon: 'trending-up' },
  Savings:   { label: 'Savings', icon: 'savings' },
};

const TabNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();
  const tabBarHeight = 56 + insets.bottom;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const cfg = tabConfig[route.name];
        return {
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => (
            <MaterialIcons name={cfg?.icon ?? 'circle'} size={size} color={color} />
          ),
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.gray400,
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          tabBarStyle: {
            backgroundColor: Colors.white,
            borderTopWidth: 1,
            borderTopColor: Colors.border,
            height: tabBarHeight,
            paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
            paddingTop: 6,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
            elevation: 12,
          },
        };
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Expenses"  component={ExpensesScreen}  options={{ tabBarLabel: 'Expenses' }} />
      <Tab.Screen name="Income"    component={IncomeScreen}    options={{ tabBarLabel: 'Income' }} />
      <Tab.Screen name="Savings"   component={SavingsScreen}   options={{ tabBarLabel: 'Savings' }} />
    </Tab.Navigator>
  );
};

// ─── Root Stack ───────────────────────────────────────────────────────────────
// Keep Stack.Navigator ALWAYS mounted — React Navigation requires this.
// Conditionally register auth screens or app screens based on auth state.

const Stack = createNativeStackNavigator();

const RootNavigator: React.FC = () => {
  const { user, familyId, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary }}>
        <ActivityIndicator size="large" color={Colors.white} />
      </View>
    );
  }

  const isAuthenticated = !!user && !!familyId;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        // ── Auth screens ──────────────────────────────────────────────────────
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ animationTypeForReplace: !user ? 'pop' : 'push' }}
        />
      ) : (
        // ── App screens ───────────────────────────────────────────────────────
        <>
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen
            name="AddTransaction"
            component={AddTransactionScreen}
            options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
