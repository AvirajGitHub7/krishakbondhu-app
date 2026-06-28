/**
 * KrishakBondhu - Disease Detection API Service
 */

import api from './api';
import { DiseaseResult, PredictionHistoryItem } from '@/types';

export const diseaseService = {
  predict: async (imageUri: string): Promise<DiseaseResult> => {
    const formData = new FormData();
    const filename = imageUri.split('/').pop() || 'photo.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('file', {
      uri: imageUri,
      name: filename,
      type,
    } as any);

    const response = await api.post('/disease/predict', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000, // 60s for ML inference
    });
    return response.data;
  },

  getHistory: async (page: number = 1): Promise<{ predictions: PredictionHistoryItem[]; total: number }> => {
    const response = await api.get('/disease/history', { params: { page } });
    return response.data;
  },

  getDiseaseInfo: async (diseaseName: string) => {
    const response = await api.get(`/disease/info/${encodeURIComponent(diseaseName)}`);
    return response.data;
  },
};
