import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ProfileAvatar } from '@/components/profile-avatar';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChecklistDesign } from '@/constants/checklist-design';
import {
  fetchCurrentProfile,
  fetchProfileStats,
  type ProfileStats,
  type UserProfile,
} from '@/services/profile';

const AVATAR_SIZE = 128;
const AVATAR_BORDER = 3;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<ProfileStats>({ boxes: 0, friends: 0, posts: 0 });

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const current = await fetchCurrentProfile();
      if (!current) {
        setProfile(null);
        return;
      }
      setProfile(current);
      const profileStats = await fetchProfileStats(current.id);
      setStats(profileStats);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile]),
  );

  return (
    <LinearGradient
      colors={[ChecklistDesign.gradientTop, ChecklistDesign.gradientBottom]}
      style={styles.container}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 12, paddingBottom: 150 + insets.bottom },
        ]}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerSpacer} />
          <Pressable
            style={styles.settingsButton}
            onPress={() => router.push('/settings')}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Open settings"
          >
            <Image
              source={require('@/assets/images/image.png')}
              style={styles.settingsIcon}
              contentFit="contain"
            />
          </Pressable>
        </View>

        {loading && !profile ? (
          <ActivityIndicator style={styles.loader} size="large" color="#5F6670" />
        ) : (
          <>
            <Pressable
              style={styles.profileBlock}
              onPress={() => router.push('/edit-bio')}
              accessibilityRole="button"
              accessibilityLabel="Edit profile"
            >
              <View style={styles.avatarBorder}>
                <ProfileAvatar uri={profile?.avatarUrl} size={AVATAR_SIZE} />
              </View>

              <Text style={styles.name}>{profile?.displayName ?? 'User'}</Text>
              <Text style={styles.username}>{profile?.handle ?? '@username'}</Text>

              <Text style={styles.bio}>{profile?.bio}</Text>

              <View style={styles.locationRow}>
                <MaterialIcons name="location-pin" size={15} color="#2C2C2C" />
                <Text style={styles.location}>{profile?.location ?? 'Irvine, CA'}</Text>
              </View>
            </Pressable>

            <View style={styles.statsCard}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{stats.boxes}</Text>
                <Text style={styles.statLabel}>BOXES</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{stats.friends}</Text>
                <Text style={styles.statLabel}>FRIENDS</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{stats.posts}</Text>
                <Text style={styles.statLabel}>POSTS</Text>
              </View>
            </View>

            <Pressable style={styles.manageButton} onPress={() => {}}>
              <Text style={styles.manageButtonText}>Manage Friends</Text>
            </Pressable>

            <View style={styles.grid}>
              {Array.from({ length: 9 }).map((_, index) => (
                <View key={index} style={styles.gridItem} />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 0,
  },
  headerSpacer: {
    flex: 1,
  },
  loader: {
    marginTop: 80,
  },
  settingsIcon: {
    width: 26,
    height: 26,
  },
  settingsButton: {
    padding: 4,
  },
  avatarBorder: {
    width: AVATAR_SIZE + AVATAR_BORDER * 2,
    height: AVATAR_SIZE + AVATAR_BORDER * 2,
    borderRadius: (AVATAR_SIZE + AVATAR_BORDER * 2) / 2,
    borderWidth: AVATAR_BORDER,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  profileBlock: {
    alignItems: 'center',
    width: '100%',
    marginTop: 4,
  },
  name: {
    marginTop: 12,
    fontSize: 17,
    fontWeight: '400',
    color: '#2B2B2B',
  },
  username: {
    marginTop: 2,
    fontSize: 9,
    fontWeight: '600',
    color: '#5F6670',
  },
  bio: {
    marginTop: 7,
    fontSize: 10,
    lineHeight: 13,
    textAlign: 'center',
    color: '#242424',
  },
  locationRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    marginLeft: 3,
    fontSize: 12,
    color: '#2C2C2C',
  },
  statsCard: {
    alignSelf: 'stretch',
    marginTop: 21,
    height: 53,
    borderRadius: 21,
    backgroundColor: '#FFF9EF',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#557985',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 7 },
    elevation: 5,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 13,
    fontWeight: '800',
    color: '#252525',
  },
  statLabel: {
    marginTop: 3,
    fontSize: 12,
    color: '#91877F',
  },
  divider: {
    width: 1,
    height: 41,
    backgroundColor: '#E7C9A8',
  },
  manageButton: {
    alignSelf: 'stretch',
    marginTop: 10,
    height: 32,
    borderRadius: 14,
    backgroundColor: '#94B8C3',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#557985',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 7 },
    elevation: 5,
  },
  manageButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  grid: {
    marginTop: 32,
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 13,
  },
  gridItem: {
    width: '31.5%',
    aspectRatio: 1,
    backgroundColor: '#D8D8D8',
  },
});
