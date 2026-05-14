import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export default function VerifyPhoneScreen() {
  return (
    <LinearGradient colors={['#A9D0DA', '#F9FBFA']} style={styles.container}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <MaterialIcons name="arrow-back" size={25} color="#FFFFFF" />
      </Pressable>

      <Text style={styles.title}>Verify phone number</Text>

      <Text style={styles.subtitle}>
        Use the link or enter the code sent to [insert{'\n'}
        phone number entered here]
      </Text>

      <View style={styles.codeRow}>
        {[0, 1, 2, 3, 4].map((item) => (
          <TextInput
            key={item}
            style={styles.codeBox}
            maxLength={1}
            keyboardType="number-pad"
          />
        ))}
      </View>

      <Pressable style={styles.confirmButton} onPress={() => {}}>
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
    marginTop: 40,
    fontSize: 26,
    fontWeight: '600',
    color: '#20242C',
  },
  subtitle: {
    marginTop: 12,
    fontSize: 9,
    lineHeight: 12.5,
    color: '#687179',
  },
  codeRow: {
    marginTop: 18,
    marginLeft: 30,
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeBox: {
    width: 31,
    height: 43,
    borderRadius: 3,
    backgroundColor: '#FFFDF9',
    marginRight: 11,
    textAlign: 'center',
    fontSize: 35,
    color: '#20242C',
  },
  confirmButton: {
    marginTop: 28,
    height: 40,
    borderRadius: 9,
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
    fontSize: 15,
    color: '#151515',
  },
});