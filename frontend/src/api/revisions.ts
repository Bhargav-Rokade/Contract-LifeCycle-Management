import { apiClient } from './client';
import type { ContractRevision, DiffResponse } from '../types';

export const revisionsApi = {
  list: (deckId: string) =>
    apiClient.get<ContractRevision[]>(`/api/negotiations/${deckId}/revisions`),

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

  downloadLatest: (deckId: string) =>
    apiClient.get(`/api/negotiations/${deckId}/revisions/latest/download`, {
      responseType: 'blob',
    }),
};
