/**
 * ChangePinScreen.tsx — Change existing PIN
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
} from 'react-native';
import { verifyPIN, setPIN } from '../services/AppLockBridge';
import PinPad from '../components/PinPad';

type Step = 'verify_old' | 'enter_new' | 'confirm_new' | 'done';

const ChangePinScreen = ({ navigation }: any) => {
  const [step, setStep] = useState<Step>('verify_old');
  const [newPin, setNewPin] = useState('');
  const [error, setError] = useState(false);

  const triggerError = () => {
    setError(true);
    setTimeout(() => setError(false), 1000);
  };

  const handleVerifyOld = async (pin: string) => {
    const correct = await verifyPIN(pin);
    if (correct) {
      setStep('enter_new');
    } else {
      triggerError();
    }
  };

  const handleNewPin = (pin: string) => {
    setNewPin(pin);
    setStep('confirm_new');
  };

  const handleConfirm = async (pin: string) => {
    if (pin !== newPin) {
      triggerError();
      return;
    }
    await setPIN(pin);
    setStep('done');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}
          accessibilityLabel="Go back">
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Change PIN</Text>
      </View>

      <View style={styles.content}>
        {step === 'verify_old' && (
          <>
            <Text style={styles.emoji}>🔐</Text>
            <Text style={styles.heading}>Enter Current PIN</Text>
            <PinPad onComplete={handleVerifyOld} error={error} />
          </>
        )}
        {step === 'enter_new' && (
          <>
            <Text style={styles.emoji}>🆕</Text>
            <Text style={styles.heading}>Enter New PIN</Text>
            <PinPad onComplete={handleNewPin} error={error} />
          </>
        )}
        {step === 'confirm_new' && (
          <>
            <Text style={styles.emoji}>✅</Text>
            <Text style={styles.heading}>Confirm New PIN</Text>
            <PinPad onComplete={handleConfirm} error={error} />
          </>
        )}
        {step === 'done' && (
          <View style={styles.success}>
            <Text style={styles.successIcon}>🎉</Text>
            <Text style={styles.successText}>PIN Changed Successfully!</Text>
            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => navigation.goBack()}
              accessibilityLabel="Done">
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F0F1A' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  backBtn: { padding: 4 },
  backText: { color: '#6C63FF', fontSize: 22, fontWeight: '700' },
  title: { color: '#fff', fontSize: 20, fontWeight: '700' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  emoji: { fontSize: 52, marginBottom: 16 },
  heading: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 32 },
  success: { alignItems: 'center', gap: 16 },
  successIcon: { fontSize: 64 },
  successText: { color: '#48c78e', fontSize: 20, fontWeight: '700' },
  doneBtn: {
    marginTop: 16,
    backgroundColor: '#6C63FF',
    borderRadius: 14,
    paddingHorizontal: 40,
    paddingVertical: 14,
  },
  doneBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

export default ChangePinScreen;
