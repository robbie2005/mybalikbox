import { MaterialIcons } from '@expo/vector-icons';
import { ProfileAvatar } from '@/components/profile-avatar';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ChecklistDesign } from '@/constants/checklist-design';
import {
  DEFAULT_BIO,
  DEFAULT_LOCATION,
  fetchCurrentProfile,
  pickProfileImage,
  updateProfile,
  uploadProfileAvatar,
} from '@/services/profile';

export default function EditBioScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [pendingLocalAvatar, setPendingLocalAvatar] = useState<string | null>(null);
  const [savedAvatarUrl, setSavedAvatarUrl] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const profile = await fetchCurrentProfile();
      if (!profile) {
        router.replace('/sign-in');
        return;
      }
      setUserId(profile.id);
      setDisplayName(profile.displayName);
      setBio(profile.bio);
      setLocation(profile.location);
      setAvatarUri(profile.avatarUrl);
      setSavedAvatarUrl(profile.avatarUrl);
      setPendingLocalAvatar(null);
    } catch (err) {
      Alert.alert('Could not load profile', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const onPickAvatar = useCallback(async () => {
    try {
      const uri = await pickProfileImage();
      if (!uri) return;
      setPendingLocalAvatar(uri);
      setAvatarUri(uri);
    } catch (err) {
      Alert.alert('Photo', err instanceof Error ? err.message : 'Could not open photo library.');
    }
  }, []);

  const onSave = useCallback(async () => {
    if (!userId) return;
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      Alert.alert('Name required', 'Please enter a display name.');
      return;
    }

    setSaving(true);
    try {
      let avatarUrl = savedAvatarUrl;
      if (pendingLocalAvatar) {
        avatarUrl = await uploadProfileAvatar(pendingLocalAvatar, userId);
      }

      await updateProfile({
        displayName: trimmedName,
        bio,
        location: location.trim() || DEFAULT_LOCATION,
        avatarUrl,
      });

      router.back();
    } catch (err) {
      Alert.alert('Save failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  }, [bio, displayName, location, pendingLocalAvatar, savedAvatarUrl, userId]);

  return (
    <LinearGradient
      colors={[ChecklistDesign.gradientTop, ChecklistDesign.gradientBottom]}
      style={styles.container}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}>
      <Pressable style={styles.backButton} onPress={() => router.back()} disabled={saving}>
        <MaterialIcons name="arrow-back" size={17} color="#FFFFFF" />
      </Pressable>

      <Text style={styles.header}>Edit Bio</Text>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#5F6670" />
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled">
            <Pressable style={styles.avatarWrap} onPress={() => void onPickAvatar()} disabled={saving}>
              <ProfileAvatar uri={avatarUri} size={100} style={styles.avatar} />
              <View style={styles.cameraBadge}>
                <MaterialIcons name="photo-camera" size={16} color="#FFFFFF" />
              </View>
            </Pressable>
            <Text style={styles.avatarHint}>Tap to change profile photo</Text>

            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your name"
              placeholderTextColor="#9AA3AD"
              autoCapitalize="words"
              editable={!saving}
            />

            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              placeholder={DEFAULT_BIO}
              placeholderTextColor="#9AA3AD"
              multiline
              textAlignVertical="top"
              editable={!saving}
            />

            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder={DEFAULT_LOCATION}
              placeholderTextColor="#9AA3AD"
              editable={!saving}
            />

            <Pressable
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={() => void onSave()}
              disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
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
    zIndex: 2,
  },
  header: {
    marginTop: 70,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#5F6670',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 35,
    paddingTop: 24,
    paddingBottom: 48,
  },
  avatarWrap: {
    marginTop: 8,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#94B8C3',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: ChecklistDesign.gradientBottom,
  },
  avatarHint: {
    marginTop: 8,
    fontSize: 10,
    color: '#5F6670',
  },
  label: {
    alignSelf: 'stretch',
    marginTop: 18,
    marginBottom: 6,
    fontSize: 11,
    fontWeight: '600',
    color: '#5F6670',
  },
  input: {
    alignSelf: 'stretch',
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.65)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#2B2B2B',
  },
  bioInput: {
    minHeight: 88,
    paddingTop: 12,
  },
  saveButton: {
    marginTop: 28,
    alignSelf: 'stretch',
    height: 44,
    borderRadius: 14,
    backgroundColor: '#94B8C3',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#557985',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 7 },
    elevation: 5,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
