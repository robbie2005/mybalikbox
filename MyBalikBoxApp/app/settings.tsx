import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function SettingsScreen() {
  return (
    <LinearGradient colors={['#A9D0DA', '#F9FBFA']} style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={16} color="#FFFFFF" />
        </Pressable>

        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.profileCard}>
        <Image
          source={{
            uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=500',
          }}
          style={styles.avatar}
          contentFit="cover"
        />

        <View style={styles.profileText}>
          <Text style={styles.name}>Mikey Bustos</Text>
          <Text style={styles.email}>mikeybustos@gmail.com</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Other Settings</Text>

      <View style={styles.card}>
        <SettingsRow title="Account Information" onPress={() => router.push('/account-information')} />        <Divider />
        <SettingsRow title="Password" onPress={() => router.push('/password-page')} />
      </View>

      <View style={styles.card}>
        <SettingsRow title="About application" onPress={() => router.push('/about-application')} />
        <Divider />
        <SettingsRow title="Help/FAQ" onPress={() => router.push('/help-faq')} />        <Divider />
        <Pressable style={styles.row} onPress={() => {}}>
          <Text style={styles.deleteText}>Delete Account</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

function SettingsRow({ title, onPress }: { title: string; onPress?: () => void }) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Text style={styles.rowText}>{title}</Text>
      <MaterialIcons name="arrow-forward" size={24} color="#9A9A9A" />
    </Pressable>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 70,
  },
  header: {
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    width: 29,
    height: 29,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#242833',
  },
  profileCard: {
    marginTop: 37,
    height: 110,
    borderRadius: 31,
    backgroundColor: '#FFFDF9',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 25,
  },
  avatar: {
    width: 65,
    height: 65,
    borderRadius: 43,
    marginRight: 24,
  },
  profileText: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    color: '#2B2F38',
  },
  email: {
    marginTop: 4,
    fontSize: 11,
    color: '#2B2F38',
  },
  sectionTitle: {
    marginTop: 35,
    marginLeft: 43,
    marginBottom: 12,
    fontSize: 12.5,
    fontWeight: '800',
    color: '#666666',
  },
  card: {
    borderRadius: 19,
    backgroundColor: '#FFFDF9',
    overflow: 'hidden',
    marginBottom: 20,
  },
  row: {
    height: 45,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 55,
    paddingRight: 15,
  },
  rowText: {
    fontSize: 12,
    color: '#2B2F38',
  },
  deleteText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2B2F38',
  },
  divider: {
    height: 1,
    backgroundColor: '#D1CDC6',
  },
});