import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function ProfileScreen() {
  return (
    <LinearGradient colors={['#A9D0DA', '#F9FBFA']} style={styles.container}>
      <Pressable
        style={styles.settingsButton}
        onPress={() => router.push('/settings')}
      >
      <Image
        source={require('@/assets/images/image.png')}
        style={styles.settingsIcon}
        contentFit="contain"
        />
      </Pressable>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Image
          source={{
            uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=500',
          }}
          style={styles.avatar}
          contentFit="cover"
        />

        <Text style={styles.name}>Mikey Bustos</Text>
        <Text style={styles.username}>@mikey_bustos</Text>

        <Text style={styles.bio}>
          Love bundling up, eating halo-halo, and keeping{'\n'}
          family close across miles.
        </Text>

        <View style={styles.locationRow}>
          <MaterialIcons name="location-pin" size={15} color="#2C2C2C" />
          <Text style={styles.location}>New York, NY</Text>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>2</Text>
            <Text style={styles.statLabel}>BOXES</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.statBox}>
            <Text style={styles.statNumber}>20</Text>
            <Text style={styles.statLabel}>FRIENDS</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.statBox}>
            <Text style={styles.statNumber}>15</Text>
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
    paddingHorizontal: 35,
    paddingTop: 65,
    paddingBottom: 150,
  },
  settingsIcon: {
  width: 32,
  height: 32,
  },
  settingsButton: {
    position: 'absolute',
    top: 33,
    right: 35,
    zIndex: 10,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 74.5,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
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
    marginTop: 21,
    width: '110%',
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
    marginTop: 10,
    width: '110%',
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