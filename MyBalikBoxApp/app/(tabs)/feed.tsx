import { StyleSheet, Text, View } from 'react-native';

import { ChecklistDesign } from '@/constants/checklist-design';

export default function FeedScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Feed</Text>
      <Text style={styles.subtitle}>Coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ChecklistDesign.gradientBottom,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: ChecklistDesign.textPrimary,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    color: ChecklistDesign.textMuted,
  },
});

