import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

export default function AboutApplicationScreen() {
  return (
    <LinearGradient colors={['#A9D0DA', '#F9FBFA']} style={styles.container}>
      <Pressable style={styles.backButton} onPress={() => router.replace('/settings')}>
        <MaterialIcons name="arrow-back" size={16} color="#FFFFFF" />
      </Pressable>

      <Text style={styles.header}>About Application</Text>

      <Text style={styles.title}>What is MyBalikBox?</Text>

      <Text style={styles.body}>
        MyBalikBox is a web application designed to help families plan and organize the contents of a
        Balikbayan box with intention, centering on culture, shared meaning, and connection. The platform
        allows recipients to suggest items while senders manage a centralized checklist, keeping everything
        clear and organized. The app also provides commonly included Balikbayan box item recommendations,
        paired with cultural, historical, or personal context that explains why these items matter.
        {'\n\n'}
        To further strengthen connection, MyBalikBox includes a social component where users can share what
        they sent or received and the stories behind those choices. By combining organization, cultural
        storytelling, and community sharing, the app supports meaningful connection in a way that is both
        thoughtful and design-driven.
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 50,
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
  header: {
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: '#242833',
    marginTop: 10,
  },
  title: {
    marginTop: 30,
    fontSize: 26,
    fontWeight: '700',
    color: '#242833',
  },
  body: {
    marginTop: 23,
    fontSize: 13,
    lineHeight: 15,
    color: '#242833',
  },
});