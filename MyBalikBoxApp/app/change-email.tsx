import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput } from 'react-native';

export default function ChangeEmailScreen() {
  return (
    <LinearGradient colors={['#A9D0DA', '#F9FBFA']} style={styles.container}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <MaterialIcons name="arrow-back" size={18} color="#FFFFFF" />
      </Pressable>

      <Text style={styles.title}>Change email</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter email"
        placeholderTextColor="#C9CAD0"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.inputSecond}
        placeholder="Re-enter email"
        placeholderTextColor="#C9CAD0"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Pressable style={styles.confirmButton} onPress={() => router.push('/verify-email')}>
        <Text style={styles.confirmText}>Confirm</Text>
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 33,
    paddingTop: 65,
  },
  backButton: {
    position: 'absolute',
    top: 55,
    left: 32,
    width: 29,
    height: 29,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 35,
    fontSize: 29,
    fontWeight: '600',
    color: '#20242C',
  },
  input: {
    marginTop: 21,
    height: 47,
    borderRadius: 25,
    backgroundColor: '#FFFDF9',
    paddingHorizontal: 44,
    fontSize: 12,
    color: '#20242C',
  },
  inputSecond: {
    marginTop: 16,
    height: 47,
    borderRadius: 25,
    backgroundColor: '#FFFDF9',
    paddingHorizontal: 44,
    fontSize: 12,
    color: '#20242C',
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
  },
  confirmText: {
    fontSize: 14,
    color: '#151515',
  },
});