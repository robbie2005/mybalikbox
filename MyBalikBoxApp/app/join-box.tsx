import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { phoneCardFlowStyles as flow } from '@/constants/phone-card-flow';
import { isJoinCodeComplete, normalizeJoinCodeInput } from '@/services/join-box';

export default function JoinBoxScreen() {
  const insets = useSafeAreaInsets();
  const [boxCode, setBoxCode] = useState('');

  const normalizedCode = useMemo(() => normalizeJoinCodeInput(boxCode), [boxCode]);
  const canJoin = isJoinCodeComplete(normalizedCode);

  const onChangeCode = (text: string) => {
    setBoxCode(normalizeJoinCodeInput(text));
  };

  const onJoin = () => {
    if (!canJoin) return;
    router.push({
      pathname: '/box-joined',
      params: { boxCode: normalizedCode },
    });
  };

  return (
    <LinearGradient colors={['#E8C56B', '#F4F1EC']} style={flow.gradient}>
      <View style={[flow.page, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 14 }]}>
        <View style={flow.phoneCard}>
          <View style={flow.header}>
            <Pressable onPress={() => router.back()} style={flow.backPill} accessibilityRole="button">
              <MaterialIcons name="arrow-back" size={20} color="#FEFDF9" />
            </Pressable>
            <View style={styles.headerTextWrap}>
              <Text style={flow.headerTitle}>Join Existing Box</Text>
              <Text style={flow.headerSub}>Enter the box code to join</Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={flow.content} showsVerticalScrollIndicator={false}>
            <Text style={flow.sectionHint}>Box Code *</Text>
            <TextInput
              value={normalizedCode}
              onChangeText={onChangeCode}
              placeholder="Enter 6-digit code"
              placeholderTextColor="#9A8F86"
              style={[flow.textInput, styles.codeInput]}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={6}
              returnKeyType="done"
              onSubmitEditing={onJoin}
            />

            <View style={styles.tipCard}>
              <MaterialIcons name="lightbulb-outline" size={20} color="#6F655D" style={styles.tipIcon} />
              <Text style={styles.tipText}>
                Ask the box owner for the unique 6-digit code. Once you join, you&apos;ll be able to view and add
                items to the shared box.
              </Text>
            </View>

            <View style={styles.exampleCard}>
              <Text style={styles.exampleLabel}>Example Code:</Text>
              <Text style={styles.exampleCode}>ABC123</Text>
            </View>
          </ScrollView>

          <View style={flow.footerWrap}>
            <Pressable
              style={[flow.footerButton, canJoin ? flow.footerButtonActive : null]}
              accessibilityRole="button"
              disabled={!canJoin}
              onPress={onJoin}>
              <Text style={flow.footerButtonText}>Join Box</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  headerTextWrap: {
    flex: 1,
  },
  codeInput: {
    letterSpacing: 2,
    textAlign: 'center',
    fontSize: 18,
  },
  tipCard: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#EFE3D3',
    borderRadius: 12,
    padding: 14,
  },
  tipIcon: {
    marginTop: 1,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#4A4642',
  },
  exampleCard: {
    marginTop: 4,
    backgroundColor: '#E3EEF5',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  exampleLabel: {
    fontSize: 14,
    color: '#5C6B7A',
    fontWeight: '600',
  },
  exampleCode: {
    marginTop: 6,
    fontSize: 22,
    fontWeight: '800',
    color: '#3D5A6C',
    letterSpacing: 2,
  },
});
