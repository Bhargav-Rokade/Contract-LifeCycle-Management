import { apiClient } from './client';
import type { ComplianceFinding } from '../types';

export const complianceApi = {
  run: (deckId: string, revId: string) =>
    apiClient.post<ComplianceFinding[]>(
      `/api/negotiations/${deckId}/revisions/${revId}/compliance`
    ),

  getFindings: (deckId: string, revId: string) =>
    apiClient.get<ComplianceFinding[]>(
      `/api/negotiations/${deckId}/revisions/${revId}/compliance`
    ),
};
