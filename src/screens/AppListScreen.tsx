/**
 * AppListScreen.tsx — Browse and lock/unlock installed apps
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLockedAppsStore } from '../store/lockedAppsStore';
import AppCard from '../components/AppCard';

const AppListScreen = ({ navigation }: any) => {
  const {
    installedApps,
    isLoading,
    searchQuery,
    loadInstalledApps,
    toggleLock,
    setSearchQuery,
    filteredApps,
  } = useLockedAppsStore();

  const [showLockedOnly, setShowLockedOnly] = useState(false);

  useEffect(() => {
    loadInstalledApps();
  }, []);

  const displayed = showLockedOnly
    ? filteredApps().filter(a => a.isLocked)
    : filteredApps();

  const lockedCount = installedApps.filter(a => a.isLocked).length;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          accessibilityLabel="Go back">
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Select Apps to Lock</Text>
        <Text style={styles.count}>{lockedCount} locked</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search apps..."
          placeholderTextColor="#555"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          accessibilityLabel="Search apps"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} accessibilityLabel="Clear search">
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, !showLockedOnly && styles.tabActive]}
          onPress={() => setShowLockedOnly(false)}
          accessibilityLabel="Show all apps">
          <Text style={[styles.tabText, !showLockedOnly && styles.tabTextActive]}>
            All ({installedApps.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, showLockedOnly && styles.tabActive]}
          onPress={() => setShowLockedOnly(true)}
          accessibilityLabel="Show locked apps only">
          <Text style={[styles.tabText, showLockedOnly && styles.tabTextActive]}>
            Locked ({lockedCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* App List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C63FF" />
          <Text style={styles.loadingText}>Loading apps...</Text>
        </View>
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={item => item.packageName}
          renderItem={({ item }) => (
            <AppCard
              app={item}
              onToggle={toggleLock}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyText}>
                {searchQuery ? 'No apps match your search' : 'No apps found'}
              </Text>
            </View>
          }
        />
      )}
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
  title: { flex: 1, color: '#fff', fontSize: 18, fontWeight: '700' },
  count: { color: '#6C63FF', fontSize: 13, fontWeight: '600' },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, color: '#fff', fontSize: 15 },
  clearBtn: { color: '#666', fontSize: 16, paddingLeft: 8 },

  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: { backgroundColor: '#6C63FF' },
  tabText: { color: '#666', fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#fff' },

  list: { paddingBottom: 24 },

  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  loadingText: { color: '#666', fontSize: 14 },

  emptyContainer: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyIcon: { fontSize: 42 },
  emptyText: { color: '#555', fontSize: 15 },
});

export default AppListScreen;
