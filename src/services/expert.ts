/**
 * KrishakBondhu - Expert API Service
 */

import api from './api';
import { ExpertRequest, ExpertRequestListResponse } from '@/types';

export const expertService = {
  createRequest: async (data: {
    title: string;
    description: string;
    imageUri?: string;
    diseaseResult?: any;
  }): Promise<ExpertRequest> => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);

    if (data.diseaseResult) {
      formData.append('disease_result', JSON.stringify(data.diseaseResult));
    }

    if (data.imageUri) {
      const filename = data.imageUri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('image', {
        uri: data.imageUri,
        name: filename,
        type,
      } as any);
    }

    const response = await api.post('/expert/requests', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getMyRequests: async (page: number = 1): Promise<ExpertRequestListResponse> => {
    const response = await api.get('/expert/requests', { params: { page } });
    return response.data;
  },

  getRequest: async (requestId: string): Promise<ExpertRequest> => {
    const response = await api.get(`/expert/requests/${requestId}`);
    return response.data;
  },

  getPendingRequests: async (page: number = 1): Promise<ExpertRequestListResponse> => {
    const response = await api.get('/expert/pending', { params: { page } });
    return response.data;
  },

  respondToRequest: async (requestId: string, response: string): Promise<ExpertRequest> => {
    const res = await api.put(`/expert/requests/${requestId}/respond`, { response });
    return res.data;
  },

  askAIExpert: async (text?: string, audioUri?: string): Promise<{ query: string; response: string }> => {
    const formData = new FormData();
    if (text) {
      formData.append('text', text);
    }
    if (audioUri) {
      const filename = audioUri.split('/').pop() || 'voice.m4a';
      formData.append('audio', {
        uri: audioUri,
        name: filename,
        type: 'audio/m4a',
      } as any);
    }
    const response = await api.post('/expert/ai-consult', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
    return response.data;
  },
};
