import { apiClient } from './client';
import type { Company, TokenResponse } from '../types';

export const authApi = {
  register: (data: { company_handle: string; display_name: string; password: string }) =>
    apiClient.post<Company>('/api/auth/register', data),

  login: (data: { company_handle: string; password: string }) =>
    apiClient.post<TokenResponse>('/api/auth/login', data),

  me: () => apiClient.get<Company>('/api/auth/me'),
};
