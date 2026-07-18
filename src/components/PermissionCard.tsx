/**
 * PermissionCard.tsx — Permission status display card
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface PermissionCardProps {
  title: string;
  description: string;
  isGranted: boolean;
  onRequest: () => void;
  icon: string;
}

const PermissionCard: React.FC<PermissionCardProps> = ({
  title,
  description,
  isGranted,
  onRequest,
  icon,
}) => (
  <View style={[styles.card, isGranted && styles.cardGranted]}>
    <View style={styles.header}>
      <Text style={styles.icon}>{icon}</Text>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={[styles.status, isGranted ? styles.granted : styles.pending]}>
          {isGranted ? '✓ Granted' : 'Not granted'}
        </Text>
      </View>
    </View>
    <Text style={styles.description}>{description}</Text>
    {!isGranted && (
      <TouchableOpacity
        style={styles.button}
        onPress={onRequest}
        activeOpacity={0.8}
        accessibilityLabel={`Grant ${title} permission`}>
        <Text style={styles.buttonText}>Grant Permission →</Text>
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 20,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardGranted: {
    borderColor: 'rgba(72, 199, 142, 0.3)',
    backgroundColor: 'rgba(72, 199, 142, 0.06)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  icon: {
    fontSize: 28,
    marginRight: 14,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
  },
  granted: {
    color: '#48c78e',
  },
  pending: {
    color: '#f39c12',
  },
  description: {
    color: '#888',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  button: {
    backgroundColor: '#6C63FF',
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 18,
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
});

export default PermissionCard;
