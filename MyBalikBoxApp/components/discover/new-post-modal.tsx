import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { CreateDiscoverPostInput, DiscoverCategory } from '@/services/discover-feed';

type Props = {
  visible: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (input: CreateDiscoverPostInput) => Promise<void>;
};

export function DiscoverNewPostModal({ visible, submitting, onClose, onSubmit }: Props) {
  const insets = useSafeAreaInsets();
  const [category, setCategory] = useState<DiscoverCategory>('family');
  const [caption, setCaption] = useState('');
  const [sharedWithText, setSharedWithText] = useState('');
  const [collaboratorDraft, setCollaboratorDraft] = useState('');
  const [collaboratorScreenOpen, setCollaboratorScreenOpen] = useState(false);
  const [asset, setAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [pickerBusy, setPickerBusy] = useState(false);

  useEffect(() => {
    if (!visible) {
      setCategory('family');
      setCaption('');
      setSharedWithText('');
      setCollaboratorDraft('');
      setCollaboratorScreenOpen(false);
      setAsset(null);
      setPickerBusy(false);
    }
  }, [visible]);

  const selectPhoto = async () => {
    setPickerBusy(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Photos permission required', 'Allow photo access to attach an image to your post.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.9,
        allowsEditing: true,
        aspect: [4, 4],
      });

      if (!result.canceled && result.assets[0]) {
        setAsset(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Could not open photo library', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setPickerBusy(false);
    }
  };

  const submit = async () => {
    if (!asset) {
      Alert.alert('Photo required', 'Select a photo before posting.');
      return;
    }
    if (!caption.trim()) {
      Alert.alert('Caption required', 'Write a short caption for your post.');
      return;
    }

    await onSubmit({
      category,
      caption,
      sharedWithText: sharedWithText.trim() || null,
      image: {
        uri: asset.uri,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
      },
    });
  };

  const saveCollaborator = () => {
    setSharedWithText(collaboratorDraft.trim());
    setCollaboratorScreenOpen(false);
  };

  const gradientColors: [string, string, string] = ['#F2C66D', '#F7E6BE', '#FBF7F0'];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[styles.panel, { paddingTop: insets.top + 18, paddingBottom: Math.max(28, insets.bottom + 18) }]}>
          <View style={styles.header}>
            <Pressable onPress={onClose} accessibilityRole="button">
              <Text style={styles.headerAction}>X</Text>
            </Pressable>
            <Text style={styles.headerTitle}>New Post</Text>
            <Pressable onPress={() => void submit()} disabled={submitting || pickerBusy} accessibilityRole="button">
              <Text style={[styles.headerAction, (submitting || pickerBusy) && styles.headerActionDisabled]}>
                Next
              </Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Pressable
              onPress={() => void selectPhoto()}
              style={styles.previewWrap}
              accessibilityRole="button"
              accessibilityLabel="Select post photo">
              {asset ? (
                <Image source={{ uri: asset.uri }} style={styles.previewImage} contentFit="cover" />
              ) : (
                <View style={styles.previewPlaceholder}>
                  <MaterialIcons name="photo-library" size={48} color="#7E7E7E" />
                  <Text style={styles.previewText}>Select a photo</Text>
                </View>
              )}
            </Pressable>

            <TextInput
              value={caption}
              onChangeText={setCaption}
              placeholder="Write a caption for your post..."
              placeholderTextColor="#6F5F4D"
              style={styles.captionInput}
              editable={!submitting}
              multiline
              textAlignVertical="center"
            />

            <Pressable
              onPress={() => {
                setCollaboratorDraft(sharedWithText);
                setCollaboratorScreenOpen(true);
              }}
              style={styles.collabRow}
              accessibilityRole="button"
              accessibilityLabel="Invite collaborator">
              <MaterialIcons name="contact-page" size={20} color="#18263D" />
              <Text style={styles.collabText}>{sharedWithText || 'Invite Collaborator'}</Text>
              <MaterialIcons name="arrow-forward" size={24} color="#18263D" />
            </Pressable>

            <View style={styles.categorySection}>
              <Text style={styles.categoryLabel}>Category</Text>
              <View style={styles.categoryCluster}>
                <View style={styles.categoryRowTop}>
                  <Pressable
                    onPress={() => setCategory('family')}
                    style={[styles.categoryPill, category === 'family' && styles.categoryPillActive]}
                    accessibilityRole="button">
                    <Text style={styles.categoryPillText}>Family</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setCategory('culture')}
                    style={[styles.categoryPill, category === 'culture' && styles.categoryPillActive]}
                    accessibilityRole="button">
                    <Text style={styles.categoryPillText}>Culture</Text>
                  </Pressable>
                </View>
                <Pressable
                  onPress={() => setCategory('gratitude')}
                  style={[
                    styles.categoryPill,
                    styles.categoryPillBottom,
                    category === 'gratitude' && styles.categoryPillActive,
                  ]}
                  accessibilityRole="button">
                  <Text style={styles.categoryPillText}>Gratitude</Text>
                </Pressable>
              </View>
            </View>

            <Pressable
              onPress={() => void selectPhoto()}
              disabled={submitting || pickerBusy}
              style={[styles.shareButton, (submitting || pickerBusy) && styles.shareButtonDisabled]}
              accessibilityRole="button">
              <Text style={styles.shareButtonText}>Share</Text>
            </Pressable>
          </ScrollView>
        </LinearGradient>

        <Modal
          visible={collaboratorScreenOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setCollaboratorScreenOpen(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={[
                styles.panel,
                {
                  paddingTop: insets.top + 18,
                  paddingBottom: Math.max(28, insets.bottom + 18),
                },
              ]}>
              <View style={styles.header}>
                <Pressable onPress={() => setCollaboratorScreenOpen(false)} accessibilityRole="button">
                  <Text style={styles.headerAction}>X</Text>
                </Pressable>
                <Text style={styles.headerTitle}>Add Collaborator</Text>
                <Pressable onPress={saveCollaborator} accessibilityRole="button">
                  <Text style={styles.headerAction}>Done</Text>
                </Pressable>
              </View>

              <View style={styles.collabScreenBody}>
                <View style={styles.searchLabelRow}>
                  <Text style={styles.searchLabel}>
                    Search <Text style={styles.searchRequired}>*</Text>
                  </Text>
                  <MaterialIcons name="help-outline" size={14} color="#7F6B57" />
                </View>

                <View style={styles.searchInputWrap}>
                  <MaterialIcons name="search" size={20} color="#9EA2AE" />
                  <TextInput
                    value={collaboratorDraft}
                    onChangeText={setCollaboratorDraft}
                    placeholder="Search"
                    placeholderTextColor="#9096A6"
                    style={styles.collabScreenInput}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={saveCollaborator}
                  />
                </View>
              </View>
            </LinearGradient>
          </KeyboardAvoidingView>
        </Modal>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-start',
    backgroundColor: 'transparent',
  },
  panel: {
    flex: 1,
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginBottom: 18,
  },
  headerAction: {
    minWidth: 38,
    color: '#111111',
    fontSize: 15,
    fontWeight: '600',
  },
  headerActionDisabled: {
    color: '#8A7B65',
  },
  headerTitle: {
    color: '#111111',
    fontSize: 17,
    fontWeight: '400',
  },
  previewWrap: {
    marginHorizontal: 22,
    width: 358,
    maxWidth: '100%',
    aspectRatio: 0.9323,
    backgroundColor: '#EFEFEF',
    alignSelf: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  previewText: {
    color: '#545454',
    fontSize: 15,
    fontWeight: '600',
  },
  captionInput: {
    marginTop: 14,
    marginHorizontal: 30,
    minHeight: 54,
    paddingHorizontal: 6,
    color: '#473A2A',
    fontSize: 15,
    lineHeight: 18,
    textAlign: 'center',
  },
  collabRow: {
    marginTop: 18,
    marginHorizontal: 35,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  collabText: {
    flex: 1,
    color: '#302A23',
    fontSize: 15,
    fontWeight: '400',
  },
  categorySection: {
    marginTop: 48,
    marginHorizontal: 45,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryLabel: {
    color: '#3B3026',
    fontSize: 14,
    fontWeight: '400',
  },
  categoryCluster: {
    width: 205,
    alignItems: 'center',
  },
  categoryRowTop: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryPill: {
    minWidth: 108,
    minHeight: 40,
    borderRadius: 20,
    backgroundColor: '#FFF8EE',
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignItems: 'center',
    shadowColor: '#886432',
    shadowOpacity: 0.14,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  categoryPillBottom: {
    marginTop: 12,
  },
  categoryPillActive: {
    backgroundColor: '#F6CB73',
  },
  categoryPillText: {
    color: '#43362A',
    fontSize: 15,
    fontWeight: '700',
  },
  shareButton: {
    alignSelf: 'center',
    marginTop: 28,
    minWidth: 212,
    borderRadius: 14,
    backgroundColor: '#7F9CAA',
    paddingHorizontal: 26,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#557985',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  shareButtonDisabled: {
    opacity: 0.6,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  collabScreenBody: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 16,
  },
  searchLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  searchLabel: {
    color: '#2D2720',
    fontSize: 14,
    fontWeight: '500',
  },
  searchRequired: {
    color: '#D05757',
  },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    backgroundColor: '#F9FBFF',
    paddingHorizontal: 14,
    minHeight: 40,
    shadowColor: '#A48A67',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  collabScreenInput: {
    flex: 1,
    color: '#39414F',
    fontSize: 14,
    paddingVertical: 10,
  },
});
