import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const initialPendingRequests = [
  {
    id: 1,
    name: 'Boonie Green',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200',
  },
  {
    id: 2,
    name: 'Jese Leos',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200',
  },
];

const initialFriends = [
  {
    id: 3,
    name: 'Thomas Lean',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200',
  },
  {
    id: 4,
    name: 'Lana Byrd',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200',
  },
];

type Friend = {
  id: number;
  name: string;
  image: string;
};

export default function ManageFriendsScreen() {
  const [pendingRequests, setPendingRequests] = useState(initialPendingRequests);
  const [friends, setFriends] = useState(initialFriends);
  const [selectedRequest, setSelectedRequest] = useState<Friend | null>(null);

  function declineRequest(id: number) {
    setPendingRequests((current) => current.filter((request) => request.id !== id));
  }

  function acceptRequest() {
    if (!selectedRequest) return;

    setFriends((current) => [...current, selectedRequest]);
    setPendingRequests((current) =>
      current.filter((request) => request.id !== selectedRequest.id)
    );
    setSelectedRequest(null);
  }

  return (
    <LinearGradient colors={['#F4C76D', '#FFFDF9']} style={styles.gradient}>
      <SafeAreaView style={styles.container}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back-ios-new" size={22} color="#FFFFFF" />
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.title}>My Friends</Text>

          <Pressable onPress={() => router.push('/add-friends' as any)}>
            <MaterialIcons name="person-add-alt-1" size={27} color="#242833" />
          </Pressable>
        </View>

        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={18} color="#A4A7AE" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Friends"
            placeholderTextColor="#8F939B"
          />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {pendingRequests.length > 0 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Pending Requests</Text>
                <Text style={styles.pendingCount}>({pendingRequests.length})</Text>
              </View>

              {pendingRequests.map((request, index) => (
                <View key={request.id}>
                  <FriendRow
                    name={request.name}
                    image={request.image}
                    pending
                    onAccept={() => setSelectedRequest(request)}
                    onRemove={() => declineRequest(request.id)}
                  />
                  {index !== pendingRequests.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          )}

          <View style={styles.cardLarge}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Friends</Text>
              <Pressable onPress={() => {}}>
                <Text style={styles.viewAll}>View all</Text>
              </Pressable>
            </View>

            {friends.map((friend, index) => (
              <View key={friend.id}>
                <FriendRow
                  name={friend.name}
                  image={friend.image}
                  onRemove={() =>
                    setFriends((current) => current.filter((item) => item.id !== friend.id))
                  }
                />
                {index !== friends.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </ScrollView>

        <Modal transparent visible={selectedRequest !== null} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.popup}>
              <View style={styles.popupIconCircle}>
                <MaterialIcons name="person-add-alt-1" size={34} color="#242833" />
              </View>

              <Text style={styles.popupTitle}>Accept Friend Request?</Text>

              <Text style={styles.popupText}>
                Are you sure you want to accept{'\n'}
                <Text style={styles.popupBold}>{selectedRequest?.name}</Text> as your friend?
              </Text>

              <View style={styles.popupButtons}>
                <Pressable style={styles.cancelButton} onPress={() => setSelectedRequest(null)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>

                <Pressable style={styles.acceptButton} onPress={acceptRequest}>
                  <Text style={styles.acceptText}>Accept</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

function FriendRow({
  name,
  image,
  pending = false,
  onAccept,
  onRemove,
}: {
  name: string;
  image: string;
  pending?: boolean;
  onAccept?: () => void;
  onRemove?: () => void;
}) {
  return (
    <View style={styles.friendRow}>
      <Image source={{ uri: image }} style={styles.friendImage} contentFit="cover" />

      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{name}</Text>
        <Text style={styles.helperText}>Helper text here</Text>
      </View>

      {pending ? (
        <View style={styles.pendingActions}>
          <Pressable onPress={onAccept}>
            <MaterialIcons name="check" size={18} color="#4D5963" />
          </Pressable>

          <Pressable onPress={onRemove}>
            <MaterialIcons name="close" size={17} color="#A5A8AD" />
          </Pressable>
        </View>
      ) : (
        <Pressable onPress={onRemove}>
          <MaterialIcons name="close" size={17} color="#A5A8AD" />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    width: 30,
    height: 30,
    borderRadius: 27,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  header: {
    marginTop: 70,
    marginBottom: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  title: {
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
    paddingTop: 23,
    paddingBottom: 130,
  },
  card: {
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    paddingTop: 25,
    paddingHorizontal: 25,
    paddingBottom: 6,
    marginBottom: 38,
  },
  cardLarge: {
    minHeight: 320,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    paddingTop: 25,
    paddingHorizontal: 25,
    paddingBottom: 20,
  },
  cardHeader: {
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#3E4650',
  },
  pendingCount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4F6DFF',
  },
  viewAll: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4F6DFF',
  },
  friendRow: {
    height: 62,
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendImage: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  friendInfo: {
    flex: 1,
    marginLeft: 12,
  },
  friendName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3E4650',
  },
  helperText: {
    marginTop: 2,
    fontSize: 12,
    color: '#687179',
  },
  pendingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
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
  acceptButton: {
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
  acceptText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});