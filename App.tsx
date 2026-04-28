import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';

import DashboardScreen from './src/screens/DashboardScreen';
import ExpensesScreen from './src/screens/ExpensesScreen';
import IncomeScreen from './src/screens/IncomeScreen';
import SavingsScreen from './src/screens/SavingsScreen';
import AddTransactionScreen from './src/screens/AddTransactionScreen';
import { Colors } from './src/constants/colors';

// ─── Tab Navigator ───────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator();

type TabIconName = React.ComponentProps<typeof MaterialIcons>['name'];

const tabConfig: Record<string, { label: string; icon: TabIconName; activeIcon: TabIconName }> = {
  Dashboard: { label: 'Home', icon: 'home-filled', activeIcon: 'home-filled' },
  Expenses: { label: 'Expenses', icon: 'receipt-long', activeIcon: 'receipt-long' },
  Income: { label: 'Income', icon: 'trending-up', activeIcon: 'trending-up' },
  Savings: { label: 'Savings', icon: 'savings', activeIcon: 'savings' },
};

const TabNavigator: React.FC = () => (
  <Tab.Navigator
    screenOptions={({ route }) => {
      const cfg = tabConfig[route.name];
      return {
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => (
          <MaterialIcons
            name={(focused ? cfg?.activeIcon : cfg?.icon) ?? 'circle'}
            size={size}
            color={color}
          />
        ),
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.gray400,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          height: 64,
          paddingBottom: 10,
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
    <Tab.Screen name="Expenses" component={ExpensesScreen} options={{ tabBarLabel: 'Expenses' }} />
    <Tab.Screen name="Income" component={IncomeScreen} options={{ tabBarLabel: 'Income' }} />
    <Tab.Screen name="Savings" component={SavingsScreen} options={{ tabBarLabel: 'Savings' }} />
  </Tab.Navigator>
);

// ─── Root Stack Navigator ─────────────────────────────────────────────────────

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen
          name="AddTransaction"
          component={AddTransactionScreen}
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
