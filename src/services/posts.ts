/**
 * KrishakBondhu - Posts API Service
 */

import api from './api';
import { Post, PostListResponse, Comment } from '@/types';

export const postService = {
  getPosts: async (page: number = 1): Promise<PostListResponse> => {
    const response = await api.get('/posts', { params: { page } });
    return response.data;
  },

  getPost: async (postId: string): Promise<Post> => {
    const response = await api.get(`/posts/${postId}`);
    return response.data;
  },

  createPost: async (data: {
    title: string;
    description: string;
    imageUri?: string;
    diseaseResult?: any;
  }): Promise<Post> => {
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

    const response = await api.post('/posts/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deletePost: async (postId: string): Promise<void> => {
    await api.delete(`/posts/${postId}`);
  },

  toggleLike: async (postId: string): Promise<{ liked: boolean; like_count: number }> => {
    const response = await api.post(`/posts/${postId}/like`);
    return response.data;
  },

  getComments: async (postId: string): Promise<Comment[]> => {
    const response = await api.get(`/posts/${postId}/comments`);
    return response.data;
  },

  addComment: async (postId: string, content: string): Promise<Comment> => {
    const response = await api.post(`/posts/${postId}/comments`, { content });
    return response.data;
  },
};
