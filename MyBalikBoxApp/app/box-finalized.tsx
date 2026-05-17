import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BalikBoxLogo } from '@/components/balikbox-logo';
import { ChecklistDesign } from '@/constants/checklist-design';

/** Same asset size as sign-in / sign-up. */
const LOGO_W = 159;
const LOGO_H = 140;

function SunDivider() {
  return (
    <View style={styles.dividerRow}>
      <View style={styles.dividerLine} />
      <View style={styles.sunBadge}>
        <MaterialIcons name="wb-sunny" size={22} color="#E8B654" />
      </View>
      <View style={styles.dividerLine} />
    </View>
  );
}

export default function BoxFinalizedScreen() {
  const insets = useSafeAreaInsets();

  const goToChecklist = () => {
    router.replace('/(tabs)/checklist');
  };

  return (
    <LinearGradient
      colors={[ChecklistDesign.gradientTop, ChecklistDesign.gradientBottom]}
      style={styles.gradient}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 8,
            paddingBottom: insets.bottom + 100,
          },
        ]}
        showsVerticalScrollIndicator={false}>
        <Pressable
          onPress={goToChecklist}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <MaterialIcons name="arrow-back" size={26} color={ChecklistDesign.textPrimary} />
        </Pressable>

        <View style={styles.centerBlock}>
          <View style={styles.logoWrap}>
            <BalikBoxLogo width={LOGO_W} height={LOGO_H} />
          </View>

          <Text style={styles.title}>Box Finalized!</Text>
          <Text style={styles.subtitle}>Your balikbayan box is ready for dropoff!</Text>

          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
            onPress={() => router.push('/(tabs)/find-dropoff')}
            accessibilityRole="button"
            accessibilityLabel="Find dropoff locations">
            <Text style={styles.primaryButtonText}>Find Dropoff Locations</Text>
          </Pressable>

          <SunDivider />

          <View style={styles.noteCard}>
            <Text style={styles.noteText}>
              This box will be moved to the Archived Boxes. You can find it in Box Settings.
            </Text>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  centerBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    minHeight: 520,
  },
  logoWrap: {
    marginBottom: 28,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: ChecklistDesign.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    color: ChecklistDesign.textMuted,
    textAlign: 'center',
    marginBottom: 28,
    paddingHorizontal: 12,
  },
  primaryButton: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: ChecklistDesign.tanButton,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryButtonPressed: {
    opacity: 0.92,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    marginTop: 36,
    marginBottom: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(90, 70, 50, 0.2)',
  },
  sunBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  noteText: {
    fontSize: 14,
    lineHeight: 21,
    color: ChecklistDesign.textMuted,
    textAlign: 'center',
  },
});
