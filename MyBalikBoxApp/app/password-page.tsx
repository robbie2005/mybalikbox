import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export default function PasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const isDimmed = showPopup || confirmed;

  return (
    <View style={styles.screen}>
      <LinearGradient colors={['#A9D0DA', '#F9FBFA']} style={styles.container}>
        {isDimmed && <View style={styles.overlay} />}

        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={25} color="#FFFFFF" />
        </Pressable>

        <Text style={styles.title}>Change Password</Text>

        <TextInput
          style={[styles.input, confirmed && styles.disabledInput]}
          placeholder="Enter password"
          placeholderTextColor="#C9CAD0"
          secureTextEntry
          value={password}
          editable={!confirmed}
          onChangeText={setPassword}
        />

        <TextInput
          style={[styles.input, confirmed && styles.disabledInput]}
          placeholder="Re-enter password"
          placeholderTextColor="#C9CAD0"
          secureTextEntry
          value={confirmPassword}
          editable={!confirmed}
          onChangeText={setConfirmPassword}
        />

        <View style={styles.rules}>
          <Text style={styles.rule}>•  8 characters (20 max)</Text>
          <Text style={styles.rule}>•  1 letter, 1 number, 1 special character (# ? ! @)</Text>
          <Text style={styles.rule}>•  Strong password</Text>
        </View>

        <Pressable
          style={[styles.confirmButton, confirmed && styles.disabledButton]}
          disabled={confirmed}
          onPress={() => setShowPopup(true)}
        >
          <Text style={styles.confirmButtonText}>Confirm</Text>
        </Pressable>
      </LinearGradient>

      <Modal transparent visible={showPopup} animationType="fade">
        <View style={styles.modalWrapper}>
          <View style={styles.popup}>
            <View style={styles.lockCircle}>
              <MaterialIcons name="lock" size={40} color="#000000" />
            </View>

            <Text style={styles.popupTitle}>Change password?</Text>
            <Text style={styles.popupText}>
              Are you sure you want to change{'\n'}
              your password?
            </Text>

            <View style={styles.popupButtons}>
              <Pressable style={styles.cancelButton} onPress={() => setShowPopup(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={styles.popupConfirmButton}
                onPress={() => {
                  setShowPopup(false);
                  setConfirmed(true);
                }}
              >
                <Text style={styles.popupConfirmText}>Confirm</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 39,
    paddingTop: 65,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(35, 45, 50, 0.35)',
    zIndex: 1,
  },
    backButton: {
    position: 'absolute',
    top: 49,
    left: 32,
    width: 29,
    height: 29,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  title: {
    marginTop: 40,
    fontSize: 27,
    fontWeight: '600',
    color: '#20242C',
    zIndex: 2,
  },
  input: {
    marginTop: 20,
    height: 48,
    borderRadius: 22,
    backgroundColor: '#FFFDF9',
    paddingHorizontal: 30,
    fontSize: 11,
    color: '#20242C',
    zIndex: 2,
  },
  disabledInput: {
    backgroundColor: '#DAD8D3',
  },
  rules: {
    marginTop: 14,
    marginLeft: 24,
    gap: 6,
    zIndex: 2,
  },
  rule: {
    fontSize: 8,
    color: '#687179',
  },
  confirmButton: {
    marginTop: 20,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F4C76D',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#557985',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
    zIndex: 2,
  },
  disabledButton: {
    backgroundColor: '#B8944F',
  },
  confirmButtonText: {
    fontSize: 14,
    color: '#151515',
  },
  modalWrapper: {
    flex: 1,
    backgroundColor: 'rgba(35, 45, 50, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  popup: {
    width: '80%',
    borderRadius: 28,
    backgroundColor: '#FFFDF9',
    alignItems: 'center',
    paddingTop: 18,
    paddingBottom: 30,
    paddingHorizontal: 38,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  lockCircle: {
    width: 55,
    height: 55,
    borderRadius: 48,
    backgroundColor: '#FFF3D8',
    borderWidth: 2,
    borderColor: '#F3D29A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupTitle: {
    marginTop: 15,
    fontSize: 18.7,
    fontWeight: '600',
    color: '#252525',
  },
  popupText: {
    marginTop: 11,
    fontSize: 11.6,
    lineHeight: 20,
    textAlign: 'center',
    color: '#9A908A',
  },
  popupButtons: {
    marginTop: 30,
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
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 5 },
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#252525',
  },
  popupConfirmButton: {
    width: 110,
    height: 45,
    borderRadius: 15,
    backgroundColor: '#BF8F5A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupConfirmText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});