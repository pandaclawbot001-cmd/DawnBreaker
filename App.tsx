import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, ActivityIndicator } from 'react-native';
import { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';

// Auth screens
import WelcomeScreen from './src/screens/auth/WelcomeScreen';
import SignUpScreen from './src/screens/auth/SignUpScreen';
import LoginScreen from './src/screens/auth/LoginScreen';

// Main screens
import HomeScreen from './src/screens/main/HomeScreen';
import SquadScreen from './src/screens/main/SquadScreen';
import GameScreen from './src/screens/main/GameScreen';
import ProfileScreen from './src/screens/main/ProfileScreen';
import LeaderboardScreen from './src/screens/main/LeaderboardScreen';

// Squad screens
import SquadChatScreen from './src/screens/squad/SquadChatScreen';
import SOSScreen from './src/screens/squad/SOSScreen';
import CreateSquadScreen from './src/screens/squad/CreateSquadScreen';
import JoinSquadScreen from './src/screens/squad/JoinSquadScreen';

const AuthStack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
    </AuthStack.Navigator>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1A1A1A',
          borderTopColor: '#2A2A2A',
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: '#E85D04',
        tabBarInactiveTintColor: '#6B7280',
        tabBarLabelStyle: {
          fontWeight: '700',
          fontSize: 11,
          letterSpacing: 1,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: 'BASE CAMP' }}
      />
      <Tab.Screen
        name="Squad"
        component={SquadScreen}
        options={{ tabBarLabel: 'SQUAD' }}
      />
      <Tab.Screen
        name="Game"
        component={GameScreen}
        options={{ tabBarLabel: 'WORLD' }}
      />
      <Tab.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{ tabBarLabel: 'RANKS' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'PROFILE' }}
      />
    </Tab.Navigator>
  );
}

function MainNavigator() {
  return (
    <MainStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1A1A1A' },
        headerTintColor: '#F5F5F5',
        headerTitleStyle: { fontWeight: '700', letterSpacing: 2 },
        contentStyle: { backgroundColor: '#0D0D0D' },
      }}
    >
      <MainStack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
      <MainStack.Screen name="SquadChat" component={SquadChatScreen} options={{ title: 'COMMS' }} />
      <MainStack.Screen name="SOS" component={SOSScreen} options={{ title: 'SOS' }} />
      <MainStack.Screen name="CreateSquad" component={CreateSquadScreen} options={{ title: 'CREATE SQUAD' }} />
      <MainStack.Screen name="JoinSquad" component={JoinSquadScreen} options={{ title: 'JOIN SQUAD' }} />
    </MainStack.Navigator>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0D0D0D', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#E85D04" />
        <Text style={{ color: '#6B7280', marginTop: 16, letterSpacing: 2, fontSize: 12 }}>INITIALIZING...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {session ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
