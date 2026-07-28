/**
 * KrishakBondhu - Premium Community Screen (Forum Feed Hub)
 */

import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  RefreshControl, TextInput, Image, ActivityIndicator, Alert, Modal,
  KeyboardAvoidingView, Platform, ScrollView, Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/constants/colors';
import { postService } from '@/services/posts';
import { Post } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { useFocusEffect, Link, useRouter } from 'expo-router';
import { useAudioRecorder, useAudioRecorderState, RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync } from 'expo-audio';

const { height } = Dimensions.get('window');

export default function CommunityScreen() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const router = useRouter();
  
  // Need to evaluate categories dynamically inside the component so they can be translated
  const CATEGORIES = [
    t('community.all', 'All'), 
    t('community.cropHealth', 'Crop Health'), 
    t('community.fertilizers', 'Fertilizers'), 
    t('community.pestControl', 'Pest Control'), 
    t('community.general', 'General')
  ];

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);

  // Compose States
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const audioState = useAudioRecorderState(audioRecorder);
  const [searching, setSearching] = useState(false);

  const fetchPosts = useCallback(async () => {
    try {
      const data = await postService.getPosts();
      setPosts(data.posts);
    } catch (e) {
      // Failed to fetch posts
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPosts();
    }, [fetchPosts])
  );

  const handleSearch = async (text: string = searchQuery, audioUri?: string) => {
    if (!text && !audioUri) return;
    setSearching(true);
    try {
      const results = await postService.searchPosts(text, audioUri);
      setPosts(results.posts);
      if (audioUri && results.query) {
        setSearchQuery(results.query);
      }
    } catch (e: any) {
      console.error('Search failed:', e?.response?.status, e?.response?.data || e?.message);
      Alert.alert(t('error'), t('searchFailed', 'Failed to perform search.'));
    } finally {
      setSearching(false);
    }
  };

  const handleVoiceSearch = async (uri: string) => {
    handleSearch('', uri);
  };

  const handleTextSearch = async () => {
    handleSearch(searchQuery);
  };

  const startRecording = async () => {
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (permission.granted) {
        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
        });
        await audioRecorder.prepareToRecordAsync();
        audioRecorder.record();
      } else {
        Alert.alert(t('permissionRequired', 'Microphone permission is required for voice input.'));
      }
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (!audioState.isRecording) return;
    try {
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      if (uri) {
        handleVoiceSearch(uri);
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Access Required', 'Permission to access gallery is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Required Fields', 'Please fill in the title and content.');
      return;
    }
    setCreating(true);
    try {
      await postService.createPost({
        title: title.trim(),
        description: content.trim(),
        imageUri: imageUri || undefined,
      });
      setShowCreate(false);
      setTitle('');
      setContent('');
      setImageUri(null);
      fetchPosts();
    } catch (e: any) {
      Alert.alert('Post Failure', e.response?.data?.detail || 'Could not upload post.');
    } finally {
      setCreating(false);
    }
  };

  const handleLike = async (postId: string) => {
    const userId = user?.id;
    if (!userId) return;

    // Optimistic update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const alreadyLiked = p.likes.includes(userId);
        return {
          ...p,
          likes: alreadyLiked
            ? p.likes.filter((id) => id !== userId)
            : [...p.likes, userId],
          like_count: alreadyLiked ? Math.max(0, p.like_count - 1) : p.like_count + 1,
        };
      })
    );

    try {
      const updated = await postService.toggleLike(postId);
      // Reconcile with server state
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                like_count: updated.like_count,
                likes: updated.liked
                  ? (p.likes.includes(userId) ? p.likes : [...p.likes, userId])
                  : p.likes.filter((id) => id !== userId),
              }
            : p
        )
      );
    } catch (error: any) {
      // Revert optimistic update on failure
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          const wasLiked = p.likes.includes(userId);
          return {
            ...p,
            likes: wasLiked
              ? p.likes.filter((id) => id !== userId)
              : [...p.likes, userId],
            like_count: wasLiked ? Math.max(0, p.like_count - 1) : p.like_count + 1,
          };
        })
      );
      Alert.alert('Like Error', error.response?.data?.detail || error.message || 'Failed to like post.');
    }
  };

  const handleDeletePost = (postId: string) => {
    Alert.alert(
      t('community.deleteTitle', 'Delete Post'),
      t('community.deleteConfirm', 'Are you sure you want to delete this post? This action cannot be undone.'),
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('common.delete', 'Delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await postService.deletePost(postId);
              setPosts((prev) => prev.filter((p) => p.id !== postId));
            } catch (e: any) {
              Alert.alert('Error', e.response?.data?.detail || 'Failed to delete post.');
            }
          },
        },
      ]
    );
  };

  const filteredPosts =
    activeCategoryIndex === 0
      ? posts
      : posts.filter(
          (p) =>
            p.title.toLowerCase().includes(CATEGORIES[activeCategoryIndex].toLowerCase()) ||
            p.description.toLowerCase().includes(CATEGORIES[activeCategoryIndex].toLowerCase())
        );

  const renderPost = ({ item }: { item: Post }) => {
    const initials = item.author_name
      ? item.author_name.substring(0, 2).toUpperCase()
      : 'KB';

    return (
      <TouchableOpacity 
        style={styles.postCard} 
        activeOpacity={0.9} 
        onPress={() => router.push({ pathname: '/post/[id]', params: { id: item.id } })}
      >
        {/* Author Header */}
        <View style={styles.postHeader}>
          <View style={styles.authorAvatar}>
            <Text style={styles.authorAvatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.authorName}>{item.author_name}</Text>
            <Text style={styles.postTime}>
              {new Date(item.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>
          {user?.id === item.author_id && (
            <TouchableOpacity style={styles.moreButton} onPress={() => handleDeletePost(item.id)}>
              <Ionicons name="trash-outline" size={18} color="#D32F2F" />
            </TouchableOpacity>
          )}
        </View>

        {/* Post Content */}
        <Text style={styles.postTitle}>{item.title}</Text>
        <Text style={styles.postBody} numberOfLines={4}>
          {item.description}
        </Text>

        {/* Optional Media */}
        {item.image_url && (
          <View style={styles.postImageWrapper}>
            <Image source={{ uri: item.image_url }} style={styles.postImage} />
          </View>
        )}

        {/* Footer Interaction */}
        <View style={styles.postFooter}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              handleLike(item.id);
            }}
          >
            <Ionicons
              name={item.likes.includes(user?.id || '') ? 'heart' : 'heart-outline'}
              size={20}
              color={item.likes.includes(user?.id || '') ? '#D32F2F' : '#E65100'}
            />
            <Text style={[styles.actionButtonText, item.likes.includes(user?.id || '') && { color: '#D32F2F' }]}>
              {item.like_count || 0} {t('community.likes', 'Likes')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={18} color="#5A7265" />
            <Text style={styles.actionButtonText}>
              {item.comment_count || 0} {t('community.replies', 'Replies')}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Bar with Voice */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <TouchableOpacity onPress={() => searchQuery.trim() && handleSearch()}>
            <Ionicons name="search" size={20} color={searchQuery.trim() ? '#0F3A20' : '#8E9F94'} />
          </TouchableOpacity>
          <TextInput
            style={styles.searchInput}
            placeholder={t('community.searchPlaceholder', 'Search for crop diseases, tips...')}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => handleSearch()}
            returnKeyType="search"
          />
          {searchQuery.trim().length > 0 ? (
            <TouchableOpacity onPress={() => { setSearchQuery(''); fetchPosts(); }} style={{ marginRight: 4 }}>
              <Ionicons name="close-circle" size={20} color="#8E9F94" />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity 
          style={[styles.voiceButton, audioState.isRecording && styles.voiceButtonRecording]} 
          onPress={audioState.isRecording ? stopRecording : startRecording}
        >
          <Ionicons name={audioState.isRecording ? "stop" : "mic"} size={22} color="white" />
        </TouchableOpacity>
      </View>

      {/* Searching Indicator */}
      {searching && (
        <View style={styles.searchingBanner}>
          <ActivityIndicator size="small" color="#0F3A20" />
          <Text style={styles.searchingText}>
            {t('community.searching', 'Searching with AI...')}
          </Text>
        </View>
      )}

      {/* Horizontal Tag Filters */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {CATEGORIES.map((cat, index) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.filterChip,
                activeCategoryIndex === index && styles.filterChipActive,
              ]}
              onPress={() => setActiveCategoryIndex(index)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  activeCategoryIndex === index && styles.filterChipTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredPosts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || searching}
            onRefresh={onRefresh}
            tintColor="#0F3A20"
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            {loading ? (
              <ActivityIndicator size="large" color="#0F3A20" />
            ) : (
              <>
                <View style={styles.emptyIconContainer}>
                  <Ionicons
                    name="chatbubbles-outline"
                    size={40}
                    color="#8E9F94"
                  />
                </View>
                <Text style={styles.emptyTitle}>{t('community.feedQuiet', 'Feed is quiet')}</Text>
                <Text style={styles.emptySubtitle}>
                  {t('community.noDiscussions', 'No discussions in this category yet. Start a chat.')}
                </Text>
              </>
            )}
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowCreate(true)}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={26} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Bottom Sheet Post Composer */}
      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            style={styles.modalContent}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>{t('community.composePost', 'Compose Post')}</Text>
              <TouchableOpacity onPress={() => setShowCreate(false)}>
                <Ionicons name="close" size={24} color="#5A7265" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.titleInput}
              placeholder={t('community.postHeadline', 'Post Headline')}
              placeholderTextColor="#8E9F94"
              value={title}
              onChangeText={setTitle}
            />

            <TextInput
              style={styles.contentInput}
              placeholder={t('community.postPlaceholder', 'What agricultural topic or question is on your mind?')}
              placeholderTextColor="#8E9F94"
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
            />

            {imageUri && (
              <View style={styles.attachmentWrapper}>
                <Image
                  source={{ uri: imageUri }}
                  style={styles.attachedImage}
                />
                <TouchableOpacity
                  style={styles.removeImageBtn}
                  onPress={() => setImageUri(null)}
                >
                  <Ionicons name="close-circle" size={22} color="#D32F2F" />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.composerActions}>
              <TouchableOpacity
                style={styles.attachBtn}
                onPress={handlePickImage}
              >
                <Ionicons
                  name="image-outline"
                  size={20}
                  color="#0F3A20"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.attachBtnText}>{t('community.attachImage', 'Attach Image')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitBtn, creating && styles.btnDisabled]}
                onPress={handleCreate}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>{t('community.postFeed', 'Post Feed')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF8F5' },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F5F4',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    color: '#1C2D24',
  },
  voiceButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceButtonRecording: {
    backgroundColor: '#E53935',
  },
  searchingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#E8F5E9',
    gap: 8,
  },
  searchingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F3A20',
  },
  filterSection: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#ECEFF1',
    paddingVertical: 12,
  },
  filterScroll: { paddingHorizontal: 16, gap: 10 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#ECEFF1',
  },
  filterChipActive: {
    backgroundColor: '#0F3A20',
    borderColor: '#0F3A20',
  },
  filterChipText: { fontSize: 13, color: '#5A7265', fontWeight: '700' },
  filterChipTextActive: { color: '#FFFFFF', fontWeight: '800' },
  list: { padding: 16, paddingBottom: 110 },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
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
  moreButton: { padding: 4 },
  postTitle: {
    fontSize: 16,
    fontWeight: '850' as any,
    color: '#1C2D24',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  postBody: { fontSize: 14, color: '#4F6056', lineHeight: 22, marginBottom: 14 },
  postImageWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 14,
  },
  postImage: { width: '100%', height: 180, backgroundColor: '#FAF8F5' },
  postFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#FAF8F5',
    paddingTop: 12,
    gap: 20,
  },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionButtonText: { fontSize: 13, color: '#4F6056', fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 },
  emptyIconContainer: {
    backgroundColor: '#FAF8F5',
    padding: 16,
    borderRadius: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ECEFF1',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C2D24',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#8E9F94',
    textAlign: 'center',
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 104 : 88,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0F3A20',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0F3A20',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: height * 0.8,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#1C2D24' },
  titleInput: {
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1C2D24',
    borderWidth: 1,
    borderColor: '#ECEFF1',
    marginBottom: 14,
    fontWeight: '700',
  },
  contentInput: {
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14.5,
    color: '#1C2D24',
    borderWidth: 1,
    borderColor: '#ECEFF1',
    height: 120,
    marginBottom: 16,
    lineHeight: 20,
  },
  attachmentWrapper: {
    position: 'relative',
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  attachedImage: { width: '100%', height: 150, backgroundColor: '#FAF8F5' },
  removeImageBtn: { position: 'absolute', top: 10, right: 10 },
  composerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#ECEFF1',
  },
  attachBtnText: { fontSize: 13, fontWeight: '700', color: '#0F3A20' },
  submitBtn: {
    backgroundColor: '#0F3A20',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    shadowColor: '#0F3A20',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  btnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 13.5, fontWeight: '850' as any, color: '#FFFFFF' },
});
