/**
 * KrishakBondhu - Premium Home Screen (Agri-Intelligence Dashboard)
 */

import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Alert, Dimensions, TextInput, LayoutAnimation, Platform, UIManager,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/constants/colors';
import { diseaseService } from '@/services/disease';
import { postService } from '@/services/posts';
import { expertService } from '@/services/expert';
import { DiseaseResult, Post } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { t } = useTranslation();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiseaseResult | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'remedies' | 'prevention'>('overview');
  const [cropType, setCropType] = useState('');

  // Farmer Insights & Expert Advice
  const [farmerInsights, setFarmerInsights] = useState<Post[]>([]);
  const [expertAdvice, setExpertAdvice] = useState<string | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [expertLoading, setExpertLoading] = useState(false);
  const [expandedSection, setExpandedSection] = useState<'diagnosis' | 'insights' | 'expert'>('diagnosis');

  const toggleSection = (section: 'diagnosis' | 'insights' | 'expert') => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSection(prev => prev === section ? section : section);
  };

  const pickImage = async (useCamera: boolean) => {
    const permissionResult = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Access Required', `Allow ${useCamera ? 'camera' : 'gallery'} permission to continue.`);
      return;
    }

    const pickerResult = useCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });

    if (!pickerResult.canceled && pickerResult.assets[0]) {
      setImageUri(pickerResult.assets[0].uri);
      setResult(null);
    }
  };

  const analyzeImage = async () => {
    if (!imageUri) return;
    setLoading(true);
    setFarmerInsights([]);
    setExpertAdvice(null);
    try {
      const prediction = await diseaseService.predict(imageUri);
      setResult(prediction);
      setActiveTab('overview');
      setExpandedSection('diagnosis');

      // Build search query from disease name + crop type
      const diseaseName = prediction.disease_name.replace(/_/g, ' ');
      const searchQuery = cropType.trim()
        ? `${diseaseName} ${cropType.trim()}`
        : diseaseName;

      // Fetch farmer insights (community posts)
      setInsightsLoading(true);
      postService.searchPosts(searchQuery)
        .then(res => setFarmerInsights(res.posts.slice(0, 5)))
        .catch(() => setFarmerInsights([]))
        .finally(() => setInsightsLoading(false));

      // Fetch expert advice (AI consult)
      const expertPrompt = `I found ${diseaseName} on my ${cropType.trim() || 'crop'}. `
        + (prediction.symptoms?.length ? `Symptoms: ${prediction.symptoms.join(', ')}. ` : '')
        + `What should I do? Give practical treatment steps and prevention advice.`;
      setExpertLoading(true);
      expertService.askAIExpert(expertPrompt)
        .then(res => setExpertAdvice(res.response))
        .catch(() => setExpertAdvice('Unable to fetch expert advice at this time. Please try again later.'))
        .finally(() => setExpertLoading(false));

    } catch (error: any) {
      const message = error.response?.data?.detail || t('home.analysisFailed', 'Analysis failed. Please try again.');
      Alert.alert(t('home.diagnosticFailure', 'Diagnostic Failure'), message);
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setImageUri(null);
    setResult(null);
    setCropType('');
    setFarmerInsights([]);
    setExpertAdvice(null);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Premium Hero Header with Diagonal Crop */}
      <View style={{ backgroundColor: '#0F3A20', paddingTop: 30, paddingHorizontal: 20 }}>
        <View style={styles.heroHeader}>
          <View style={styles.heroIconBadge}>
            <Ionicons name="leaf-outline" size={26} color="#0F3A20" />
          </View>
          <View>
            <Text style={[styles.heroTitle, { color: '#FFFFFF' }]}>{t('home.cropDiagnostics', 'Crop Diagnostics')}</Text>
          </View>
        </View>
      </View>
      
      {/* SVG Diagonal Crop Transition */}
      <View style={{ backgroundColor: '#0F3A20', height: 40, width: '100%', marginTop: -1, zIndex: 1 }}>
        <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <Path d="M0 100 L100 0 L100 100 Z" fill="#FAF8F5" />
        </Svg>
      </View>

      {!imageUri && (
        <View style={{ alignItems: 'center', marginTop: 10, marginBottom: 16 }}>
          <Image 
            source={require('../../../assets/images/home_illustration.svg')}
            style={{ width: '90%', height: 320 }} 
            contentFit="contain"
          />
        </View>
      )}

      {/* Caution Card - Better Accuracy Tip */}
      {!imageUri && (
        <View style={styles.cautionCard}>
          <LinearGradient
            colors={['#FFF8E1', '#FFFDE7']}
            style={styles.cautionGradient}
          >
            <View style={styles.cautionIconCircle}>
              <Ionicons name="leaf" size={20} color="#E65100" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cautionTitle}>
                {t('home.cautionTitle', 'Tip for Better Results')}
              </Text>
              <Text style={styles.cautionText}>
                {t('home.cautionText', 'For better accuracy, upload a clear, well-lit image of the affected leaf against a plain background.')}
              </Text>
            </View>
          </LinearGradient>
        </View>
      )}

      {/* Visual Diagnostic Center */}
      {imageUri && (
        <View style={styles.previewSection}>
          <View style={styles.viewfinderWrapper}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
            
            {/* Viewfinder Focus Corners */}
            <View style={[styles.focusCorner, styles.topLeft]} />
            <View style={[styles.focusCorner, styles.topRight]} />
            <View style={[styles.focusCorner, styles.bottomLeft]} />
            <View style={[styles.focusCorner, styles.bottomRight]} />

            <TouchableOpacity style={styles.imageResetBadge} onPress={resetState}>
              <Ionicons name="close" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {!result && (
            <>
              {/* Crop Type Input */}
              <View style={styles.cropTypeContainer}>
                <View style={styles.cropTypeIconWrap}>
                  <Ionicons name="nutrition-outline" size={18} color="#2E7D32" />
                </View>
                <TextInput
                  style={styles.cropTypeInput}
                  placeholder={t('home.cropTypePlaceholder', 'Enter crop type (e.g., Rice, Tomato, Wheat...)')}
                  placeholderTextColor="#8E9F94"
                  value={cropType}
                  onChangeText={setCropType}
                />
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.iconBtn} onPress={resetState}>
                  <Ionicons name="camera-outline" size={24} color="#1C2D24" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.analyzeBtn, loading && styles.btnDisabled]}
                  onPress={analyzeImage}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="analytics-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.analyzeBtnText}>{t('home.runDiagnosis', 'Run Diagnosis')}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      )}

      {/* === SECTION 1: AI Model Diagnosis === */}
      {result && (
        <View style={{ marginHorizontal: 8, marginBottom: 0 }}>
          <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('diagnosis')} activeOpacity={0.8}>
            <LinearGradient colors={['#0F3A20', '#1B5E20']} style={styles.sectionHeaderGradient}>
              <View style={styles.sectionHeaderIcon}>
                <Ionicons name="flask-outline" size={18} color="#FFFFFF" />
              </View>
              <Text style={styles.sectionHeaderText}>{t('home.aiDiagnosis', 'AI Model Diagnosis')}</Text>
              <Ionicons name={expandedSection === 'diagnosis' ? 'chevron-up' : 'chevron-down'} size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
      {result && expandedSection === 'diagnosis' && (
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <View style={{ flex: 1, paddingRight: 16 }}>
              <Text style={styles.resultMetaLabel}>{t('home.diagnosticReport', 'DIAGNOSTIC REPORT')}</Text>
              <Text style={styles.resultTitle}>{result.disease_name.replace(/_/g, ' ')}</Text>
            </View>
            <View style={styles.confidenceCircleWrapper}>
              <View style={[styles.confidenceBadge, {
                backgroundColor: result.confidence > 0.8 ? '#E8F5E9' : result.confidence > 0.5 ? '#FFF8E1' : '#FFEBEE',
              }]}>
                <Text style={[styles.confidenceText, {
                  color: result.confidence > 0.8 ? '#2E7D32' : result.confidence > 0.5 ? '#F57F17' : '#D32F2F',
                }]}>
                  {(result.confidence * 100).toFixed(0)}{t('home.match', '% Match').replace('%', '')}%
                </Text>
              </View>
              {/* Premium Progress Bar */}
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { 
                  width: `${result.confidence * 100}%`,
                  backgroundColor: result.confidence > 0.8 ? '#2E7D32' : result.confidence > 0.5 ? '#F57F17' : '#D32F2F'
                }]} />
              </View>
            </View>
          </View>

          {/* Segmented Controller Tab Headers */}
          <View style={styles.tabBar}>
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'overview' && styles.tabButtonActive]} 
              onPress={() => setActiveTab('overview')}
            >
              <Text style={[styles.tabButtonText, activeTab === 'overview' && styles.tabButtonTextActive]}>{t('home.overview', 'Overview')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'remedies' && styles.tabButtonActive]} 
              onPress={() => setActiveTab('remedies')}
            >
              <Text style={[styles.tabButtonText, activeTab === 'remedies' && styles.tabButtonTextActive]}>{t('home.remedies', 'Remedies')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'prevention' && styles.tabButtonActive]} 
              onPress={() => setActiveTab('prevention')}
            >
              <Text style={[styles.tabButtonText, activeTab === 'prevention' && styles.tabButtonTextActive]}>{t('home.prevention', 'Prevention')}</Text>
            </TouchableOpacity>
          </View>

          {/* Segmented Controller Tab Body Content */}
          <View style={styles.tabBody}>
            {activeTab === 'overview' && (
              <View style={styles.tabContent}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoRowLabel}>{t('home.cropVariety', 'Crop Variety')}</Text>
                  <Text style={styles.infoRowValue}>{result.plant || t('home.unknownCrop', 'Unknown Crop')}</Text>
                </View>
                {result.symptoms && result.symptoms.length > 0 && (
                  <View style={styles.symptomsList}>
                    <Text style={styles.bodySectionTitle}>{t('home.observedSymptoms', 'Observed Symptoms')}</Text>
                    {result.symptoms.map((symptom, i) => (
                      <View key={i} style={styles.symptomItem}>
                        <Ionicons name="ellipse" size={6} color="#E65100" style={{ marginRight: 8, marginTop: 7 }} />
                        <Text style={styles.bodyText}>{symptom}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {activeTab === 'remedies' && (
              <View style={styles.tabContent}>
                {/* Treatment Plan Section */}
                <Text style={styles.bodySectionTitle}>{t('home.treatmentPlan', 'Treatment Plan')}</Text>
                <View style={styles.remedyCard}>
                  <Ionicons name="medical-outline" size={20} color="#2E7D32" style={{ marginRight: 12, marginTop: 2 }} />
                  <Text style={[styles.bodyText, { flex: 1, lineHeight: 22 }]}>
                    {result.remedy || t('home.noTreatment', 'No immediate chemical treatment required. Monitor local irrigation.')}
                  </Text>
                </View>

                {/* Recommended Medicines/Fungicides */}
                <View style={{ marginTop: 18 }}>
                  <View style={styles.remedySectionHeader}>
                    <Ionicons name="flask-outline" size={16} color="#E65100" />
                    <Text style={styles.remedySectionTitle}>
                      {t('home.recommendedMedicines', 'Recommended Medicines')}
                    </Text>
                  </View>
                  {(() => {
                    const remedyText = result.remedy || '';
                    const medicinePatterns = [
                      'Captan', 'Mancozeb', 'Chlorothalonil', 'Myclobutanil', 'Metalaxyl',
                      'Thiophanate-methyl', 'Copper', 'Neem oil', 'Sulfur', 'Oxytetracycline',
                      'insecticidal soap', 'miticides', 'strobilurins', 'triazoles',
                      'potassium bicarbonate', 'bactericides',
                    ];
                    const found = medicinePatterns.filter((m) =>
                      remedyText.toLowerCase().includes(m.toLowerCase())
                    );
                    const medicines = found.length > 0
                      ? found
                      : ['Neem Oil (organic)', 'Copper-based Fungicide', 'Mancozeb (broad-spectrum)'];
                    return medicines.map((med, i) => (
                      <View key={i} style={styles.remedyPillRow}>
                        <View style={styles.remedyPill}>
                          <Ionicons name="checkmark-circle" size={14} color="#2E7D32" style={{ marginRight: 6 }} />
                          <Text style={styles.remedyPillText}>{med}</Text>
                        </View>
                      </View>
                    ));
                  })()}
                </View>

                {/* Dosage & Application */}
                <View style={{ marginTop: 18 }}>
                  <View style={styles.remedySectionHeader}>
                    <Ionicons name="beaker-outline" size={16} color="#0288D1" />
                    <Text style={styles.remedySectionTitle}>
                      {t('home.dosageGuidelines', 'Dosage & Application')}
                    </Text>
                  </View>
                  <View style={styles.dosageCard}>
                    {[
                      t('home.dosage1', 'Apply recommended fungicide at first sign of disease'),
                      t('home.dosage2', 'Follow product label instructions for exact dosage'),
                      t('home.dosage3', 'Repeat application every 7–14 days as needed'),
                      t('home.dosage4', 'Best applied early morning or late evening'),
                    ].map((tip, i) => (
                      <View key={i} style={styles.dosageItem}>
                        <Text style={styles.dosageBullet}>{i + 1}.</Text>
                        <Text style={[styles.bodyText, { flex: 1 }]}>{tip}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Best Farming Practices */}
                <View style={{ marginTop: 18 }}>
                  <View style={styles.remedySectionHeader}>
                    <Ionicons name="leaf-outline" size={16} color="#2E7D32" />
                    <Text style={styles.remedySectionTitle}>
                      {t('home.bestPractices', 'Best Farming Practices')}
                    </Text>
                  </View>
                  <View style={styles.practicesCard}>
                    {[
                      t('home.practice1', 'Rotate crops every season to break disease cycles'),
                      t('home.practice2', 'Remove and destroy infected plant debris promptly'),
                      t('home.practice3', 'Ensure proper spacing for adequate air circulation'),
                      t('home.practice4', 'Use certified disease-free seeds and transplants'),
                      t('home.practice5', 'Water at the base of plants; avoid wetting foliage'),
                    ].map((practice, i) => (
                      <View key={i} style={styles.symptomItem}>
                        <Ionicons name="ellipse" size={6} color="#2E7D32" style={{ marginRight: 8, marginTop: 7 }} />
                        <Text style={[styles.bodyText, { flex: 1 }]}>{practice}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {activeTab === 'prevention' && (
              <View style={styles.tabContent}>
                <Text style={styles.bodySectionTitle}>{t('home.shieldProtocols', 'Shield & Prevention Protocols')}</Text>
                <View style={styles.preventionCard}>
                  <Ionicons name="shield-checkmark-outline" size={20} color="#0288D1" style={{ marginRight: 12, marginTop: 2 }} />
                  <Text style={[styles.bodyText, { flex: 1, lineHeight: 22 }]}>
                    {result.prevention || t('home.defaultPrevention', 'Ensure clean crop environment and apply organic compost regular intervals.')}
                  </Text>
                </View>

                {/* Preventive Measures List */}
                <View style={{ marginTop: 18 }}>
                  <View style={styles.remedySectionHeader}>
                    <Ionicons name="shield-outline" size={16} color="#0288D1" />
                    <Text style={styles.remedySectionTitle}>
                      {t('home.preventiveMeasures', 'Preventive Measures')}
                    </Text>
                  </View>
                  {(() => {
                    const prevText = result.prevention || '';
                    const sentences = prevText
                      .split(/\.\s+/)
                      .map((s: string) => s.trim().replace(/\.$/, ''))
                      .filter((s: string) => s.length > 5);
                    const items = sentences.length > 0
                      ? sentences
                      : [
                          'Apply preventive fungicide sprays before bloom season',
                          'Monitor fields regularly for early signs of infection',
                          'Maintain proper soil drainage and plant hygiene',
                          'Use resistant crop varieties when available',
                        ];
                    return items.map((item: string, i: number) => (
                      <View key={i} style={styles.symptomItem}>
                        <Ionicons name="checkmark-circle-outline" size={16} color="#0288D1" style={{ marginRight: 8, marginTop: 2 }} />
                        <Text style={[styles.bodyText, { flex: 1 }]}>{item}</Text>
                      </View>
                    ));
                  })()}
                </View>
              </View>
            )}
          </View>
        </View>
      )}

      {/* === SECTION 2: Farmer Insights === */}
      {result && (
        <View style={{ marginHorizontal: 8, marginBottom: 0 }}>
          <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('insights')} activeOpacity={0.8}>
            <LinearGradient colors={['#E65100', '#FF8F00']} style={styles.sectionHeaderGradient}>
              <View style={styles.sectionHeaderIcon}>
                <Ionicons name="people-outline" size={18} color="#FFFFFF" />
              </View>
              <Text style={styles.sectionHeaderText}>{t('home.farmerInsights', 'Farmer Insights')}</Text>
              <Ionicons name={expandedSection === 'insights' ? 'chevron-up' : 'chevron-down'} size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
      {result && expandedSection === 'insights' && (
        <View style={[styles.resultCard, { borderTopLeftRadius: 0, borderTopRightRadius: 0 }]}>
          <Text style={[styles.bodySectionTitle, { marginBottom: 4 }]}>
            {t('home.communityExperiences', 'Relevant Community Experiences')}
          </Text>
          <Text style={[styles.bodyText, { marginBottom: 16 }]}>
            {t('home.insightsDesc', 'Real experiences from fellow farmers facing similar issues.')}
          </Text>

          {insightsLoading ? (
            <View style={{ alignItems: 'center', paddingVertical: 24 }}>
              <ActivityIndicator size="small" color="#E65100" />
              <Text style={[styles.bodyText, { marginTop: 8 }]}>{t('home.fetchingInsights', 'Fetching farmer experiences...')}</Text>
            </View>
          ) : farmerInsights.length > 0 ? (
            farmerInsights.map((post, i) => (
              <View key={post.id || i} style={styles.insightCard}>
                <View style={styles.insightHeader}>
                  <View style={styles.insightAvatar}>
                    <Text style={styles.insightAvatarText}>
                      {post.author_name ? post.author_name.substring(0, 2).toUpperCase() : 'KB'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.insightAuthor}>{post.author_name}</Text>
                    <Text style={styles.insightDate}>
                      {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                  <View style={styles.insightLikeBadge}>
                    <Ionicons name="heart" size={12} color="#D32F2F" />
                    <Text style={styles.insightLikeCount}>{post.like_count || 0}</Text>
                  </View>
                </View>
                <Text style={styles.insightTitle}>{post.title}</Text>
                <Text style={styles.insightBody} numberOfLines={3}>{post.description}</Text>
              </View>
            ))
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <Ionicons name="chatbubbles-outline" size={32} color="#8E9F94" />
              <Text style={[styles.bodyText, { marginTop: 8, textAlign: 'center' }]}>
                {t('home.noInsights', 'No matching farmer discussions found yet. Be the first to share your experience in the forum!')}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* === SECTION 3: Expert Advice === */}
      {result && (
        <View style={{ marginHorizontal: 8, marginBottom: 0 }}>
          <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('expert')} activeOpacity={0.8}>
            <LinearGradient colors={['#0277BD', '#0288D1']} style={styles.sectionHeaderGradient}>
              <View style={styles.sectionHeaderIcon}>
                <Ionicons name="school-outline" size={18} color="#FFFFFF" />
              </View>
              <Text style={styles.sectionHeaderText}>{t('home.expertAdvice', 'Expert Advice')}</Text>
              <Ionicons name={expandedSection === 'expert' ? 'chevron-up' : 'chevron-down'} size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
      {result && expandedSection === 'expert' && (
        <View style={[styles.resultCard, { borderTopLeftRadius: 0, borderTopRightRadius: 0 }]}>
          <Text style={[styles.bodySectionTitle, { marginBottom: 4 }]}>
            {t('home.aiExpertRecommendation', 'AI Expert Recommendation')}
          </Text>
          <Text style={[styles.bodyText, { marginBottom: 16 }]}>
            {t('home.expertDesc', 'Personalized advice based on your diagnosis and crop type.')}
          </Text>

          {expertLoading ? (
            <View style={{ alignItems: 'center', paddingVertical: 24 }}>
              <ActivityIndicator size="small" color="#0288D1" />
              <Text style={[styles.bodyText, { marginTop: 8 }]}>{t('home.fetchingExpert', 'Consulting AI expert...')}</Text>
            </View>
          ) : expertAdvice ? (
            <View style={styles.expertAdviceCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <View style={styles.expertBadge}>
                  <Ionicons name="sparkles" size={14} color="#0277BD" />
                </View>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#0277BD', letterSpacing: 0.5 }}>
                  {t('home.aiGenerated', 'AI-GENERATED ADVICE')}
                </Text>
              </View>
              <Text style={styles.expertAdviceText}>{expertAdvice}</Text>
            </View>
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <Ionicons name="medkit-outline" size={32} color="#8E9F94" />
              <Text style={[styles.bodyText, { marginTop: 8, textAlign: 'center' }]}>
                {t('home.noExpert', 'Expert advice could not be generated. Please try again.')}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* New Scan Button */}
      {result && (
        <View style={{ marginHorizontal: 8, marginBottom: 16 }}>
          <TouchableOpacity style={styles.newScanBtn} onPress={resetState}>
            <Ionicons name="scan-outline" size={16} color="#0F3A20" style={{ marginRight: 8 }} />
            <Text style={styles.newScanBtnText}>{t('home.newDiagnostic', 'New Diagnostics Run')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Upload Actions (Horizontal Row) */}
      <View style={[styles.uploadGrid, { marginHorizontal: 16 }]}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => pickImage(true)} activeOpacity={0.8}>
          <LinearGradient colors={['#E8F5E9', '#C8E6C9']} style={styles.actionIconBg}>
            <Ionicons name="camera-outline" size={24} color="#2E7D32" />
          </LinearGradient>
          <Text style={styles.actionBtnText}>{t('home.captureLeaf', 'Capture')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={() => pickImage(false)} activeOpacity={0.8}>
          <LinearGradient colors={['#FFF3E0', '#FFE0B2']} style={styles.actionIconBg}>
            <Ionicons name="image-outline" size={24} color="#E65100" />
          </LinearGradient>
          <Text style={styles.actionBtnText}>{t('home.fromGallery', 'Gallery')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF8F5' },
  content: { paddingBottom: 120 },
  heroSection: {
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  heroIconBadge: {
    backgroundColor: '#E8F5E9',
    padding: 10,
    borderRadius: 16,
  },
  heroTitle: { fontSize: 24, fontWeight: '900', color: '#0F3A20', letterSpacing: -0.5 },
  heroStatsText: { fontSize: 11, color: '#5A7265', marginTop: 4, fontWeight: '700', letterSpacing: 0.5 },
  heroSubtitle: { fontSize: 14, color: '#5A7265', lineHeight: 22, fontWeight: '500' },
  uploadGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 30,
    zIndex: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ECEFF1',
    shadowColor: '#1C2D24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  actionIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1C2D24',
  },
  previewSection: { marginBottom: 24, paddingHorizontal: 12, zIndex: 10, marginTop: 16 },
  viewfinderWrapper: {
    position: 'relative',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#0F3A20',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  previewImage: {
    width: '100%', height: width * 0.75,
    backgroundColor: '#E8F5E9',
  },
  focusCorner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  topLeft: { top: 20, left: 20, borderTopWidth: 3, borderLeftWidth: 3 },
  topRight: { top: 20, right: 20, borderTopWidth: 3, borderRightWidth: 3 },
  bottomLeft: { bottom: 20, left: 20, borderBottomWidth: 3, borderLeftWidth: 3 },
  bottomRight: { bottom: 20, right: 20, borderBottomWidth: 3, borderRightWidth: 3 },
  imageResetBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  iconBtn: {
    width: 52, height: 52, backgroundColor: '#FFFFFF', borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ECEFF1',
  },
  analyzeBtn: {
    flex: 1, backgroundColor: '#0F3A20', borderRadius: 16,
    paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#0F3A20', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  btnDisabled: { opacity: 0.7 },
  analyzeBtnText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
  
  // Guide Illustration
  guideContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 40,
  },
  guideIllustration: {
    width: width * 0.55,
    height: width * 0.5,
    marginBottom: 20,
  },
  guideTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F3A20',
    marginBottom: 8,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  guideText: {
    fontSize: 13,
    color: '#5A7265',
    lineHeight: 20,
    textAlign: 'center',
    fontWeight: '500',
    paddingHorizontal: 12,
  },
  resultCard: {
    backgroundColor: '#FFFFFF', borderRadius: 28, padding: 24,
    shadowColor: '#0F3A20', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06, shadowRadius: 24, elevation: 5,
    marginBottom: 24, marginHorizontal: 8,
  },
  resultMetaLabel: { fontSize: 11, fontWeight: '900', color: '#8E9F94', letterSpacing: 1.5, marginBottom: 6 },
  resultHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 24,
  },
  resultTitle: { fontSize: 20, fontWeight: '900', color: '#1C2D24', letterSpacing: -0.5 },
  confidenceCircleWrapper: {
    alignItems: 'flex-end',
    width: 80,
  },
  confidenceBadge: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  confidenceText: { fontSize: 14, fontWeight: '900' },
  progressBarBg: {
    width: '100%',
    height: 6,
    backgroundColor: '#ECEFF1',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F3A20',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 13,
    color: '#5A7265',
    fontWeight: '700',
  },
  tabButtonTextActive: {
    color: '#0F3A20',
    fontWeight: '800',
  },
  tabBody: {
    marginBottom: 20,
  },
  tabContent: {
    minHeight: 100,
  },
  bodySectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1C2D24',
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FAF8F5',
  },
  infoRowLabel: { fontSize: 14, color: '#5A7265', fontWeight: '600' },
  infoRowValue: { fontSize: 14, fontWeight: '700', color: '#1C2D24' },
  symptomsList: {
    marginTop: 16,
  },
  symptomItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bodyText: { fontSize: 13.5, color: '#5A7265', lineHeight: 20 },
  remedyCard: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    padding: 16,
    alignItems: 'flex-start',
  },
  preventionCard: {
    flexDirection: 'row',
    backgroundColor: '#E1F5FE',
    borderRadius: 16,
    padding: 16,
    alignItems: 'flex-start',
  },
  newScanBtn: {
    backgroundColor: '#FAF8F5', borderRadius: 16,
    paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: 8,
  },
  newScanBtnText: { fontSize: 13.5, fontWeight: '800', color: '#0F3A20' },

  // Enhanced Remedies Styles
  remedySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  remedySectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1C2D24',
    letterSpacing: 0.3,
  },
  remedyPillRow: {
    marginBottom: 8,
  },
  remedyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  remedyPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2E7D32',
  },
  dosageCard: {
    backgroundColor: '#E1F5FE',
    borderRadius: 16,
    padding: 14,
  },
  dosageItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  dosageBullet: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0288D1',
    width: 18,
  },
  practicesCard: {
    backgroundColor: '#F1F8E9',
    borderRadius: 16,
    padding: 14,
  },

  // Caution Card
  cautionCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  cautionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
    gap: 14,
  },
  cautionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  cautionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#E65100',
    marginBottom: 3,
    letterSpacing: 0.2,
  },
  cautionText: {
    fontSize: 12.5,
    color: '#5A4520',
    lineHeight: 18,
    fontWeight: '500',
  },

  // Crop Type Input
  cropTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECEFF1',
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginTop: 14,
    marginBottom: 2,
  },
  cropTypeIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cropTypeInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1C2D24',
    paddingVertical: 10,
  },

  // Collapsible Section Headers
  sectionHeader: {
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: 8,
  },
  sectionHeaderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  sectionHeaderIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionHeaderText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  // Farmer Insight Cards
  insightCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ECEFF1',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  insightAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightAvatarText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E65100',
  },
  insightAuthor: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C2D24',
  },
  insightDate: {
    fontSize: 11,
    color: '#8E9F94',
    fontWeight: '500',
  },
  insightLikeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  insightLikeCount: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D32F2F',
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1C2D24',
    marginBottom: 4,
  },
  insightBody: {
    fontSize: 12.5,
    color: '#5A7265',
    lineHeight: 18,
  },

  // Expert Advice Card
  expertAdviceCard: {
    backgroundColor: '#E1F5FE',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#B3E5FC',
  },
  expertBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#E1F5FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#B3E5FC',
  },
  expertAdviceText: {
    fontSize: 13.5,
    color: '#1C2D24',
    lineHeight: 22,
    fontWeight: '500',
  },
});
