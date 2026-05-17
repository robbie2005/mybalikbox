import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FriendProfileScreen() {
  return (
    <LinearGradient colors={['#F4C76D', '#FFFDF9']} style={styles.gradient}>
      <SafeAreaView style={styles.container}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back-ios-new" size={22} color="#FFFFFF" />
        </Pressable>

        <Pressable style={styles.menuButton}>
          <MaterialIcons name="menu" size={25} color="#242833" />
        </Pressable>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=300',
            }}
            style={styles.avatar}
            contentFit="cover"
          />

          <Text style={styles.name}>Boonie Green</Text>

          <View style={styles.iconRow}>
            <MaterialIcons name="chat-bubble-outline" size={18} color="#242833" />
            <MaterialIcons name="contacts" size={18} color="#242833" />
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>2</Text>
              <Text style={styles.statLabel}>BOXES</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statNumber}>10</Text>
              <Text style={styles.statLabel}>CONNECTIONS</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statNumber}>20</Text>
              <Text style={styles.statLabel}>POSTS</Text>
            </View>
          </View>

          <View style={styles.grid}>
            {Array.from({ length: 12 }).map((_, index) => (
              <View key={index} style={styles.gridItem} />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 22,
  },
  backButton: {
    position: 'absolute',
    top: 12,
    left: 22,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  menuButton: {
    position: 'absolute',
    top: 25,
    right: 26,
    zIndex: 20,
  },
  content: {
    alignItems: 'center',
    paddingTop: 62,
    paddingBottom: 130,
  },
  avatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
  },
  name: {
    marginTop: 18,
    fontSize: 17,
    color: '#242833',
  },
  iconRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 26,
  },
  statsRow: {
    marginTop: 25,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 14,
    color: '#242833',
  },
  statLabel: {
    marginTop: 3,
    fontSize: 11,
    color: '#9A9085',
  },
  grid: {
    marginTop: 28,
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 9,
  },
  gridItem: {
    width: '31.5%',
    aspectRatio: 1,
    backgroundColor: '#D8D8D8',
  },
});