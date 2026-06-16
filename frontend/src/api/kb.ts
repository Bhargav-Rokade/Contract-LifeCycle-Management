import { apiClient } from './client';
import type { KBDocument, KBStatus } from '../types';

export const kbApi = {
  listDocuments: () =>
    apiClient.get<KBDocument[]>('/api/kb/documents'),

  uploadDocument: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient.post<KBDocument>('/api/kb/documents', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deleteDocument: (docId: string) =>
    apiClient.delete(`/api/kb/documents/${docId}`),

  rebuild: () =>
    apiClient.post<{ message: string; chunks_indexed: number }>('/api/kb/rebuild'),

  status: () =>
    apiClient.get<KBStatus>('/api/kb/status'),
};
