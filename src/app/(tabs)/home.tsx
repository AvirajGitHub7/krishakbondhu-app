/**
 * KrishakBondhu - Premium Home Screen (Agri-Intelligence Dashboard)
 */

import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Alert, Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/constants/colors';
import { diseaseService } from '@/services/disease';
import { DiseaseResult } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { t } = useTranslation();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiseaseResult | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'remedies' | 'prevention'>('overview');

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
    try {
      const prediction = await diseaseService.predict(imageUri);
      setResult(prediction);
      setActiveTab('overview');
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
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Clean Hero Header */}
      <View style={styles.heroSection}>
        <View style={styles.heroHeader}>
          <View style={styles.heroIconBadge}>
            <Ionicons name="leaf-outline" size={26} color="#0F3A20" />
          </View>
          <View>
            <Text style={styles.heroTitle}>{t('home.cropDiagnostics', 'Crop Diagnostics')}</Text>
            <Text style={styles.heroStatsText}>{t('home.systemStatus', 'System: Active | AI model v1.2')}</Text>
          </View>
        </View>
        <Text style={styles.heroSubtitle}>
          {t('home.subtitle', 'Use our production-grade computer vision to diagnose crop diseases and pests instantly.')}
        </Text>
      </View>

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
          )}
        </View>
      )}

      {/* Disease Result Dashboard */}
      {result && (
        <View style={styles.resultCard}>
          <Image 
            source={require('../../../assets/images/home_illustration.svg')}
            style={{ width: '100%', height: 200, resizeMode: 'contain', marginBottom: 20 }} 
          />
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
                <Text style={styles.bodySectionTitle}>{t('home.treatmentPlan', 'Treatment Plan')}</Text>
                <View style={styles.remedyCard}>
                  <Ionicons name="medical-outline" size={20} color="#2E7D32" style={{ marginRight: 12, marginTop: 2 }} />
                  <Text style={[styles.bodyText, { flex: 1, lineHeight: 22 }]}>
                    {result.remedy || t('home.noTreatment', 'No immediate chemical treatment required. Monitor local irrigation.')}
                  </Text>
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
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.newScanBtn} onPress={resetState}>
            <Ionicons name="scan-outline" size={16} color="#0F3A20" style={{ marginRight: 8 }} />
            <Text style={styles.newScanBtnText}>{t('home.newDiagnostic', 'New Diagnostics Run')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Upload Grid (Always at bottom) */}
      <View style={[styles.uploadGrid, { marginHorizontal: 8 }]}>
        <TouchableOpacity style={styles.uploadCard} onPress={() => pickImage(true)} activeOpacity={0.8}>
          <LinearGradient colors={['#E8F5E9', '#C8E6C9']} style={styles.uploadIconContainer}>
            <Ionicons name="aperture-outline" size={32} color="#2E7D32" />
          </LinearGradient>
          <Text style={styles.uploadLabel}>{t('home.captureLeaf', 'Capture Leaf')}</Text>
          <Text style={styles.uploadHint}>{t('home.captureHint', 'Position leaf under bright light')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.uploadCard} onPress={() => pickImage(false)} activeOpacity={0.8}>
          <LinearGradient colors={['#FFF3E0', '#FFE0B2']} style={styles.uploadIconContainer}>
            <Ionicons name="image-outline" size={32} color="#E65100" />
          </LinearGradient>
          <Text style={styles.uploadLabel}>{t('home.fromGallery', 'From Gallery')}</Text>
          <Text style={styles.uploadHint}>{t('home.galleryHint', 'Upload high-res crop file')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF8F5' },
  content: { padding: 20, paddingBottom: 120 },
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
  uploadGrid: { gap: 16, marginBottom: 24, paddingHorizontal: 12, zIndex: 10 },
  uploadCard: {
    backgroundColor: '#FFFFFF', borderRadius: 28, padding: 20,
    alignItems: 'center',
    shadowColor: '#1C2D24', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08, shadowRadius: 20, elevation: 5,
  },
  uploadIconContainer: {
    padding: 16,
    borderRadius: 22,
    marginBottom: 12,
  },
  uploadLabel: { fontSize: 17, fontWeight: '900', color: '#1C2D24', marginBottom: 6, letterSpacing: -0.3 },
  uploadHint: { fontSize: 13, color: '#5A7265', fontWeight: '500' },
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
});
