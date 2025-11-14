import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, Image, TouchableOpacity, Switch, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const FALLBACK_USER = {
  user_id: '-',
  username: 'Unknown',
  role: 'User',
  email: 'unknown@smartplant.dev',
  phone: 'N/A',
  created_at: 'N/A',
  active: false,
  avatar: null,
};

const ROLE_OPTIONS = ['Admin', 'Plant Researcher', 'User'];

const formatDate = (iso) => {
  if (!iso || iso === 'N/A') return 'Pending sync';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString();
};

const DetailRow = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value ?? '?'}</Text>
  </View>
);

// ⬇️ *** navigation ADDED here ***
export default function AdminUserDetailScreen({ route, navigation }) {
  const user = route?.params?.user ?? FALLBACK_USER;
  const onUpdate = route?.params?.onUpdate;

  const [currentUser, setCurrentUser] = useState(user);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  const avatarSource = currentUser.avatar
    ? { uri: currentUser.avatar }
    : require('../../../assets/logo.jpg');

  const applyUpdate = (updates) => {
    setCurrentUser((prev) => {
      const updated = { ...prev, ...updates };
      if (onUpdate) {
        onUpdate(updated);
      }
      return updated;
    });
  };

  const confirmRoleChange = (role) => {
    if (role === currentUser.role) {
      setRoleMenuOpen(false);
      return;
    }

    Alert.alert(
      'Assign Role',
      `Assign ${role} role to ${currentUser.username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            applyUpdate({ role });
            setRoleMenuOpen(false);
          },
        },
      ],
      { cancelable: true }
    );
  };

  const confirmActiveChange = (nextValue) => {
    if (nextValue === currentUser.active) {
      return;
    }

    Alert.alert(
      nextValue ? 'Activate Account' : 'Deactivate Account',
      `Are you sure you want to ${nextValue ? 'activate' : 'deactivate'} ${currentUser.username}'s account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: nextValue ? 'Activate' : 'Deactivate',
          style: nextValue ? 'default' : 'destructive',
          onPress: () => applyUpdate({ active: nextValue }),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>

        {/* BACK BUTTON */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.canGoBack() && navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={20} color="#0F172A" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>

        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.avatarWrapper}>
            <Image source={avatarSource} style={styles.avatar} resizeMode="cover" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>{currentUser.username}</Text>
            <Text style={styles.subtitle}>User ID: {currentUser.user_id}</Text>
            <View
              style={[
                styles.statusBadge,
                currentUser.active ? styles.statusBadgeActive : styles.statusBadgeInactive,
              ]}
            >
              <Ionicons
                name={currentUser.active ? 'checkmark-circle' : 'pause'}
                size={14}
                color={currentUser.active ? '#14532D' : '#7F1D1D'}
              />
              <Text
                style={[
                  styles.statusBadgeText,
                  currentUser.active ? styles.statusBadgeTextActive : styles.statusBadgeTextInactive,
                ]}
              >
                {currentUser.active ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
        </View>

        {/* Contact Details */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Contact Details</Text>
          <DetailRow label="Email" value={currentUser.email} />
          <DetailRow label="Phone" value={currentUser.phone} />
          <DetailRow label="Created" value={formatDate(currentUser.created_at)} />
        </View>

        {/* Controls */}
        <View style={styles.controlsCard}>
          <Text style={styles.sectionTitle}>Account Controls</Text>

          <View style={styles.controlRow}>
            <Text style={styles.controlLabel}>Active Status</Text>
            <View style={styles.toggleGroup}>
              <Text
                style={[
                  styles.statusText,
                  currentUser.active ? styles.statusActive : styles.statusInactive,
                ]}
              >
                {currentUser.active ? 'Active' : 'Inactive'}
              </Text>
              <Switch
                value={currentUser.active}
                onValueChange={confirmActiveChange}
                trackColor={{ false: '#D0D7DD', true: '#3AA272' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.controlRow}>
            <Text style={styles.controlLabel}>Assign Role</Text>
            <TouchableOpacity
              style={styles.roleSelect}
              onPress={() => setRoleMenuOpen((prev) => !prev)}
              activeOpacity={0.7}
            >
              <Text style={styles.roleSelectText}>{currentUser.role}</Text>
              <Ionicons
                name={roleMenuOpen ? 'chevron-up' : 'chevron-down'}
                size={16}
                color="#1F2A37"
              />
            </TouchableOpacity>
          </View>

          {roleMenuOpen && (
            <View style={styles.roleDropdown}>
              {ROLE_OPTIONS.map((role) => (
                <TouchableOpacity
                  key={role}
                  style={styles.roleOption}
                  onPress={() => confirmRoleChange(role)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.roleOptionText}>{role}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F9F4',
    padding: 20,
  },
  content: {
    paddingBottom: 40,
    gap: 20,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 0,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },

  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  avatarWrapper: {
    alignSelf: 'center',
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  headerText: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2A37',
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  statusBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusBadgeActive: {
    backgroundColor: '#DCFCE7',
  },
  statusBadgeInactive: {
    backgroundColor: '#FEE2E2',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  statusBadgeTextActive: {
    color: '#166534',
  },
  statusBadgeTextInactive: {
    color: '#7F1D1D',
  },

  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },

  controlsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: '#DBE2F0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  detailLabel: {
    fontSize: 13,
    color: '#475569',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    maxWidth: '60%',
    textAlign: 'right',
  },

  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  toggleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statusActive: {
    color: '#3AA272',
  },
  statusInactive: {
    color: '#B03A2E',
  },

  roleSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#EEF2F7',
  },
  roleSelectText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },

  roleDropdown: {
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D4DBE3',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  roleOption: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  roleOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1F2937',
  },

  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },
});
