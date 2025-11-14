// src/navigation/RootNavigator.js
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ROOT_TABS, TAB_HOME, TAB_IDENTIFY, ADMIN_ROOT, ADMIN_ENDANGERED, ADMIN_USER_DETAIL, ADMIN_IOT, ADMIN_IOT_DETAIL, ADMIN_IOT_ANALYTICS, ADMIN_FLAG_REVIEW, ADMIN_AGENT_CHAT } from './routes';
import { useAuth } from '../context/AuthContext'; 

// --- Import all your screens (unchanged) ---
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import IdentifyScreen from '../screens/IdentifyScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AdminEndangeredListScreen from '../screens/admin/AdminEndangeredListScreen';
import AdminUserDetailScreen from '../screens/admin/AdminUserDetailScreen';
import AdminIotScreen from '../screens/admin/AdminIotScreen';
import AdminIotDetailScreen from '../screens/admin/AdminIotDetailScreen';
import AdminIotAnalyticsScreen from '../screens/admin/AdminIotAnalyticsScreen';
import AdminFlagReviewScreen from '../screens/admin/AdminFlagReviewScreen';
import CameraScreen from '../screens/CameraScreen';
import PreviewScreen from '../screens/PreviewScreen';
import ResultScreen from '../screens/ResultScreen';
import FlagUnsureScreen from '../screens/FlagUnsureScreen';
import ObservationDetailScreen from '../screens/ObservationDetailScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import SignUpScreen from '../screens/SignUpScreen';
import LoginScreen from '../screens/LoginScreen';
import MFAScreen from '../screens/MFAScreen';
import HeatmapScreen from '../screens/HeatmapScreen';
import AdminNavigator from './AdminNavigator';
import AdminAgentChatScreen from '../screens/admin/AdminAgentChatScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// (SCAN_SIZE constant fix from your last turn)
const BAR_HEIGHT = 96;
const SCAN_SIZE = 72;

function Tabs() {
  // (Tabs function is unchanged)
  return (
    <Tab.Navigator
      initialRouteName={TAB_HOME}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: '#6DAF7A',
        tabBarInactiveTintColor: '#9AA3A7',
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tab.Screen
        name={TAB_HOME}
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="home-outline" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="search" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name={TAB_IDENTIFY}
        component={IdentifyScreen}
        options={{
          tabBarIcon: () => null,
          tabBarButton: (props) => (
            <TouchableOpacity
              {...props}
              activeOpacity={0.85}
              style={styles.scanTabButton}
              accessibilityRole="button"
              accessibilityLabel="Identify"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <View style={styles.scanCircle}>
                <Ionicons name="scan" size={30} color="#fff" />
              </View>
            </TouchableOpacity>
          ),
        }}
      />
      <Tab.Screen
        name="Heatmap"
        component={HeatmapScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="map" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-outline" size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { user } = useAuth();
  
  // ⬇️ *** THIS IS THE FIX *** ⬇️
  // We now check if the role is 'admin' (1) OR 'researcher' (2)
  const isPrivilegedUser = user && (user.role_id === 1 || user.role_id === 2);

  return (
    <Stack.Navigator 
      screenOptions={{ headerShown: false }}
    >
      {user ? (
        // === USER IS LOGGED IN ===
        
        // ⬇️ *** THIS IS THE FIX *** ⬇️
        // We check against our new 'isPrivilegedUser' variable
        isPrivilegedUser ? (
          // --- ADMIN / RESEARCHER STACK GROUP ---
          <Stack.Group>
            <Stack.Screen name={ADMIN_ROOT} component={AdminNavigator} />
            <Stack.Screen name={ROOT_TABS} component={Tabs} />
            {/* ... all other screens ... */}
            <Stack.Screen name={ADMIN_ENDANGERED} component={AdminEndangeredListScreen} />
            <Stack.Screen name={ADMIN_IOT} component={AdminIotScreen} />
            <Stack.Screen name={ADMIN_IOT_DETAIL} component={AdminIotDetailScreen} />
            <Stack.Screen name={ADMIN_IOT_ANALYTICS} component={AdminIotAnalyticsScreen} />
            <Stack.Screen name={ADMIN_FLAG_REVIEW} component={AdminFlagReviewScreen} />
            <Stack.Screen name={ADMIN_USER_DETAIL} component={AdminUserDetailScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name={ADMIN_AGENT_CHAT} component={AdminAgentChatScreen} />
            <Stack.Screen name="Camera" component={CameraScreen} />
            <Stack.Screen name="Preview" component={PreviewScreen} />
            <Stack.Screen name="Result" component={ResultScreen} />
            <Stack.Screen name="FlagUnsure" component={FlagUnsureScreen} />
            <Stack.Screen name="ObservationDetail" component={ObservationDetailScreen} />
          </Stack.Group>
        ) : (
          // --- PUBLIC USER STACK GROUP ---
          <Stack.Group>
            <Stack.Screen name={ROOT_TABS} component={Tabs} />
            <Stack.Screen name={ADMIN_ROOT} component={AdminNavigator} />
            {/* ... all other screens ... */}
            <Stack.Screen name={ADMIN_ENDANGERED} component={AdminEndangeredListScreen} />
            <Stack.Screen name={ADMIN_IOT} component={AdminIotScreen} />
            <Stack.Screen name={ADMIN_IOT_DETAIL} component={AdminIotDetailScreen} />
            <Stack.Screen name={ADMIN_IOT_ANALYTICS} component={AdminIotAnalyticsScreen} />
            <Stack.Screen name={ADMIN_FLAG_REVIEW} component={AdminFlagReviewScreen} />
            <Stack.Screen name={ADMIN_USER_DETAIL} component={AdminUserDetailScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name={ADMIN_AGENT_CHAT} component={AdminAgentChatScreen} />
            <Stack.Screen name="Camera" component={CameraScreen} />
            <Stack.Screen name="Preview" component={PreviewScreen} />
            <Stack.Screen name="Result" component={ResultScreen} />
            <Stack.Screen name="FlagUnsure" component={FlagUnsureScreen} />
            <Stack.Screen name="ObservationDetail" component={ObservationDetailScreen} />
          </Stack.Group>
        )
      ) : (
        // === NO USER LOGGED IN ===
        <Stack.Group>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="MFA" component={MFAScreen} />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
}

// (Styles are correct and unchanged)
const styles = StyleSheet.create({
  tabBar: {
    height: 100,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingBottom: Platform.OS === 'ios' ? 30 : 22,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
  },
  tabItem: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanTabButton: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 10,
  },
  scanCircle: {
    width: SCAN_SIZE,
    height: SCAN_SIZE,
    borderRadius: SCAN_SIZE / 2,
    backgroundColor: '#6DAF7A',
    justifyContent: 'center',
    alignItems: 'center',
  },
});