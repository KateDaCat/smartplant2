import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';

// ⬇️ *** IMPORT useAuth (CRITICAL) *** ⬇️
import { useAuth } from '../context/AuthContext';

import AdminUsersScreen from '../screens/admin/AdminUsersScreen';
import AdminFlagUnsureScreen from '../screens/admin/AdminFlagUnsureScreen';
import AdminHeatmapScreen from '../screens/admin/AdminHeatmapScreen';
import AdminActivityScreen from '../screens/admin/AdminActivityScreen';
import AdminIotScreen from '../screens/admin/AdminIotScreen';
import {
  ADMIN_USERS,
  ADMIN_FLAG_UNSURE,
  ADMIN_HEATMAP,
  ADMIN_IOT,
  ADMIN_ACTIVITY,
} from './routes';
import AdminSupportAgent from '../screens/admin/components/AdminSupportAgent';

const Drawer = createDrawerNavigator();

// (AdminDrawerContent is unchanged and correct from our last fix)
function AdminDrawerContent(props) {
  const { user, logout } = useAuth();
  
  // Handle case where user might be null briefly
  const safeUser = user || { username: 'Admin', role_name: 'Admin', email: '' };

  const adminInitials = safeUser.username
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2) || 'AD';

  const handleLogout = () => {
    logout();
  };

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerScrollContainer}>
      <View style={styles.profileContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{adminInitials}</Text>
        </View>
        <Text style={styles.profileName}>{safeUser.username}</Text>
        <Text style={styles.profileRole}>{safeUser.role_name}</Text>
        <Text style={styles.profileEmail}>{safeUser.email}</Text>
        
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7} accessibilityRole="button">
          <Ionicons name="log-out-outline" size={18} color="#1E2D3D" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

        <View style={styles.drawerListWrapper}>
          <DrawerItemList {...props} />
        </View>

      <View style={styles.drawerFooter}>
        <Text style={styles.footerText}>SmartPlant Admin Console</Text>
        <Text style={styles.footerSubtext}>Version 1.0.0</Text>
      </View>
    </DrawerContentScrollView>
  );
}

// (List of screens with 'adminOnly' flag is unchanged and correct)
const drawerScreens = [
  {
    name: ADMIN_ACTIVITY,
    label: 'Activity',
    component: AdminActivityScreen,
    adminOnly: false, // Everyone with access can see this
  },
  {
    name: ADMIN_USERS,
    label: 'Users',
    component: AdminUsersScreen,
    adminOnly: true, // 👈 *** SET TO TRUE ***
  },
  {
    name: ADMIN_FLAG_UNSURE,
    label: 'Flag Unsure',
    component: AdminFlagUnsureScreen,
    adminOnly: false, // Everyone with access can see this
  },
  {
    name: ADMIN_HEATMAP,
    label: 'Heatmap',
    component: AdminHeatmapScreen,
    adminOnly: false, // Everyone with access can see this
  },
  {
    name: ADMIN_IOT,
    label: 'IoT Monitoring',
    component: AdminIotScreen,
    adminOnly: false, // Everyone with access can see this
  },
];

export default function AdminNavigator() {
  const { user } = useAuth();

  // (Filtering logic is unchanged and correct)
  const filteredScreens = drawerScreens.filter(screen => {
    if (!screen.adminOnly) {
      return true;
    }
    return user && user.role_id === 1;
  });

  return (
    <Drawer.Navigator
      // ⬇️ *** THIS IS THE FIX *** ⬇️
      // We set the initial route to 'Activity', which all
      // privileged users (admin + researcher) can see.
      initialRouteName={ADMIN_ACTIVITY}
      
      drawerContent={(props) => <AdminDrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTitleStyle: { color: '#1E2D3D', fontSize: 18, fontWeight: '700' },
        headerTintColor: '#1E2D3D',
        headerShadowVisible: false,
        sceneContainerStyle: { backgroundColor: '#FFFFFF' },
        drawerType: 'front',
          drawerStyle: { width: 256, backgroundColor: '#FFFFFF', paddingVertical: 0 },
          drawerInactiveTintColor: '#51606C',
          drawerActiveTintColor: '#FFFFFF',
          drawerActiveBackgroundColor: '#1E88E5',
          drawerItemStyle: { marginVertical: 0, borderRadius: 0 },
          drawerContentContainerStyle: { paddingLeft: 0, paddingRight: 0 },
          drawerLabelStyle: { fontSize: 15, fontWeight: '500', marginLeft: -12 },
      }}
    >
        {/* We map over the correct 'filteredScreens' list */}
        {filteredScreens.map((screen) => (
          <Drawer.Screen
            key={screen.name}
            name={screen.name}
            options={{
              title: screen.label,
            }}
          >
            {(props) => (
              <View style={{ flex: 1 }}>
                <screen.component {...props} />
                <AdminSupportAgent />
              </View>
            )}
          </Drawer.Screen>
        ))}
    </Drawer.Navigator>
  );
}

// (Styles are unchanged)
const styles = StyleSheet.create({
  drawerScrollContainer: {
    flexGrow: 1,
    paddingTop: 0,
    backgroundColor: '#FFFFFF',
  },
  profileContainer: {
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F5',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1E88E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E2D3D',
  },
  profileRole: {
    marginTop: 4,
    fontSize: 13,
    color: '#71808E',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  profileEmail: {
    marginTop: 6,
    fontSize: 12,
    color: '#8794A0',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#EEF2F8',
    gap: 8,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E2D3D',
  },
  drawerListWrapper: {
    flex: 1,
    paddingTop: 16,
    paddingHorizontal: 0,
  },
  drawerFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#EEF2F5',
    backgroundColor: '#FFFFFF',
  },
  footerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E2D3D',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  footerSubtext: {
    marginTop: 4,
    fontSize: 12,
    color: '#51606C',
  },
});