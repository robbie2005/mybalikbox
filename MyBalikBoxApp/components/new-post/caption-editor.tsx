import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChecklistDesign } from '@/constants/checklist-design';

/** Instagram-style action blue from caption editor reference */
const CAPTION_OK_BLUE = '#0095F6';

type CaptionEditorProps = {
  visible: boolean;
  value: string;
  onChange: (text: string) => void;
  onClose: () => void;
};

export function CaptionEditor({ visible, value, onChange, onClose }: CaptionEditorProps) {
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" />
        <LinearGradient
          colors={[ChecklistDesign.gradientTop, ChecklistDesign.cream]}
          style={[styles.panel, { paddingTop: insets.top + 6, paddingBottom: insets.bottom + 10 }]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}>
          <View style={styles.header}>
            <View style={styles.headerSpacer} />
            <Text style={styles.headerTitle}>Caption</Text>
            <Pressable
              style={styles.headerAction}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Done">
              <Text style={styles.okText}>OK</Text>
            </Pressable>
          </View>

          <View style={styles.inputBox}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={value}
              onChangeText={onChange}
              placeholder="Add a caption..."
              placeholderTextColor={ChecklistDesign.textMuted}
              multiline
              scrollEnabled
              textAlignVertical="top"
              autoCorrect
              autoCapitalize="sentences"
              selectionColor={CAPTION_OK_BLUE}
            />
          </View>
        </LinearGradient>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  panel: {
    minHeight: '22%',
    maxHeight: '36%',
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerSpacer: {
    width: 56,
  },
  headerAction: {
    width: 56,
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: ChecklistDesign.textPrimary,
  },
  okText: {
    fontSize: 17,
    fontWeight: '700',
    color: CAPTION_OK_BLUE,
  },
  inputBox: {
    marginHorizontal: 16,
    marginBottom: 6,
    borderRadius: 10,
    backgroundColor: ChecklistDesign.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  input: {
    fontSize: 16,
    lineHeight: 22,
    color: ChecklistDesign.textPrimary,
    minHeight: 56,
    maxHeight: 72,
  },
});
