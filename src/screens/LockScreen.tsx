/**
 * LockScreen.tsx
 *
 * Full-screen lock overlay rendered inside LockOverlayActivity.
 * Registered as a separate React root component ("LockScreen").
 *
 * Accepts: { lockedPackage: string } from native intent extras.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Animated,
  TouchableOpacity,
  AppRegistry,
} from 'react-native';
import { verifyPIN, notifyUnlockSuccess, checkBiometric } from '../services/AppLockBridge';
import PinPad from '../components/PinPad';

interface LockScreenProps {
  lockedPackage?: string;
}

const LockScreen: React.FC<LockScreenProps> = ({ lockedPackage }) => {
  const [pinError, setPinError] = useState(false);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutSecs, setLockoutSecs] = useState(0);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  const slideAnim = useRef(new Animated.Value(50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slide-in animation
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    // Check biometric
    checkBiometric().then(status => {
      setBiometricAvailable(status === 'AVAILABLE');
    });
  }, []);

  const handlePIN = async (pin: string) => {
    try {
      const correct = await verifyPIN(pin);
      if (correct) {
        await notifyUnlockSuccess();
      } else {
        setPinError(true);
        setTimeout(() => setPinError(false), 1200);
      }
    } catch (err: any) {
      // Locked out
      if (err?.code === 'LOCKED_OUT') {
        const secs = parseInt(err.message.match(/\d+/)?.[0] || '30', 10);
        setIsLockedOut(true);
        setLockoutSecs(secs);
        const interval = setInterval(() => {
          setLockoutSecs(s => {
            if (s <= 1) {
              clearInterval(interval);
              setIsLockedOut(false);
              return 0;
            }
            return s - 1;
          });
        }, 1000);
      }
    }
  };

  // Display just the app package basename as a friendly name
  const appDisplayName = lockedPackage
    ? lockedPackage.split('.').pop() ?? lockedPackage
    : 'App';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F1A" />

      {/* Background gradient circles */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      <Animated.View
        style={[
          styles.content,
          {
            transform: [{ translateY: slideAnim }],
            opacity: opacityAnim,
          },
        ]}>

        {/* Lock icon */}
        <View style={styles.lockIconContainer}>
          <Text style={styles.lockIcon}>🔒</Text>
        </View>

        <Text style={styles.title}>App Locked</Text>
        <Text style={styles.appName}>{appDisplayName}</Text>
        <Text style={styles.subtitle}>Enter your PIN to unlock</Text>

        {isLockedOut ? (
          <View style={styles.lockoutContainer}>
            <Text style={styles.lockoutText}>
              Too many attempts. Try again in{' '}
              <Text style={styles.lockoutTimer}>{lockoutSecs}s</Text>
            </Text>
          </View>
        ) : (
          <PinPad
            onComplete={handlePIN}
            error={pinError}
          />
        )}

        {biometricAvailable && !isLockedOut && (
          <TouchableOpacity
            style={styles.biometricBtn}
            accessibilityLabel="Use fingerprint to unlock">
            <Text style={styles.biometricIcon}>👆</Text>
            <Text style={styles.biometricText}>Use Fingerprint</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgCircle1: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(108,99,255,0.1)',
  },
  bgCircle2: {
    position: 'absolute',
    bottom: -100,
    left: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(108,99,255,0.06)',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 24,
    width: '100%',
  },
  lockIconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(108,99,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.3)',
  },
  lockIcon: { fontSize: 42 },
  title: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  appName: {
    color: '#6C63FF',
    fontSize: 15,
    fontWeight: '600',
    textTransform: 'capitalize',
    marginBottom: 6,
  },
  subtitle: {
    color: '#555',
    fontSize: 14,
    marginBottom: 36,
  },

  lockoutContainer: {
    backgroundColor: 'rgba(255,80,80,0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,80,80,0.2)',
    marginVertical: 20,
  },
  lockoutText: { color: '#ff8888', fontSize: 14, textAlign: 'center' },
  lockoutTimer: { fontWeight: '800', color: '#ff4444' },

  biometricBtn: {
    marginTop: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  biometricIcon: { fontSize: 20 },
  biometricText: { color: '#ccc', fontSize: 14, fontWeight: '600' },
});

// Register as a separate React root for LockOverlayActivity
AppRegistry.registerComponent('LockScreen', () => LockScreen);

export default LockScreen;
