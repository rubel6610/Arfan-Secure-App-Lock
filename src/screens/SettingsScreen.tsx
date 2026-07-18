/**
 * SettingsScreen.tsx
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { useSettingsStore } from '../store/settingsStore';

const THEMES = ['DARK', 'LIGHT', 'AMOLED'] as const;
const GRACE_PERIODS = [
  { label: 'Immediately', value: 0 },
  { label: '30 seconds', value: 30_000 },
  { label: '1 minute', value: 60_000 },
  { label: '5 minutes', value: 300_000 },
];

const SettingsScreen = ({ navigation }: any) => {
  const { settings, loadSettings, updateSettings } = useSettingsStore();

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}
          accessibilityLabel="Go back">
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Security */}
        <Text style={styles.section}>Security</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('ChangePin')}
            accessibilityLabel="Change PIN">
            <Text style={styles.rowIcon}>🔑</Text>
            <View style={styles.rowInfo}>
              <Text style={styles.rowLabel}>Change PIN</Text>
              <Text style={styles.rowSub}>Update your 4-digit PIN</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.rowIcon}>📸</Text>
            <View style={styles.rowInfo}>
              <Text style={styles.rowLabel}>Intruder Selfie</Text>
              <Text style={styles.rowSub}>Take photo on 3 failed attempts</Text>
            </View>
            <Switch
              value={settings.intruderSelfie}
              onValueChange={v => updateSettings({ intruderSelfie: v })}
              trackColor={{ false: '#333', true: '#6C63FF' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Lock Timing */}
        <Text style={styles.section}>Lock Timing</Text>
        <View style={styles.card}>
          {GRACE_PERIODS.map(gp => (
            <TouchableOpacity
              key={gp.value}
              style={styles.row}
              onPress={() => updateSettings({ gracePeriodMs: gp.value })}
              accessibilityLabel={`Set grace period to ${gp.label}`}>
              <Text style={styles.rowIcon}>⏱️</Text>
              <Text style={[styles.rowLabel, { flex: 1 }]}>{gp.label}</Text>
              {settings.gracePeriodMs === gp.value && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Theme */}
        <Text style={styles.section}>Appearance</Text>
        <View style={styles.card}>
          <View style={styles.themeRow}>
            {THEMES.map(theme => (
              <TouchableOpacity
                key={theme}
                style={[
                  styles.themeChip,
                  settings.themeId === theme && styles.themeChipActive,
                ]}
                onPress={() => updateSettings({ themeId: theme })}
                accessibilityLabel={`Select ${theme} theme`}>
                <Text style={[
                  styles.themeText,
                  settings.themeId === theme && styles.themeTextActive,
                ]}>
                  {theme === 'DARK' ? '🌑 Dark' : theme === 'LIGHT' ? '☀️ Light' : '⬛ AMOLED'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* About */}
        <Text style={styles.section}>About</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowIcon}>ℹ️</Text>
            <View style={styles.rowInfo}>
              <Text style={styles.rowLabel}>MyAppLocker</Text>
              <Text style={styles.rowSub}>Version 1.0.0</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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

  section: {
    color: '#555',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
  },
  card: {
    marginHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowIcon: { fontSize: 20 },
  rowInfo: { flex: 1 },
  rowLabel: { color: '#fff', fontSize: 15, fontWeight: '600' },
  rowSub: { color: '#555', fontSize: 12, marginTop: 2 },
  chevron: { color: '#555', fontSize: 20 },
  checkmark: { color: '#6C63FF', fontSize: 18, fontWeight: '800' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginLeft: 16 },

  themeRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  themeChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  themeChipActive: {
    backgroundColor: 'rgba(108,99,255,0.2)',
    borderColor: '#6C63FF',
  },
  themeText: { color: '#666', fontSize: 12, fontWeight: '600' },
  themeTextActive: { color: '#fff' },
});

export default SettingsScreen;
