import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function FindDropoffScreen() {
  const insets = useSafeAreaInsets();
  const [zip, setZip] = useState('');

  const canSearch = zip.length === 5;

  const onChangeZip = (text: string) => {
    setZip(text.replace(/\D/g, '').slice(0, 5));
  };

  const onFindLocations = () => {
    if (!canSearch) return;
    router.push({ pathname: '/(tabs)/dropoff-results', params: { zip } });
  };

  return (
    <LinearGradient colors={['#E8C97A', '#F5EDE0']} style={styles.gradient} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        <Pressable
          onPress={() => router.back()}
          style={[styles.backButton, { top: insets.top + 12 }]}
          accessibilityRole="button">
          <MaterialIcons name="arrow-back" size={20} color="#5C4E3A" />
        </Pressable>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 12, paddingBottom: 120 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">

          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <MaterialIcons name="location-on" size={32} color="#FEFDF9" />
            </View>

            <Text style={styles.title}>Find Dropoff{'\n'}Locations</Text>
            <Text style={styles.subtitle}>
              Enter your ZIP code to find the nearest balikbayan box dropoff locations
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>ZIP Code</Text>
              <TextInput
                value={zip}
                onChangeText={onChangeZip}
                placeholder="Enter 5-digit ZIP code"
                placeholderTextColor="#B5A898"
                style={styles.input}
                keyboardType="number-pad"
                maxLength={5}
                returnKeyType="search"
                onSubmitEditing={onFindLocations}
              />
            </View>

            <Pressable
              style={[styles.button, canSearch && styles.buttonActive]}
              disabled={!canSearch}
              onPress={onFindLocations}
              accessibilityRole="button">
              <Text style={[styles.buttonText, canSearch && styles.buttonTextActive]}>
                Find Locations
              </Text>
            </Pressable>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gradient: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  card: {
    marginTop: 52,
    backgroundColor: '#FEFDF9',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 48,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 5,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#D4A843',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2E2A26',
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#7A6F66',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  inputGroup: {
    width: '100%',
    gap: 6,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2E2A26',
  },
  input: {
    height: 50,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '500',
    color: '#2E2A26',
    borderWidth: 1,
    borderColor: '#E8E0D4',
  },
  button: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    backgroundColor: '#EDD89A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonActive: {
    backgroundColor: '#D4A843',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#C4A85A',
  },
  buttonTextActive: {
    color: '#FEFDF9',
  },
});
