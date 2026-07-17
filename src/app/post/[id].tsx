import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { postService } from '@/services/posts';
import { Post, Comment } from '@/types';
import { useAuthStore } from '@/store/authStore';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPostDetails = useCallback(async () => {
    if (!id) return;
    try {
      const [fetchedPost, fetchedComments] = await Promise.all([
        postService.getPost(id),
        postService.getComments(id),
      ]);
      setPost(fetchedPost);
      setComments(fetchedComments);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to load post details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPostDetails();
  }, [fetchPostDetails]);

  const handleLike = async () => {
    if (!post || !user?.id) return;
    const userId = user.id;
    const alreadyLiked = post.likes.includes(userId);

    // Optimistic update
    setPost({
      ...post,
      likes: alreadyLiked
        ? post.likes.filter((id) => id !== userId)
        : [...post.likes, userId],
      like_count: alreadyLiked ? Math.max(0, post.like_count - 1) : post.like_count + 1,
    });

    try {
      const updated = await postService.toggleLike(post.id);
      setPost((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          like_count: updated.like_count,
          likes: updated.liked
            ? (prev.likes.includes(userId) ? prev.likes : [...prev.likes, userId])
            : prev.likes.filter((id) => id !== userId),
        };
      });
    } catch (error: any) {
      // Revert on failure
      setPost((prev) => {
        if (!prev) return prev;
        const wasLiked = prev.likes.includes(userId);
        return {
          ...prev,
          likes: wasLiked
            ? prev.likes.filter((id) => id !== userId)
            : [...prev.likes, userId],
          like_count: wasLiked ? Math.max(0, prev.like_count - 1) : prev.like_count + 1,
        };
      });
      Alert.alert('Like Error', error.response?.data?.detail || error.message || 'Failed to like post.');
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !post) return;
    setSubmitting(true);
    try {
      const newComment = await postService.addComment(post.id, commentText.trim());
      setComments([newComment, ...comments]);
      setCommentText('');
      setPost({ ...post, comment_count: (post.comment_count || 0) + 1 });
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to post comment.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderHeader = () => {
    if (!post) return null;
    const initials = post.author_name ? post.author_name.substring(0, 2).toUpperCase() : 'KB';

    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <View style={styles.authorAvatar}>
            <Text style={styles.authorAvatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.authorName}>{post.author_name}</Text>
            <Text style={styles.postTime}>
              {new Date(post.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>

        <Text style={styles.postTitle}>{post.title}</Text>
        <Text style={styles.postBody}>{post.description}</Text>

        {post.image_url && (
          <View style={styles.postImageWrapper}>
            <Image source={{ uri: post.image_url }} style={styles.postImage} />
          </View>
        )}

        <View style={styles.postFooter}>
          <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
            <Ionicons
              name={post.likes.includes(user?.id || '') ? 'heart' : 'heart-outline'}
              size={20}
              color={post.likes.includes(user?.id || '') ? '#D32F2F' : '#E65100'}
            />
            <Text style={[styles.actionButtonText, post.likes.includes(user?.id || '') && { color: '#D32F2F' }]}>
              {post.like_count || 0} {t('community.likes', 'Likes')}
            </Text>
          </TouchableOpacity>

          <View style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={18} color="#5A7265" />
            <Text style={styles.actionButtonText}>
              {post.comment_count || 0} {t('community.replies', 'Replies')}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderComment = ({ item }: { item: Comment }) => {
    const initials = item.author_name ? item.author_name.substring(0, 2).toUpperCase() : 'U';

    return (
      <View style={styles.commentCard}>
        <View style={styles.commentAvatar}>
          <Text style={styles.commentAvatarText}>{initials}</Text>
        </View>
        <View style={styles.commentContent}>
          <View style={styles.commentHeader}>
            <Text style={styles.commentAuthor}>{item.author_name}</Text>
            <Text style={styles.commentTime}>
              {new Date(item.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>
          <Text style={styles.commentText}>{item.content}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0F3A20" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        data={comments}
        keyExtractor={(item) => item.id}
        renderItem={renderComment}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={48} color="#C4D4CB" />
            <Text style={styles.emptyText}>{t('community.noComments', 'No comments yet. Be the first to reply!')}</Text>
          </View>
        }
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={t('community.writeComment', 'Write a reply...')}
          placeholderTextColor="#8E9F94"
          value={commentText}
          onChangeText={setCommentText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!commentText.trim() || submitting) && styles.sendButtonDisabled]}
          onPress={handleSubmitComment}
          disabled={!commentText.trim() || submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="send" size={18} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#ECEFF1',
    shadowColor: '#0F3A20',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 1,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorAvatarText: { fontSize: 13, fontWeight: '800', color: '#2E7D32' },
  authorName: { fontSize: 15, fontWeight: '800', color: '#1C2D24' },
  postTime: {
    fontSize: 11,
    color: '#8E9F94',
    marginTop: 1,
    fontWeight: '500',
  },
  postTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C2D24',
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  postBody: { fontSize: 15, color: '#4F6056', lineHeight: 24, marginBottom: 16 },
  postImageWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  postImage: { width: '100%', height: 220, backgroundColor: '#FAF8F5' },
  postFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#FAF8F5',
    paddingTop: 14,
    gap: 20,
  },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  actionButtonText: { fontSize: 13, fontWeight: '600', color: '#5A7265' },
  
  // Comments
  commentCard: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F4F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentAvatarText: { fontSize: 12, fontWeight: '700', color: '#5A7265' },
  commentContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECEFF1',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  commentAuthor: { fontSize: 13, fontWeight: '700', color: '#1C2D24' },
  commentTime: { fontSize: 11, color: '#8E9F94' },
  commentText: { fontSize: 14, color: '#4F6056', lineHeight: 20 },
  
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#8E9F94',
    textAlign: 'center',
  },
  
  // Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#ECEFF1',
  },
  input: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    minHeight: 40,
    maxHeight: 100,
    fontSize: 15,
    color: '#1C2D24',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0F3A20',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    marginBottom: 2,
  },
  sendButtonDisabled: {
    backgroundColor: '#C4D4CB',
  },
});
