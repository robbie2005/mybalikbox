import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

export default function HelpFAQScreen() {
  return (
    <LinearGradient colors={['#A9D0DA', '#F9FBFA']} style={styles.container}>
      <Pressable style={styles.backButton} onPress={() => router.replace('/settings')}>
        <MaterialIcons name="arrow-back" size={16} color="#FFFFFF" />
      </Pressable>

      <Text style={styles.header}>Help/FAQ</Text>

      <Text style={styles.title}>
        Frequently Asked{'\n'}
        Questions
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 50,
    paddingTop: 70,
  },
  backButton: {
    position: 'absolute',
    top: 65,
    left: 32,
    width: 29,
    height: 29,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '800',
    color: '#242833',
    marginTop: 1,
  },
  title: {
    marginTop: 22,
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '700',
    color: '#242833',
  },
});