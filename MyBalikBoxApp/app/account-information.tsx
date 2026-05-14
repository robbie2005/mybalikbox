import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

type PopupType = 'phone' | 'email' | null;

export default function AccountInformationScreen() {
  const [popup, setPopup] = useState<PopupType>(null);

  return (
    <View style={styles.screen}>
      <LinearGradient colors={['#A9D0DA', '#F9FBFA']} style={styles.container}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={17} color="#FFFFFF" />
        </Pressable>

        <Text style={styles.header}>Account Information</Text>

        <Image
          source={{
            uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=500',
          }}
          style={styles.avatar}
          contentFit="cover"
        />

        <Text style={styles.name}>Mikey Bustos</Text>

        <Text style={styles.sectionTitle}>Account Information</Text>

        <View style={styles.card}>
          <AccountRow
            icon="phone"
            title="Phone number"
            onPress={() => setPopup('phone')}
          />

          <Divider />

          <AccountRow
            icon="email"
            title="Email"
            onPress={() => setPopup('email')}
          />
        </View>
      </LinearGradient>

      <Modal transparent visible={popup !== null} animationType="fade">
        <View style={styles.modalWrapper}>
          <View style={styles.popup}>
            <View style={styles.iconCircle}>
              <MaterialIcons
                name={popup === 'email' ? 'email' : 'phone'}
                size={38}
                color="#000000"
              />
            </View>

            <Text style={styles.popupTitle}>
              {popup === 'email' ? 'Your email:' : 'Your phone number:'}
            </Text>

            <Text style={styles.popupValue}>
              {popup === 'email' ? 'm*****l@gmail.com' : '+1*****711'}
            </Text>

            <Text style={styles.popupDescription}>
              {popup === 'email'
                ? 'This email is linked to your account and is\nonly visible to you'
                : 'This phone number is linked to your\naccount and is only visible to you'}
            </Text>

            <View style={styles.popupButtons}>
              <Pressable style={styles.cancelButton} onPress={() => setPopup(null)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={styles.changeButton}
                onPress={() => {
                    setPopup(null);
                    router.push(popup === 'email' ? '/change-email' : '/change-phone');
                }}
               >
                <Text style={styles.changeText}>
                  {popup === 'email' ? 'Change email' : 'Change phone'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function AccountRow({
  icon,
  title,
  onPress,
}: {
  icon: 'phone' | 'email';
  title: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <MaterialIcons name={icon} size={20} color="#9A9A9A" />
      <Text style={styles.rowText}>{title}</Text>
      <MaterialIcons name="arrow-forward" size={18} color="#9A9A9A" />
    </Pressable>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 39,
    paddingTop: 50,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 32,
    width: 29,
    height: 29,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  header: {
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: '#242833',
    marginTop: 8,
  },
  avatar: {
    alignSelf: 'center',
    marginTop: 27,
    width: 105,
    height: 105,
    borderRadius: 80,
  },
  name: {
    marginTop: 13,
    textAlign: 'center',
    fontSize: 17,
    color: '#242833',
  },
  sectionTitle: {
    marginTop: 30,
    marginLeft: 34,
    marginBottom: 10,
    fontSize: 14,
    color: '#666666',
  },
  card: {
    borderRadius: 20,
    backgroundColor: '#FFFDF9',
    overflow: 'hidden',
  },
  row: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 19,
  },
  rowText: {
    flex: 1,
    marginLeft: 13,
    fontSize: 12,
    color: '#242833',
  },
  divider: {
    height: 1,
    backgroundColor: '#D1CDC6',
  },
  modalWrapper: {
    flex: 1,
    backgroundColor: 'rgba(35, 45, 50, 0.38)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  popup: {
    width: '80%',
    borderRadius: 28,
    backgroundColor: '#FFFDF9',
    alignItems: 'center',
    paddingTop: 57,
    paddingBottom: 20,
    paddingHorizontal: 38,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  iconCircle: {
    width: 55,
    height: 55,
    marginTop: -36,
    borderRadius: 48,
    backgroundColor: '#FFF3D8',
    borderWidth: 2,
    borderColor: '#F3D29A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupTitle: {
    marginTop: 15,
    fontSize: 18,
    fontWeight: '600',
    color: '#252525',
    textAlign: 'center',
  },
  popupValue: {
    marginTop: 10,
    fontSize: 19,
    fontWeight: '500',
    color: '#252525',
    textAlign: 'center',
  },
  popupDescription: {
    marginTop: 9,
    fontSize: 10,
    lineHeight: 16,
    color: '#9A908A',
    textAlign: 'center',
  },
  popupButtons: {
    marginTop: 22,
    flexDirection: 'row',
    gap: 9,
  },
  cancelButton: {
    width: 110,
    height: 45,
    borderRadius: 18,
    backgroundColor: '#FFFDF9',
    borderWidth: 2,
    borderColor: '#E8D7BE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#252525',
  },
  changeButton: {
    width: 110,
    height: 45,
    borderRadius: 18,
    backgroundColor: '#BF8F5A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});