import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const users = [
  {
    id: 1,
    name: 'Roberta Casas',
    subtitle: 'name@example.com',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200',
  },
  {
    id: 2,
    name: 'Thomas Lean',
    subtitle: 'Helper text here',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200',
  },
  {
    id: 3,
    name: 'Lana Byrd',
    subtitle: 'Helper text here',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200',
  },
];

type User = {
  id: number;
  name: string;
  subtitle: string;
  image: string;
};

export default function AddFriendsScreen() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  return (
    <LinearGradient colors={['#F4C76D', '#FFFDF9']} style={styles.gradient}>
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Add Friends</Text>

        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={18} color="#A4A7AE" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Users"
            placeholderTextColor="#8F939B"
          />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Users</Text>
              <Text style={styles.viewAll}>View all</Text>
            </View>

            {users.map((user, index) => (
              <View key={user.id}>
                <UserRow user={user} onRequest={() => setSelectedUser(user)} />
                {index !== users.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </ScrollView>

        <Modal transparent visible={selectedUser !== null} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.popup}>
              <View style={styles.popupIconCircle}>
                <MaterialIcons name="person-add-alt-1" size={34} color="#242833" />
              </View>

              <Text style={styles.popupTitle}>Send Friend Request?</Text>

              <Text style={styles.popupText}>
                Are you sure you want to request{'\n'}
                <Text style={styles.popupBold}>{selectedUser?.name}</Text> to be your friend?
              </Text>

              <View style={styles.popupButtons}>
                <Pressable style={styles.cancelButton} onPress={() => setSelectedUser(null)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>

                <Pressable style={styles.requestButton} onPress={() => setSelectedUser(null)}>
                  <Text style={styles.requestText}>Request</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

function UserRow({ user, onRequest }: { user: User; onRequest: () => void }) {
  return (
    <View style={styles.userRow}>
      <Image source={{ uri: user.image }} style={styles.userImage} contentFit="cover" />

      <View style={styles.userInfo}>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.helperText}>{user.subtitle}</Text>
      </View>

      <Pressable onPress={onRequest}>
        <MaterialIcons name="person-add-alt-1" size={21} color="#3E4650" />
      </Pressable>
    </View>
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
  title: {
    marginTop: 20,
    marginBottom: 26,
    textAlign: 'center',
    fontSize: 25,
    fontWeight: '500',
    color: '#242833',
  },
  searchBox: {
    height: 41,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: '#242833',
  },
  scrollContent: {
    paddingTop: 30,
    paddingBottom: 130,
  },
  card: {
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    paddingTop: 25,
    paddingHorizontal: 25,
    paddingBottom: 28,
  },
  cardHeader: {
    marginBottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#3E4650',
  },
  viewAll: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4F6DFF',
  },
  userRow: {
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userImage: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3E4650',
  },
  helperText: {
    marginTop: 2,
    fontSize: 12,
    color: '#687179',
  },
  divider: {
    height: 1,
    backgroundColor: '#E4E5E8',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  popup: {
    width: '100%',
    borderRadius: 18,
    backgroundColor: '#FFFDF9',
    alignItems: 'center',
    paddingTop: 26,
    paddingBottom: 26,
    paddingHorizontal: 24,
  },
  popupIconCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#FFF3D8',
    borderWidth: 2,
    borderColor: '#F3D29A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupTitle: {
    marginTop: 22,
    fontSize: 22,
    fontWeight: '800',
    color: '#2B2B2B',
  },
  popupText: {
    marginTop: 13,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    color: '#9A908A',
  },
  popupBold: {
    fontWeight: '800',
    color: '#2B2B2B',
  },
  popupButtons: {
    marginTop: 28,
    flexDirection: 'row',
    gap: 14,
  },
  cancelButton: {
    width: 135,
    height: 50,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#E8D7BE',
    backgroundColor: '#FFFDF9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestButton: {
    width: 135,
    height: 50,
    borderRadius: 13,
    backgroundColor: '#A9C8D2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2B2B2B',
  },
  requestText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});