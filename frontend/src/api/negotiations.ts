import { apiClient } from './client';
import type { NegotiationDeck, Company } from '../types';

export const negotiationsApi = {
  list: () =>
    apiClient.get<NegotiationDeck[]>('/api/negotiations'),

  create: (data: { title: string; counterparty_handle: string }) =>
    apiClient.post<NegotiationDeck>('/api/negotiations', data),

  get: (deckId: string) =>
    apiClient.get<NegotiationDeck>(`/api/negotiations/${deckId}`),

  searchCompanies: (handle: string) =>
    apiClient.get<Company[]>(`/api/companies/search`, { params: { handle } }),
};
