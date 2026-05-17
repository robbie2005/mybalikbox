import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Friend = {
  id: number;
  name: string;
  subtitle: string;
  image: string;
};

const initialPending: Friend[] = [
  {
    id: 1,
    name: 'Boonie Green',
    subtitle: 'Helper text here',
    image:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200',
  },
  {
    id: 2,
    name: 'Jese Leos',
    subtitle: 'Helper text here',
    image:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200',
  },
];

const friends: Friend[] = [
  {
    id: 3,
    name: 'Thomas Lean',
    subtitle: 'Helper text here',
    image:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200',
  },
  {
    id: 4,
    name: 'Lana Byrd',
    subtitle: 'Helper text here',
    image:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200',
  },
];

export default function ManageFriendsScreen() {
  const [pendingRequests, setPendingRequests] =
    useState(initialPending);

  const [selectedFriend, setSelectedFriend] =
    useState<Friend | null>(null);

  const removePending = (id: number) => {
    setPendingRequests((prev) =>
      prev.filter((friend) => friend.id !== id)
    );
  };

  return (
    <LinearGradient
      colors={['#F4C76D', '#FFFDF9']}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons
            name="arrow-back-ios-new"
            size={22}
            color="#FFFFFF"
          />
        </Pressable>

        <View style={styles.headerRow}>
          <Text style={styles.title}>My Friends</Text>

          <Pressable
            onPress={() => router.push('/add-friends' as any)}
            hitSlop={10}
          >
            <MaterialIcons
              name="person-add-alt-1"
              size={27}
              color="#242833"
            />
          </Pressable>
        </View>

        <View style={styles.searchBox}>
          <MaterialIcons
            name="search"
            size={18}
            color="#A4A7AE"
          />

          <TextInput
            style={styles.searchInput}
            placeholder="Search Friends"
            placeholderTextColor="#8F939B"
          />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {pendingRequests.length > 0 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>
                  Pending Requests
                </Text>

                <Text style={styles.requestCount}>
                  ({pendingRequests.length})
                </Text>
              </View>

              {pendingRequests.map((friend, index) => (
                <View key={friend.id}>
                  <FriendRow
                    friend={friend}
                    pending
                    onAccept={() => setSelectedFriend(friend)}
                    onRemove={() => removePending(friend.id)}
                  />

                  {index !== pendingRequests.length - 1 && (
                    <View style={styles.divider} />
                  )}
                </View>
              ))}
            </View>
          )}

          <View
            style={[
              styles.card,
              pendingRequests.length > 0 && {
                marginTop: 38,
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Friends</Text>

              <Text style={styles.viewAll}>View all</Text>
            </View>

            {friends.map((friend, index) => (
              <View key={friend.id}>
                <FriendRow
                  friend={friend}
                  onRemove={() => {}}
                />

                {index !== friends.length - 1 && (
                  <View style={styles.divider} />
                )}
              </View>
            ))}
          </View>
        </ScrollView>

        <Modal
          transparent
          visible={selectedFriend !== null}
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.popup}>
              <View style={styles.popupIconCircle}>
                <MaterialIcons
                  name="person-add-alt-1"
                  size={34}
                  color="#242833"
                />
              </View>

              <Text style={styles.popupTitle}>
                Accept Friend Request?
              </Text>

              <Text style={styles.popupText}>
                Are you sure you want to accept{'\n'}
                <Text style={styles.popupBold}>
                  {selectedFriend?.name}
                </Text>{' '}
                as your friend?
              </Text>

              <View style={styles.popupButtons}>
                <Pressable
                  style={styles.cancelButton}
                  onPress={() => setSelectedFriend(null)}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>

                <Pressable
                  style={styles.acceptButton}
                  onPress={() => {
                    if (selectedFriend) {
                      removePending(selectedFriend.id);
                    }

                    setSelectedFriend(null);
                  }}
                >
                  <Text style={styles.acceptText}>
                    Accept
                  </Text>
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
  friend,
  pending = false,
  onAccept,
  onRemove,
}: {
  friend: Friend;
  pending?: boolean;
  onAccept?: () => void;
  onRemove: () => void;
}) {
  return (
    <Pressable
      style={styles.friendRow}
      onPress={
        !pending
          ? () => router.push('/friend-profile' as any)
          : undefined
      }
    >
      <Image
        source={{ uri: friend.image }}
        style={styles.friendImage}
        contentFit="cover"
      />

      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>
          {friend.name}
        </Text>

        <Text style={styles.helperText}>
          {friend.subtitle}
        </Text>
      </View>

      {pending ? (
        <View style={styles.pendingActions}>
          <Pressable onPress={onAccept}>
            <MaterialIcons
              name="check"
              size={24}
              color="#555B65"
            />
          </Pressable>

          <Pressable onPress={onRemove}>
            <MaterialIcons
              name="close"
              size={24}
              color="#B5B5B5"
            />
          </Pressable>
        </View>
      ) : (
        <Pressable onPress={onRemove}>
          <MaterialIcons
            name="close"
            size={24}
            color="#B5B5B5"
          />
        </Pressable>
      )}
    </Pressable>
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

  headerRow: {
    marginTop: 32,
    marginBottom: 26,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
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
    paddingTop: 24,
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
    alignItems: 'center',
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#3E4650',
  },

  requestCount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5E72FF',
  },

  viewAll: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4F6DFF',
  },

  friendRow: {
    height: 70,
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
    gap: 16,
  },

  divider: {
    height: 1,
    backgroundColor: '#E4E5E8',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
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