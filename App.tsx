import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { RootStackParamList } from './src/navigation/types';
import { colors } from './src/theme/colors';
import { HomeScreen } from './src/screens/HomeScreen';
import { TrackScreen } from './src/screens/TrackScreen';
import { ModuleScreen } from './src/screens/ModuleScreen';
import { ModeScreen } from './src/screens/ModeScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.bg,
    text: colors.text,
    border: colors.border,
    primary: colors.accent,
  },
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <NavigationContainer theme={theme}>
          <StatusBar style="light" />
          <Stack.Navigator
            screenOptions={{
              headerStyle: { backgroundColor: colors.bg },
              headerTitleStyle: { color: colors.text },
              headerTintColor: colors.accent,
              headerShadowVisible: false,
              contentStyle: { backgroundColor: colors.bg },
            }}
          >
            <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Psyche' }} />
            <Stack.Screen name="Track" component={TrackScreen} options={{ title: '' }} />
            <Stack.Screen name="Module" component={ModuleScreen} options={{ title: '' }} />
            <Stack.Screen name="Mode" component={ModeScreen} options={{ title: '' }} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
