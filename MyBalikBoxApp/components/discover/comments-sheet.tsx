import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Modal, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DiscoverAvatar } from '@/components/discover/avatar';
import { ChecklistDesign } from '@/constants/checklist-design';
import type { DiscoverComment, DiscoverPost } from '@/services/discover-feed';

function formatRelativeTime(value: string): string {
  const created = new Date(value).getTime();
  const deltaMs = Math.max(0, Date.now() - created);
  const minute = 60 * 1000;
  const hour = 60 * minute;

  if (deltaMs < hour) {
    const minutes = Math.max(1, Math.floor(deltaMs / minute));
    return `${minutes} hr${minutes === 1 ? '' : 's'} ago`;
  }

  const hours = Math.max(1, Math.floor(deltaMs / hour));
  return `${hours} hr${hours === 1 ? '' : 's'} ago`;
}

type Props = {
  visible: boolean;
  post: DiscoverPost | null;
  viewerName: string;
  viewerAvatarUrl?: string | null;
  comments: DiscoverComment[];
  loading: boolean;
  submitting: boolean;
  draft: string;
  onDraftChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export function DiscoverCommentsSheet({
  visible,
  post,
  viewerName,
  viewerAvatarUrl,
  comments,
  loading,
  submitting,
  draft,
  onDraftChange,
  onClose,
  onSubmit,
}: Props) {
  const insets = useSafeAreaInsets();
  const bottomGap = Math.max(insets.bottom + 92, 98);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: bottomGap }]}>
          <Pressable onPress={onClose} style={styles.chevronWrap} accessibilityRole="button">
            <MaterialIcons name="keyboard-arrow-down" size={26} color="#FFFFFF" />
          </Pressable>

          <Text style={styles.title}>Comments ({post?.commentCount ?? comments.length})</Text>
          {post ? <Text style={styles.subtitle} numberOfLines={2}>{post.caption}</Text> : null}

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {loading ? <Text style={styles.helper}>Loading comments…</Text> : null}
            {!loading && comments.length === 0 ? <Text style={styles.helper}>No comments yet.</Text> : null}

            {comments.map((comment) => (
              <View key={comment.id} style={styles.comment}>
                <DiscoverAvatar name={comment.authorName} avatarUrl={comment.authorAvatarUrl} size={26} />
                <View style={styles.commentBody}>
                  <Text style={styles.commentAuthor}>{comment.authorName}</Text>
                  <Text style={styles.commentText}>{comment.body}</Text>
                  <View style={styles.commentMeta}>
                    <Text style={styles.commentMetaText}>{formatRelativeTime(comment.createdAt)}</Text>
                    <Text style={styles.commentMetaText}>Reply</Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.composerRow}>
            <DiscoverAvatar name={viewerName} avatarUrl={viewerAvatarUrl} size={24} />
            <View style={styles.composer}>
              <TextInput
                value={draft}
                onChangeText={onDraftChange}
                placeholder="Add a comment..."
                placeholderTextColor="#8F8F90"
                style={styles.input}
                editable={!submitting}
              />
              <Pressable onPress={onSubmit} disabled={submitting} accessibilityRole="button">
                <MaterialIcons name="send" size={18} color="#2E7CF6" />
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.14)',
  },
  sheet: {
    maxHeight: '78%',
    backgroundColor: '#4D4D4D',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  chevronWrap: {
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    textAlign: 'center',
    color: '#F5F0E7',
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
    color: '#D7D1C6',
    fontSize: 14,
    lineHeight: 20,
  },
  list: {
    maxHeight: 340,
  },
  helper: {
    color: '#E6DED1',
    textAlign: 'center',
    paddingVertical: 24,
  },
  comment: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 18,
  },
  commentBody: {
    flex: 1,
  },
  commentAuthor: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  commentText: {
    marginTop: 4,
    color: '#F1F1F1',
    fontSize: 15,
    lineHeight: 21,
  },
  commentMeta: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 6,
  },
  commentMetaText: {
    color: '#D5CEC4',
    fontSize: 12,
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 18,
  },
  composer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 18,
    backgroundColor: '#D9D9D9',
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  input: {
    flex: 1,
    color: ChecklistDesign.textPrimary,
    fontSize: 14,
    paddingVertical: 4,
  },
});
