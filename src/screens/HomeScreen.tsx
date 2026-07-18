/**
 * HomeScreen.tsx — AppLocker dashboard
 */
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  ScrollView,
  Animated,
} from 'react-native';
import { useSettingsStore } from '../store/settingsStore';
import { useLockedAppsStore } from '../store/lockedAppsStore';
import { startMonitorService, stopMonitorService } from '../services/AppLockBridge';

const HomeScreen = ({ navigation }: any) => {
  const { settings, loadSettings, updateSettings } = useSettingsStore();
  const { installedApps, loadInstalledApps } = useLockedAppsStore();

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadSettings();
    loadInstalledApps();
  }, []);

  useEffect(() => {
    if (settings.serviceEnabled) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [settings.serviceEnabled]);

  const toggleService = async (value: boolean) => {
    if (value) {
      await startMonitorService();
    } else {
      await stopMonitorService();
    }
    await updateSettings({ serviceEnabled: value });
  };

  const lockedCount = installedApps.filter(a => a.isLocked).length;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>AppLocker</Text>
            <Text style={styles.tagline}>Protecting your privacy</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => navigation.navigate('Settings')}
            accessibilityLabel="Open settings">
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Active Shield */}
        <View style={styles.shieldContainer}>
          <Animated.View
            style={[
              styles.shieldGlow,
              { transform: [{ scale: pulseAnim }] },
              settings.serviceEnabled && styles.shieldActive,
            ]}
          />
          <View style={styles.shield}>
            <Text style={styles.shieldIcon}>
              {settings.serviceEnabled ? '🛡️' : '🔓'}
            </Text>
            <Text style={styles.shieldStatus}>
              {settings.serviceEnabled ? 'Protection Active' : 'Protection Off'}
            </Text>
            <Switch
              value={settings.serviceEnabled}
              onValueChange={toggleService}
              trackColor={{ false: '#333', true: '#6C63FF' }}
              thumbColor="#fff"
              style={styles.mainSwitch}
            />
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{lockedCount}</Text>
            <Text style={styles.statLabel}>Apps Locked</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{installedApps.length}</Text>
            <Text style={styles.statLabel}>Installed Apps</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {settings.serviceEnabled ? 'ON' : 'OFF'}
            </Text>
            <Text style={styles.statLabel}>Service</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('AppList')}
            accessibilityLabel="Manage locked apps">
            <Text style={styles.actionIcon}>📱</Text>
            <Text style={styles.actionLabel}>Manage Apps</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Settings')}
            accessibilityLabel="Open settings">
            <Text style={styles.actionIcon}>⚙️</Text>
            <Text style={styles.actionLabel}>Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('ChangePin')}
            accessibilityLabel="Change PIN">
            <Text style={styles.actionIcon}>🔑</Text>
            <Text style={styles.actionLabel}>Change PIN</Text>
          </TouchableOpacity>
        </View>

        {/* Info Banner */}
        {!settings.serviceEnabled && (
          <View style={styles.infoBanner}>
            <Text style={styles.infoText}>
              💡 Turn on protection above to start locking your apps.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F0F1A' },
  scroll: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 10,
  },
  greeting: { color: '#fff', fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  tagline: { color: '#555', fontSize: 13, marginTop: 2 },
  settingsBtn: { padding: 8 },
  settingsIcon: { fontSize: 24 },

  shieldContainer: {
    alignItems: 'center',
    marginVertical: 28,
    position: 'relative',
  },
  shieldGlow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(108,99,255,0.1)',
  },
  shieldActive: {
    backgroundColor: 'rgba(108,99,255,0.25)',
  },
  shield: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 2,
    borderColor: 'rgba(108,99,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  shieldIcon: { fontSize: 44 },
  shieldStatus: { color: '#ccc', fontSize: 12, fontWeight: '600' },
  mainSwitch: { marginTop: 4 },

  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  statNumber: { color: '#6C63FF', fontSize: 22, fontWeight: '800' },
  statLabel: { color: '#666', fontSize: 11, marginTop: 4 },

  sectionTitle: {
    color: '#888',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 24,
  },
  actionCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  actionIcon: { fontSize: 26, marginBottom: 8 },
  actionLabel: { color: '#ccc', fontSize: 12, fontWeight: '600', textAlign: 'center' },

  infoBanner: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: 'rgba(108,99,255,0.1)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.2)',
  },
  infoText: { color: '#aaa', fontSize: 13, lineHeight: 18 },
});

export default HomeScreen;
