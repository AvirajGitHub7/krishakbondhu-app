/**
 * KrishakBondhu - Premium Expert Consultation Screen (Message Center)
 */

import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  RefreshControl, TextInput, Alert, Modal, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { expertService } from '@/services/expert';
import { ExpertRequest } from '@/types';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Image } from 'expo-image';
import { useAudioRecorder, useAudioRecorderState, RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync } from 'expo-audio';

const STATUS_META: Record<string, { color: string; bg: string; label: string }> = {
  pending: { color: '#F57F17', bg: '#FFF8E1', label: 'Pending' },
  in_progress: { color: '#0288D1', bg: '#E1F5FE', label: 'In Progress' },
  resolved: { color: '#2E7D32', bg: '#E8F5E9', label: 'Resolved' },
  closed: { color: '#8E9F94', bg: '#FAF8F5', label: 'Closed' },
};

export default function ExpertScreen() {
  const { t } = useTranslation();
  const [requests, setRequests] = useState<ExpertRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [selectedReq, setSelectedReq] = useState<ExpertRequest | null>(null);
  const [activeSegment, setActiveSegment] = useState<'active' | 'closed' | 'ai'>('active');
  const [imageUri, setImageUri] = useState<string | null>(null);

  // AI Expert States
  const [aiMessages, setAiMessages] = useState<{ query: string; response: string }[]>([]);
  const [aiQuery, setAiQuery] = useState('');
  
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const audioState = useAudioRecorderState(audioRecorder);

  const [aiLoading, setAiLoading] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      const data = await expertService.getMyRequests();
      setRequests(data.requests);
    } catch (e) {
      // Failed to fetch requests
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRequests();
  }, [fetchRequests]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  const handleCreate = async () => {
    if (!title.trim() || !desc.trim()) {
      Alert.alert(t('expert.error', 'Error'), t('expert.fillAllFields', 'Fill all fields'));
      return;
    }
    setCreating(true);
    try {
      await expertService.createRequest({
        title: title.trim(),
        description: desc.trim(),
        imageUri: imageUri || undefined,
      });
      setShowCreate(false);
      setTitle('');
      setDesc('');
      setImageUri(null);
      fetchRequests();
    } catch (e: any) {
      Alert.alert(t('expert.error', 'Error'), e.response?.data?.detail || 'Failed');
    } finally {
      setCreating(false);
    }
  };

  const handleAIAsk = async (text: string = aiQuery, audioUri?: string) => {
    if (!text && !audioUri) return;
    setAiLoading(true);
    setAiQuery(''); // Clear input eagerly
    
    // Optimistic UI update for text and voice queries
    const displayQuery = text || t('expert.voiceRecording', 'Voice message...');
    setAiMessages(prev => [...prev, { query: displayQuery, response: '...' }]);

    try {
      const result = await expertService.askAIExpert(text, audioUri);
      setAiMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1] = result;
        return newMsgs;
      });
    } catch (e: any) {
      console.error('AI Expert failed:', e?.response?.status, e?.response?.data || e?.message);
      Alert.alert(t('error'), e?.response?.data?.detail || t('expert.aiFailed', 'AI Expert failed to respond.'));
      setAiMessages(prev => prev.slice(0, -1)); // Remove optimistic message on error
    } finally {
      setAiLoading(false);
    }
  };

  const startAIRecording = async () => {
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

  const stopAIRecording = async () => {
    if (!audioState.isRecording) return;
    try {
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      if (uri) {
        handleAIAsk('', uri);
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const filteredRequests =
    activeSegment === 'active'
      ? requests.filter((r) => r.status === 'pending' || r.status === 'in_progress')
      : requests.filter((r) => r.status === 'resolved' || r.status === 'closed');

  const renderRequest = ({ item }: { item: ExpertRequest }) => {
    const meta = STATUS_META[item.status] || STATUS_META.pending;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => setSelectedReq(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardTop}>
          <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: meta.color }]} />
            <Text style={[styles.statusBadgeText, { color: meta.color }]}>
              {t(`expert.status_${item.status}`, meta.label)}
            </Text>
          </View>
          <Text style={styles.cardDate}>
            {new Date(item.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        </View>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardDesc} numberOfLines={2}>
          {item.description}
        </Text>
        {item.expert_name && (
          <View style={styles.expertTag}>
            <Ionicons name="person-circle-outline" size={14} color="#2E7D32" />
            <Text style={styles.expertTagText}>{item.expert_name}</Text>
          </View>
        )}
        <View style={styles.cardChevron}>
          <Ionicons name="chevron-forward" size={18} color="#8E9F94" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Segmented Controls */}
      <View style={styles.segmentContainer}>
        <View style={styles.segmentBar}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeSegment === 'active' && styles.segmentBtnActive]}
            onPress={() => setActiveSegment('active')}
          >
            <Text
              style={[
                styles.segmentBtnText,
                activeSegment === 'active' && styles.segmentBtnTextActive,
              ]}
            >
              {t('expert.activeInquiries', 'Active Inquiries')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentBtn, activeSegment === 'closed' && styles.segmentBtnActive]}
            onPress={() => setActiveSegment('closed')}
          >
            <Text
              style={[
                styles.segmentBtnText,
                activeSegment === 'closed' && styles.segmentBtnTextActive,
              ]}
            >
              {t('expert.resolvedHistory', 'Resolved History')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentBtn, activeSegment === 'ai' && styles.segmentBtnActive]}
            onPress={() => setActiveSegment('ai')}
          >
            <Text
              style={[
                styles.segmentBtnText,
                activeSegment === 'ai' && styles.segmentBtnTextActive,
              ]}
            >
              {t('expert.aiExpert', 'AI Expert')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeSegment !== 'ai' && (
        <FlatList
          data={filteredRequests}
          keyExtractor={(item) => item.id}
          renderItem={renderRequest}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0F3A20" />
          }
        ListEmptyComponent={
          <View style={styles.empty}>
            {loading ? (
              <ActivityIndicator size="large" color="#0F3A20" />
            ) : (
              <>
                <View style={styles.emptyIconWrapper}>
                  <Ionicons name="chatbubbles-outline" size={40} color="#8E9F94" />
                </View>
                <Text style={styles.emptyTitle}>
                  {activeSegment === 'active'
                    ? t('expert.noActiveInquiries', 'No active inquiries')
                    : t('expert.noResolvedHistory', 'No resolved history')}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {t('expert.submitQuery', 'Submit a query to connect with agricultural experts.')}
                </Text>
              </>
            )}
          </View>
        }
      />
      )}

      {activeSegment === 'ai' && (
        <KeyboardAvoidingView 
          style={styles.aiContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <FlatList
            style={{ flex: 1 }}
            data={aiMessages}
            keyExtractor={(_, idx) => idx.toString()}
            contentContainerStyle={styles.aiList}
            renderItem={({ item }) => (
              <View style={styles.aiMessageWrapper}>
                <View style={styles.aiUserBubble}>
                  <Text style={styles.aiUserText}>{item.query}</Text>
                </View>
                <View style={styles.aiBotBubble}>
                  {item.response === '...' ? (
                    <ActivityIndicator size="small" color="#2E7D32" />
                  ) : (
                    <Text style={styles.aiBotText}>{item.response}</Text>
                  )}
                </View>
              </View>
            )}
            ListHeaderComponent={
              aiMessages.length > 0 ? (
                <View style={styles.aiDisclaimerBanner}>
                  <Ionicons name="information-circle-outline" size={16} color="#F57F17" />
                  <Text style={styles.aiDisclaimerText}>
                    {t('expert.aiDisclaimer', 'This is an AI-generated response. For complex cases, please consult a human expert.')}
                  </Text>
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={48} color="#C4D4CC" />
                <Text style={styles.emptyText}>
                  {t('expert.aiEmpty', 'Ask KrishakBondhu AI for instant agricultural advice.')}
                </Text>
                <Text style={styles.aiDisclaimerSmall}>
                  {t('expert.aiDisclaimer', 'This is an AI-generated response. For complex cases, please consult a human expert.')}
                </Text>
              </View>
            }
          />
          <View style={styles.aiInputWrapper}>
            <TextInput
              style={styles.aiInput}
              placeholder={t('expert.aiPlaceholder', 'Type or speak your question...')}
              value={aiQuery}
              onChangeText={setAiQuery}
              onSubmitEditing={() => handleAIAsk()}
              placeholderTextColor="#8E9F94"
            />
            {aiQuery.trim().length > 0 ? (
              <TouchableOpacity style={styles.aiSendBtn} onPress={() => handleAIAsk()}>
                <Ionicons name="send" size={20} color="white" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.aiVoiceBtn, audioState.isRecording && styles.aiVoiceBtnActive]} 
                onPress={audioState.isRecording ? stopAIRecording : startAIRecording}
              >
                <Ionicons name={audioState.isRecording ? "stop" : "mic"} size={20} color="white" />
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
      )}

      {activeSegment !== 'ai' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowCreate(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={26} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Create Modal */}
      <Modal visible={showCreate} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modal}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>{t('expert.askExpert', 'Ask an Expert')}</Text>
              <TouchableOpacity onPress={() => setShowCreate(false)}>
                <Ionicons name="close" size={24} color="#5A7265" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder={t('expert.inquiryTitle', 'Inquiry Title')}
              value={title}
              onChangeText={setTitle}
              placeholderTextColor="#8E9F94"
            />
            <TextInput
              style={[styles.input, { height: 120 }]}
              placeholder={t('expert.describeProblem', 'Describe your crop disease, pest issue, or agricultural problem in detail...')}
              value={desc}
              onChangeText={setDesc}
              multiline
              textAlignVertical="top"
              placeholderTextColor="#8E9F94"
            />
            
            <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage} activeOpacity={0.7}>
              <Ionicons name="camera-outline" size={20} color="#5A7265" />
              <Text style={styles.imagePickerText}>
                {imageUri ? 'Change Attached Image' : 'Attach an Image'}
              </Text>
            </TouchableOpacity>

            {imageUri && (
              <View style={styles.previewContainer}>
                <Image source={{ uri: imageUri }} style={styles.previewImage} />
                <TouchableOpacity style={styles.removeImageBtn} onPress={() => setImageUri(null)}>
                  <Ionicons name="close-circle" size={24} color="#FF5252" />
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={[styles.submitBtn, creating && { opacity: 0.7 }]}
              onPress={handleCreate}
              disabled={creating}
              activeOpacity={0.8}
            >
              {creating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>{t('expert.submitRequest', 'Submit Request')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Detail Modal — Chat Thread Layout */}
      <Modal visible={!!selectedReq} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>{t('expert.consultationThread', 'Consultation Thread')}</Text>
              <TouchableOpacity onPress={() => setSelectedReq(null)}>
                <Ionicons name="close" size={24} color="#5A7265" />
              </TouchableOpacity>
            </View>
            {selectedReq && (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
                {/* Status + Date Header */}
                <View style={styles.threadMeta}>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: STATUS_META[selectedReq.status]?.bg },
                    ]}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: STATUS_META[selectedReq.status]?.color },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusBadgeText,
                        { color: STATUS_META[selectedReq.status]?.color },
                      ]}
                    >
                      {t(`expert.status_${selectedReq.status}`, STATUS_META[selectedReq.status]?.label)}
                    </Text>
                  </View>
                  <Text style={styles.threadDate}>
                    {new Date(selectedReq.created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                </View>

                {/* Farmer Message Bubble (right-aligned) */}
                <View style={styles.farmerBubbleRow}>
                  <View style={styles.farmerBubble}>
                    <Text style={styles.bubbleSender}>{t('expert.you', 'You')}</Text>
                    <Text style={styles.farmerBubbleTitle}>{selectedReq.title}</Text>
                    <Text style={styles.farmerBubbleText}>{selectedReq.description}</Text>
                    {selectedReq.image_url && (
                      <Image 
                        source={{ uri: selectedReq.image_url }} 
                        style={styles.threadImage}
                        contentFit="cover"
                        transition={300}
                      />
                    )}
                  </View>
                </View>

                {/* Expert Response Bubble (left-aligned) */}
                {selectedReq.expert_response ? (
                  <View style={styles.expertBubbleRow}>
                    <View style={styles.expertAvatarCircle}>
                      <Ionicons name="school-outline" size={18} color="#2E7D32" />
                    </View>
                    <View style={styles.expertBubble}>
                      <Text style={styles.expertBubbleSender}>
                        {selectedReq.expert_name || 'Agriculture Expert'}
                      </Text>
                      <Text style={styles.expertSubLabel}>{t('expert.verifiedAdvisor', 'Verified Professional Advisor')}</Text>
                      <Text style={styles.expertBubbleText}>
                        {selectedReq.expert_response}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.waitingBox}>
                    <Ionicons name="hourglass-outline" size={22} color="#F57F17" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.waitingTitle}>{t('expert.awaitingResponse', 'Awaiting Advisor Response')}</Text>
                      <Text style={styles.waitingDesc}>
                        {t('expert.awaitingDesc', 'Our registered agricultural scientists will review your query shortly.')}
                      </Text>
                    </View>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF8F5' },
  aiContainer: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    marginBottom: Platform.OS === 'ios' ? 88 : 68,
  },
  aiList: {
    padding: 16,
    paddingBottom: 24,
  },
  aiMessageWrapper: {
    marginBottom: 16,
  },
  aiUserBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#0F3A20',
    padding: 12,
    borderRadius: 16,
    borderBottomRightRadius: 4,
    maxWidth: '80%',
    marginBottom: 8,
  },
  aiUserText: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  aiBotBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    maxWidth: '90%',
    borderWidth: 1,
    borderColor: '#ECEFF1',
  },
  aiBotText: {
    color: '#1C2D24',
    fontSize: 15,
    lineHeight: 22,
  },
  aiInputWrapper: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#ECEFF1',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  aiInput: {
    flex: 1,
    backgroundColor: '#F3F5F4',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    marginRight: 10,
  },
  aiSendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiVoiceBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0F3A20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiVoiceBtnActive: {
    backgroundColor: '#D32F2F',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    marginTop: 16,
    color: '#8E9F94',
    fontSize: 15,
    textAlign: 'center',
  },
  aiDisclaimerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  aiDisclaimerText: {
    flex: 1,
    fontSize: 11,
    color: '#F57F17',
    fontWeight: '600',
    lineHeight: 16,
  },
  aiDisclaimerSmall: {
    marginTop: 12,
    fontSize: 11,
    color: '#B0BEC5',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 20,
  },
  segmentContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#ECEFF1',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  segmentBar: {
    flexDirection: 'row',
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F3A20',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  segmentBtnText: { fontSize: 13, color: '#5A7265', fontWeight: '700' },
  segmentBtnTextActive: { color: '#0F3A20', fontWeight: '800' },
  list: { padding: 16, paddingBottom: 110 },
  card: {
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
    position: 'relative',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 6,
  },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  statusBadgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  cardDate: { fontSize: 11, color: '#8E9F94' },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C2D24',
    marginBottom: 6,
    paddingRight: 24,
  },
  cardDesc: { fontSize: 14, color: '#4F6056', lineHeight: 20, paddingRight: 24 },
  expertTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  expertTagText: { fontSize: 12, fontWeight: '700', color: '#2E7D32' },
  cardChevron: {
    position: 'absolute',
    right: 18,
    top: '50%',
  },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 },
  emptyIconWrapper: {
    backgroundColor: '#FAF8F5',
    padding: 16,
    borderRadius: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ECEFF1',
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1C2D24', marginBottom: 4 },
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
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '85%',
  },
  modalHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#1C2D24' },
  input: {
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1C2D24',
    borderWidth: 1,
    borderColor: '#ECEFF1',
    marginBottom: 14,
  },
  submitBtn: {
    backgroundColor: '#0F3A20',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: '#0F3A20',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  submitText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
  // Chat Thread Styles
  threadMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  threadDate: { fontSize: 12, color: '#8E9F94' },
  farmerBubbleRow: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  farmerBubble: {
    backgroundColor: '#E8F5E9',
    borderRadius: 20,
    borderBottomRightRadius: 6,
    padding: 16,
    maxWidth: '85%',
  },
  bubbleSender: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2E7D32',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  farmerBubbleTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1C2D24',
    marginBottom: 6,
  },
  farmerBubbleText: {
    fontSize: 13.5,
    color: '#4F6056',
    lineHeight: 20,
  },
  expertBubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 16,
  },
  expertAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  expertBubble: {
    backgroundColor: '#FAF8F5',
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    padding: 16,
    flex: 1,
    borderWidth: 1,
    borderColor: '#ECEFF1',
  },
  expertBubbleSender: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F3A20',
    marginBottom: 2,
  },
  expertSubLabel: {
    fontSize: 11,
    color: '#8E9F94',
    marginBottom: 8,
  },
  expertBubbleText: {
    fontSize: 13.5,
    color: '#4F6056',
    lineHeight: 20,
  },
  waitingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFF8E1',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  waitingTitle: { fontSize: 14, fontWeight: '800', color: '#F57F17' },
  waitingDesc: {
    fontSize: 12,
    color: '#5A7265',
    marginTop: 2,
    lineHeight: 16,
  },
  imagePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#ECEFF1',
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    justifyContent: 'center',
  },
  imagePickerText: {
    fontSize: 14,
    color: '#5A7265',
    fontWeight: '600',
  },
  previewContainer: {
    position: 'relative',
    marginBottom: 14,
    borderRadius: 14,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 150,
    borderRadius: 14,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 12,
  },
  threadImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginTop: 12,
    backgroundColor: '#F5F5F5',
  },
});
