/**
 * PinPad.tsx — Animated PIN entry keypad
 */
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Vibration,
  Animated,
} from 'react-native';

const PIN_LENGTH = 4;

const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', '⌫'],
];

interface PinPadProps {
  onComplete: (pin: string) => void;
  onError?: () => void;
  subtitle?: string;
  error?: boolean;
}

const PinPad: React.FC<PinPadProps> = ({ onComplete, subtitle, error }) => {
  const [pin, setPin] = useState('');
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Vibration.vibrate([0, 50, 50, 50]);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  React.useEffect(() => {
    if (error) {
      shake();
      setPin('');
    }
  }, [error]);

  const handleKey = (key: string) => {
    if (key === '⌫') {
      setPin(p => p.slice(0, -1));
      return;
    }
    if (!key) return;
    const next = pin + key;
    setPin(next);
    if (next.length === PIN_LENGTH) {
      onComplete(next);
      setPin('');
    }
  };

  return (
    <View style={styles.container}>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      {/* PIN dots */}
      <Animated.View
        style={[styles.dots, { transform: [{ translateX: shakeAnim }] }]}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i < pin.length && styles.dotFilled]}
          />
        ))}
      </Animated.View>

      {/* Keypad */}
      {KEYS.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map((key, ki) => (
            <TouchableOpacity
              key={ki}
              style={[styles.key, !key && styles.keyEmpty]}
              onPress={() => handleKey(key)}
              disabled={!key}
              activeOpacity={0.7}
              accessibilityLabel={key === '⌫' ? 'Delete' : key}>
              <Text style={[styles.keyText, key === '⌫' && styles.deleteText]}>
                {key}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
  subtitle: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 24,
    letterSpacing: 0.3,
  },
  dots: {
    flexDirection: 'row',
    marginBottom: 40,
    gap: 16,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#6C63FF',
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: '#6C63FF',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 24,
  },
  key: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  keyEmpty: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  keyText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '500',
  },
  deleteText: {
    fontSize: 22,
  },
});

export default PinPad;
