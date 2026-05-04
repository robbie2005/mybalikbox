import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export default function ChangePhoneScreen() {
  return (
    <LinearGradient colors={['#A9D0DA', '#F9FBFA']} style={styles.container}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <MaterialIcons name="arrow-back" size={25} color="#FFFFFF" />
      </Pressable>

      <Text style={styles.title}>Change phone</Text>

      <View style={styles.phoneInput}>
        <Text style={styles.countryCode}>+1</Text>
        <TextInput
          style={styles.phoneTextInput}
          placeholder="Enter phone number"
          placeholderTextColor="#C9CAD0"
          keyboardType="phone-pad"
        />
      </View>

      <Pressable style={styles.confirmButton} onPress={() => router.push('/verify-phone')}>
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
  phoneInput: {
    marginTop: 23,
    height: 47,
    borderRadius: 25,
    backgroundColor: '#FFFDF9',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 44,
  },
  countryCode: {
    fontSize: 11,
    color: '#151515',
    marginRight: 25,
  },
  phoneTextInput: {
    flex: 1,
    fontSize: 11,
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
    fontSize: 13.5,
    color: '#151515',
  },
});