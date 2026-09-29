import { apiClient } from './client';
import type { ContractRevision, DiffResponse } from '../types';

export const revisionsApi = {
  list: (deckId: string, filename?: string) =>
    apiClient.get<ContractRevision[]>(`/api/negotiations/${deckId}/revisions`, {
      params: filename ? { filename } : {},
    }),

  listFiles: (deckId: string) =>
    apiClient.get<string[]>(`/api/negotiations/${deckId}/revisions/files`),

  upload: (deckId: string, file: File, commitMessage: string) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient.post<ContractRevision>(
      `/api/negotiations/${deckId}/revisions`,
      form,
      {
        params: { commit_message: commitMessage },
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
  },

  getDiff: (deckId: string, revId: string) =>
    apiClient.get<DiffResponse>(`/api/negotiations/${deckId}/revisions/${revId}/diff`),

  downloadLatest: (deckId: string, filename: string) =>
    apiClient.get(`/api/negotiations/${deckId}/revisions/latest/download`, {
      params: { filename },
      responseType: 'blob',
    }),

  getRevisionContent: (deckId: string, revId: string) =>
    apiClient.get<{ content: string; file_name: string }>(`/api/negotiations/${deckId}/revisions/${revId}/content`),
};
