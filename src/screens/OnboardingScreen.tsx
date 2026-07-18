/**
 * OnboardingScreen.tsx
 *
 * Multi-step permission wizard:
 *   Step 1: Usage Access
 *   Step 2: Display Over Apps (Overlay)
 *   Step 3: Create PIN
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Animated,
  AppState,
} from 'react-native';
import {
  checkUsagePermission,
  requestUsagePermission,
  checkOverlayPermission,
  requestOverlayPermission,
  setPIN,
} from '../services/AppLockBridge';
import PermissionCard from '../components/PermissionCard';
import PinPad from '../components/PinPad';

type Step = 'permissions' | 'create_pin' | 'confirm_pin';

const OnboardingScreen = ({ navigation }: any) => {
  const [step, setStep] = useState<Step>('permissions');
  const [usageGranted, setUsageGranted] = useState(false);
  const [overlayGranted, setOverlayGranted] = useState(false);
  const [firstPin, setFirstPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    checkPermissions();
  }, []);

  // Re-check permissions when user returns from Settings
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') checkPermissions();
    });
    return () => sub.remove();
  }, []);

  const checkPermissions = async () => {
    const [usage, overlay] = await Promise.all([
      checkUsagePermission(),
      checkOverlayPermission(),
    ]);
    setUsageGranted(usage);
    setOverlayGranted(overlay);
  };

  const canProceed = usageGranted && overlayGranted;

  const handleFirstPin = (pin: string) => {
    setFirstPin(pin);
    setStep('confirm_pin');
  };

  const handleConfirmPin = async (pin: string) => {
    if (pin !== firstPin) {
      setPinError(true);
      setTimeout(() => setPinError(false), 1000);
      return;
    }
    await setPIN(pin);
    navigation.replace('Main');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        {step === 'permissions' && (
          <>
            <View style={styles.header}>
              <Text style={styles.emoji}>🔐</Text>
              <Text style={styles.title}>Set Up AppLocker</Text>
              <Text style={styles.subtitle}>
                Grant these permissions so AppLocker can protect your apps.
              </Text>
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
              <PermissionCard
                icon="📊"
                title="Usage Access"
                description="Required to detect which app is currently open so AppLocker can intercept and lock it."
                isGranted={usageGranted}
                onRequest={requestUsagePermission}
              />
              <PermissionCard
                icon="🪟"
                title="Display Over Apps"
                description="Required to show the lock screen on top of the app that you're trying to open."
                isGranted={overlayGranted}
                onRequest={requestOverlayPermission}
              />
            </ScrollView>

            <TouchableOpacity
              style={[styles.nextButton, !canProceed && styles.nextButtonDisabled]}
              onPress={() => setStep('create_pin')}
              disabled={!canProceed}
              accessibilityLabel="Continue to create PIN">
              <Text style={styles.nextButtonText}>
                {canProceed ? 'Continue →' : 'Grant permissions above'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {step === 'create_pin' && (
          <View style={styles.pinContainer}>
            <Text style={styles.emoji}>🔑</Text>
            <Text style={styles.title}>Create Your PIN</Text>
            <PinPad
              onComplete={handleFirstPin}
              subtitle="Enter a 4-digit PIN"
            />
          </View>
        )}

        {step === 'confirm_pin' && (
          <View style={styles.pinContainer}>
            <Text style={styles.emoji}>✅</Text>
            <Text style={styles.title}>Confirm PIN</Text>
            <PinPad
              onComplete={handleConfirmPin}
              subtitle="Enter your PIN again to confirm"
              error={pinError}
            />
            <TouchableOpacity onPress={() => setStep('create_pin')}>
              <Text style={styles.backLink}>← Change PIN</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F0F1A' },
  container: { flex: 1 },
  header: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 24, marginBottom: 24 },
  emoji: { fontSize: 56, marginBottom: 16 },
  title: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  scroll: { flex: 1 },
  nextButton: {
    margin: 24,
    backgroundColor: '#6C63FF',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: 'rgba(108,99,255,0.3)',
  },
  nextButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  pinContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  backLink: {
    color: '#6C63FF',
    fontSize: 14,
    marginTop: 24,
    fontWeight: '600',
  },
});

export default OnboardingScreen;
