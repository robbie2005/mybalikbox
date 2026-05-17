import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
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

import { ProfileAvatar } from '@/components/profile-avatar';
import type { FeedPostComment } from '@/constants/feed';
import {
  createFeedPostComment,
  fetchFeedPostComments,
  likeFeedPostComment,
  mentionHandle,
  replyMentionHandle,
} from '@/services/feed-comments';

const SHEET_BG = '#3A3A3A';
const TEXT_PRIMARY = '#FFFFFF';
const TEXT_MUTED = '#B0B0B0';
const MENTION_COLOR = '#7EB8FF';
const INPUT_BG = '#D4D4D4';
const INPUT_PLACEHOLDER = '#6B6B6B';
const SEND_BLUE = '#2F80ED';
const LIKE_RED = '#D64545';
const REPLY_INDENT = 44;

type ReplyTarget = {
  commentId: string;
  authorName: string;
  authorUsername: string | null;
};

type CommentsSheetProps = {
  visible: boolean;
  postId: string;
  currentUserAvatarUri: string | null;
  onClose: () => void;
  onCommentAdded?: (postId: string) => void;
};

export function CommentsSheet({
  visible,
  postId,
  currentUserAvatarUri,
  onClose,
  onCommentAdded,
}: CommentsSheetProps) {
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const [comments, setComments] = useState<FeedPostComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [draft, setDraft] = useState('');
  const [replyingTo, setReplyingTo] = useState<ReplyTarget | null>(null);

  const loadComments = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    try {
      const rows = await fetchFeedPostComments(postId);
      setComments(rows);
    } catch (err) {
      Alert.alert('Comments', err instanceof Error ? err.message : 'Could not load comments.');
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    if (!visible) {
      setDraft('');
      setComments([]);
      setReplyingTo(null);
      return;
    }
    void loadComments();
  }, [visible, loadComments]);

  const canSend = draft.trim().length > 0 && !submitting;

  const onCancelReply = () => {
    setReplyingTo(null);
  };

  const onStartReply = (comment: FeedPostComment) => {
    setReplyingTo({
      commentId: comment.id,
      authorName: comment.authorName,
      authorUsername: comment.authorUsername,
    });
    setTimeout(() => inputRef.current?.focus(), 80);
  };

  const onLikeComment = (commentId: string) => {
    let previous: FeedPostComment | undefined;
    setComments((current) =>
      current.map((comment) => {
        if (comment.id !== commentId || comment.likedByMe) return comment;
        previous = comment;
        return {
          ...comment,
          likedByMe: true,
          likeCount: comment.likeCount + 1,
        };
      }),
    );
    if (!previous) return;

    void likeFeedPostComment(commentId).catch((err) => {
      setComments((current) =>
        current.map((comment) => (comment.id === commentId ? previous! : comment)),
      );
      Alert.alert('Like', err instanceof Error ? err.message : 'Could not like this comment.');
    });
  };

  const onSubmit = async () => {
    const text = draft.trim();
    if (!text || submitting) return;

    setSubmitting(true);
    try {
      const comment = await createFeedPostComment({
        postId,
        body: text,
        parentId: replyingTo?.commentId ?? null,
        replyToAuthorName: replyingTo?.authorName ?? null,
        replyToUsername: replyingTo?.authorUsername ?? null,
      });
      setComments((current) => [...current, comment]);
      setDraft('');
      setReplyingTo(null);
      onCommentAdded?.(postId);
    } catch (err) {
      Alert.alert('Comment', err instanceof Error ? err.message : 'Could not post comment.');
    } finally {
      setSubmitting(false);
    }
  };

  const replyPlaceholder = replyingTo
    ? `Reply to @${mentionHandle({
        authorUsername: replyingTo.authorUsername,
        authorName: replyingTo.authorName,
      })}`
    : 'Add a comment...';

  const renderCommentBody = (item: FeedPostComment) => {
    const mention = replyMentionHandle(item);
    if (!item.parentId || !mention) {
      return <Text style={styles.commentText}>{item.body}</Text>;
    }

    return (
      <Text style={styles.commentText}>
        <Text style={styles.mentionText}>@{mention} </Text>
        {item.body}
      </Text>
    );
  };

  const renderComment = ({ item }: { item: FeedPostComment }) => (
    <View style={[styles.commentRow, item.parentId ? styles.commentRowReply : null]}>
      <ProfileAvatar uri={item.authorAvatarUri} size={40} style={styles.commentAvatar} />
      <View style={styles.commentBody}>
        <Text style={styles.commentAuthor}>{item.authorName}</Text>
        {renderCommentBody(item)}
        <View style={styles.commentMeta}>
          <Text style={styles.commentTime}>{item.timeAgo}</Text>
          <Pressable
            onPress={() => onStartReply(item)}
            accessibilityRole="button"
            accessibilityLabel={`Reply to ${item.authorName}`}
            hitSlop={8}>
            <Text style={styles.replyText}>Reply</Text>
          </Pressable>
        </View>
      </View>
      <View style={styles.likeColumn}>
        <Pressable
          onPress={() => onLikeComment(item.id)}
          disabled={item.likedByMe}
          accessibilityRole="button"
          accessibilityLabel={item.likedByMe ? 'Liked comment' : 'Like comment'}
          accessibilityState={{ disabled: item.likedByMe }}
          hitSlop={8}>
          <MaterialIcons
            name={item.likedByMe ? 'favorite' : 'favorite-border'}
            size={22}
            color={item.likedByMe ? LIKE_RED : TEXT_PRIMARY}
          />
        </Pressable>
        <Text style={styles.likeCount}>{item.likeCount}</Text>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" />
        <View style={styles.sheet}>
          <Pressable
            style={styles.handleArea}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close comments">
            <MaterialIcons name="keyboard-arrow-down" size={32} color={TEXT_PRIMARY} />
          </Pressable>

          <Text style={styles.title}>Comments ({comments.length})</Text>

          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={TEXT_MUTED} />
            </View>
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(item) => item.id}
              renderItem={renderComment}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No comments yet. Be the first to comment.</Text>
              }
            />
          )}

          {replyingTo ? (
            <View style={styles.replyBanner}>
              <Text style={styles.replyBannerText} numberOfLines={1}>
                Replying to @
                {mentionHandle({
                  authorUsername: replyingTo.authorUsername,
                  authorName: replyingTo.authorName,
                })}
              </Text>
              <Pressable
                onPress={onCancelReply}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Cancel reply">
                <MaterialIcons name="close" size={20} color={TEXT_MUTED} />
              </Pressable>
            </View>
          ) : null}

          <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
            <ProfileAvatar uri={currentUserAvatarUri} size={36} style={styles.composerAvatar} />
            <Pressable
              style={styles.inputPill}
              onPress={() => inputRef.current?.focus()}
              accessibilityRole="none">
              <TextInput
                ref={inputRef}
                style={styles.input}
                value={draft}
                onChangeText={setDraft}
                placeholder={replyPlaceholder}
                placeholderTextColor={INPUT_PLACEHOLDER}
                multiline
                maxLength={500}
                returnKeyType="send"
                blurOnSubmit={false}
                onSubmitEditing={() => {
                  if (canSend) void onSubmit();
                }}
                accessibilityLabel={replyPlaceholder}
              />
              {canSend ? (
                <Pressable
                  style={styles.sendButton}
                  onPress={() => void onSubmit()}
                  accessibilityRole="button"
                  accessibilityLabel="Post comment">
                  {submitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <MaterialIcons name="arrow-upward" size={20} color="#FFFFFF" />
                  )}
                </Pressable>
              ) : null}
            </Pressable>
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
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sheet: {
    backgroundColor: SHEET_BG,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: '88%',
    minHeight: '52%',
  },
  handleArea: {
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 2,
  },
  title: {
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: TEXT_PRIMARY,
    marginBottom: 12,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  list: {
    flexGrow: 0,
    flexShrink: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexGrow: 1,
  },
  emptyText: {
    textAlign: 'center',
    color: TEXT_MUTED,
    fontSize: 15,
    marginTop: 24,
    paddingHorizontal: 24,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 22,
    gap: 12,
  },
  commentRowReply: {
    marginLeft: REPLY_INDENT,
  },
  commentAvatar: {
    backgroundColor: '#E8E8E8',
  },
  commentBody: {
    flex: 1,
    paddingRight: 4,
  },
  commentAuthor: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 4,
  },
  commentText: {
    fontSize: 15,
    lineHeight: 21,
    color: TEXT_PRIMARY,
    fontWeight: '400',
  },
  mentionText: {
    color: MENTION_COLOR,
    fontWeight: '600',
  },
  commentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 8,
  },
  commentTime: {
    fontSize: 13,
    color: TEXT_MUTED,
    fontWeight: '500',
  },
  replyText: {
    fontSize: 13,
    color: TEXT_PRIMARY,
    fontWeight: '600',
  },
  likeColumn: {
    alignItems: 'center',
    minWidth: 28,
    gap: 2,
  },
  likeCount: {
    fontSize: 12,
    fontWeight: '600',
    color: TEXT_MUTED,
    textAlign: 'center',
  },
  replyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
  },
  replyBannerText: {
    flex: 1,
    fontSize: 13,
    color: TEXT_MUTED,
    fontWeight: '500',
    marginRight: 8,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
  },
  composerAvatar: {
    marginBottom: 6,
    backgroundColor: '#E8E8E8',
  },
  inputPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: INPUT_BG,
    borderRadius: 24,
    paddingLeft: 16,
    paddingRight: 6,
    minHeight: 44,
    maxHeight: 100,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
    paddingVertical: 10,
    maxHeight: 88,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: SEND_BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    marginBottom: 4,
  },
});
