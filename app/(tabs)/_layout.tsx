import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';

import { fonts } from '@/constants/theme';
import { useTheme } from '@/lib/theme';

export default function TabLayout() {
  const { palette: c, scheme } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.textMuted,
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11 },
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 18,
          height: 64,
          borderRadius: 28,
          backgroundColor: Platform.OS === 'web' ? c.glassStrong : 'transparent',
          borderTopWidth: 0,
          paddingBottom: 8,
          paddingTop: 8,
          shadowColor: c.shadow,
          shadowOpacity: 0.2,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 8 },
          elevation: 8,
          overflow: 'hidden',
        },
        tabBarBackground: () =>
          Platform.OS === 'web' ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: c.glassStrong }]} />
          ) : (
            <BlurView intensity={55} tint={scheme} style={StyleSheet.absoluteFill} />
          ),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
