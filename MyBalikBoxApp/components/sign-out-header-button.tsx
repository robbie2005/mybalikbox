import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ChecklistDesign } from '@/constants/checklist-design';
import { signOutUser } from '@/services/auth-sign-out';

export function SignOutHeaderButton() {
  const onSignOut = useCallback(() => {
    void signOutUser();
  }, []);

  return (
    <Pressable
      onPress={() => void onSignOut()}
      style={styles.wrap}
      accessibilityRole="button"
      accessibilityLabel="Sign out">
      <View style={styles.iconCircle}>
        <MaterialIcons name="logout" size={20} color={ChecklistDesign.textPrimary} />
      </View>
      <Text style={styles.label}>Sign Out</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    width: 82,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E7D1A8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    color: ChecklistDesign.textPrimary,
    lineHeight: 14,
  },
});
