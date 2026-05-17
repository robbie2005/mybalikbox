import { Tabs } from 'expo-router';
import React from 'react';

import { CustomTabBar } from '@/components/checklist/custom-tab-bar';

/** Open the Shared Checklist tab first while this flow is the focus */
export const unstable_settings = {
  initialRouteName: 'checklist',
};

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        lazy: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="checklist"
        options={{
          title: 'Checklist',
        }}
      />
      <Tabs.Screen
        name="add-item"
        options={{
          title: 'Add Item',
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Feed',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
      <Tabs.Screen
        name="find-dropoff"
        options={{
          href: null,
          title: 'Find Dropoff',
        }}
      />
      <Tabs.Screen
        name="dropoff-results"
        options={{
          href: null,
          title: 'Dropoff Results',
        }}
      />
    </Tabs>
  );
}
