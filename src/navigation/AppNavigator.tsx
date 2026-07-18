/**
 * AppNavigator.tsx — Root navigation stack
 */
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View } from 'react-native';
import { hasPIN, checkUsagePermission, checkOverlayPermission } from '../services/AppLockBridge';

import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import AppListScreen from '../screens/AppListScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ChangePinScreen from '../screens/ChangePinScreen';

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
  AppList: undefined;
  Settings: undefined;
  ChangePin: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList | null>(null);

  useEffect(() => {
    const determineStart = async () => {
      try {
        const [hasPinSet, usageOk, overlayOk] = await Promise.all([
          hasPIN(),
          checkUsagePermission(),
          checkOverlayPermission(),
        ]);
        // Go to onboarding if any setup step is incomplete
        if (!hasPinSet || !usageOk || !overlayOk) {
          setInitialRoute('Onboarding');
        } else {
          setInitialRoute('Main');
        }
      } catch {
        setInitialRoute('Onboarding');
      }
    };
    determineStart();
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F0F1A', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#0F0F1A' },
          cardStyleInterpolator: ({ current, layouts }) => ({
            cardStyle: {
              opacity: current.progress,
              transform: [
                {
                  translateX: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layouts.screen.width * 0.15, 0],
                  }),
                },
              ],
            },
          }),
        }}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Main" component={HomeScreen} />
        <Stack.Screen name="AppList" component={AppListScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="ChangePin" component={ChangePinScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
