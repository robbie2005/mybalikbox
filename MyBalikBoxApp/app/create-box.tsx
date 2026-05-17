import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { generateRandomJoinCode } from '@/services/join-box';

export default function CreateBoxScreen() {
  const insets = useSafeAreaInsets();
  const [boxName, setBoxName] = useState('');
  const [budget, setBudget] = useState('');
  const [weight, setWeight] = useState('');
  const isContinueEnabled = boxName.trim().length > 0;

  return (
    <LinearGradient colors={['#E8C56B', '#F4F1EC']} style={styles.gradient}>
      <View style={[styles.page, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 14 }]}>
        <View style={styles.phoneCard}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backPill} accessibilityRole="button">
              <MaterialIcons name="arrow-back" size={20} color="#FEFDF9" />
            </Pressable>
            <View>
              <Text style={styles.headerTitle}>Create New Box</Text>
              <Text style={styles.headerSub}>Add a name and optional details</Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionHint}>Box Name</Text>
            <TextInput
              value={boxName}
              onChangeText={setBoxName}
              placeholder="Family Balikbayan Box 2026"
              placeholderTextColor="#9A8F86"
              style={styles.textInput}
            />

            <Text style={styles.sectionHint}>Budget (optional)</Text>
            <TextInput
              value={budget}
              onChangeText={setBudget}
              placeholder="e.g. $500"
              placeholderTextColor="#9A8F86"
              style={styles.textInput}
              keyboardType="decimal-pad"
            />

            <Text style={styles.sectionHint}>Weight (optional)</Text>
            <TextInput
              value={weight}
              onChangeText={setWeight}
              placeholder="e.g. 20kg"
              placeholderTextColor="#9A8F86"
              style={styles.textInput}
            />
          </ScrollView>

          <View style={styles.footerWrap}>
            <Pressable
              style={[styles.footerButton, isContinueEnabled ? styles.footerButtonActive : null]}
              accessibilityRole="button"
              disabled={!isContinueEnabled}
              onPress={() =>
                router.push({
                  pathname: '/box-created',
                  params: {
                    boxName: boxName.trim(),
                    boxCode: generateRandomJoinCode(),
                    budget: budget.trim(),
                    weight: weight.trim(),
                  },
                })
              }>
              <Text style={styles.footerButtonText}>Continue</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  page: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneCard: {
    width: '96%',
    height: '70%',
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.95)',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 14 },
    shadowRadius: 20,
    elevation: 8,
  },
  header: {
    minHeight: 98,
    backgroundColor: '#F2C572',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backPill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: {
    fontSize: 31,
    lineHeight: 34,
    fontWeight: '800',
    color: '#FEFDF9',
  },
  headerSub: {
    marginTop: 2,
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 20,
    gap: 10,
  },
  sectionHint: {
    marginTop: 4,
    fontSize: 12,
    color: '#9A8F86',
    fontWeight: '600',
  },
  textInput: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: '#EFE3D3',
    paddingHorizontal: 14,
    color: '#2E2A26',
    fontSize: 16,
    fontWeight: '600',
  },
  footerWrap: {
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  footerButton: {
    height: 51,
    borderRadius: 16,
    backgroundColor: '#D9D9D9',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 8,
    elevation: 3,
  },
  footerButtonActive: {
    backgroundColor: '#2F80ED',
  },
  footerButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
});
