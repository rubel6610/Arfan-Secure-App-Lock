/**
 * AppCard.tsx — App list item with lock toggle
 */
import React, { useRef } from 'react';
import {
  View,
  Text,
  Switch,
  Image,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { InstalledApp } from '../services/AppLockBridge';

interface AppCardProps {
  app: InstalledApp;
  onToggle: (packageName: string, appName: string) => void;
}

const AppCard: React.FC<AppCardProps> = ({ app, onToggle }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleToggle = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    onToggle(app.packageName, app.appName);
  };

  const iconUri = app.icon ? `data:image/png;base64,${app.icon}` : null;

  return (
    <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={styles.inner}
        onPress={handleToggle}
        activeOpacity={0.85}
        accessibilityLabel={`${app.appName} lock toggle`}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          {iconUri ? (
            <Image source={{ uri: iconUri }} style={styles.icon} />
          ) : (
            <View style={[styles.icon, styles.iconPlaceholder]}>
              <Text style={styles.iconLetter}>
                {app.appName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* App Info */}
        <View style={styles.info}>
          <Text style={styles.appName} numberOfLines={1}>
            {app.appName}
          </Text>
          <Text style={styles.packageName} numberOfLines={1}>
            {app.packageName}
          </Text>
        </View>

        {/* Lock Toggle */}
        <View style={styles.switchContainer}>
          {app.isLocked && (
            <Text style={styles.lockIcon}>🔒</Text>
          )}
          <Switch
            value={app.isLocked}
            onValueChange={handleToggle}
            trackColor={{ false: 'rgba(255,255,255,0.1)', true: '#6C63FF' }}
            thumbColor={app.isLocked ? '#fff' : 'rgba(255,255,255,0.6)'}
          />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 5,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  iconContainer: {
    marginRight: 14,
  },
  icon: {
    width: 46,
    height: 46,
    borderRadius: 12,
  },
  iconPlaceholder: {
    backgroundColor: '#6C63FF33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLetter: {
    color: '#6C63FF',
    fontSize: 20,
    fontWeight: '700',
  },
  info: {
    flex: 1,
    marginRight: 8,
  },
  appName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  packageName: {
    color: '#666',
    fontSize: 11,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lockIcon: {
    fontSize: 14,
  },
});

export default AppCard;
