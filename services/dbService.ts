
import { User, Transaction, Campaign, AuditLog } from '../types';

const API_BASE_URL = '/api';

const handleResponse = async (response: Response) => {
  let data;
  try {
    const text = await response.text();
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    console.error("JSON Parse Error:", e);
    data = { message: "خطأ في معالجة بيانات السيرفر." };
  }
  if (!response.ok) throw new Error(data.message || `خطأ تقني: ${response.status}`);
  return data;
};

export const dbService = {
  getUsers: async (): Promise<User[]> => {
    const res = await fetch(`${API_BASE_URL}/users`);
    return await handleResponse(res);
  },

  updateUser: async (user: User): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
    await handleResponse(res);
  },

  getTransactions: async (userId?: string): Promise<Transaction[]> => {
    const url = userId ? `${API_BASE_URL}/transactions?userId=${userId}` : `${API_BASE_URL}/transactions`;
    const res = await fetch(url);
    return await handleResponse(res);
  },

  addTransaction: async (userId: string, type: string, amount: number, description: string, status = 'completed', username?: string): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, type, amount, description, status, username })
    });
    await handleResponse(res);
  },

  processPurchaseRequest: async (id: string, action: 'approve' | 'reject'): Promise<any> => {
    const res = await fetch(`${API_BASE_URL}/transactions/${id}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    });
    return await handleResponse(res);
  },

  getCampaigns: async (): Promise<Campaign[]> => {
    const res = await fetch(`${API_BASE_URL}/campaigns`);
    return await handleResponse(res);
  },

  getAuditLogs: async (): Promise<AuditLog[]> => {
    const res = await fetch(`${API_BASE_URL}/audit-logs`);
    return await handleResponse(res);
  },

  registerCompletion: async (campaignId: string, userId: string, username: string): Promise<any> => {
    const res = await fetch(`${API_BASE_URL}/campaigns/${campaignId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, username })
    });
    return await handleResponse(res);
  },

  verifyProfile: async (platform: string, url: string): Promise<any> => {
    const res = await fetch(`${API_BASE_URL}/verify-profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform, url })
    });
    return await handleResponse(res);
  },

  addCampaign: async (campaign: Campaign): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/campaigns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(campaign)
    });
    await handleResponse(res);
  },

  registerUser: async (user: User): Promise<{ success: boolean, user?: User }> => {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
    return await handleResponse(res);
  },

  login: async (email: string, password: string): Promise<{ success: boolean, user: User }> => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return await handleResponse(res);
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return await handleResponse(res);
  },

  resetPassword: async (data: any): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await handleResponse(res);
  },

  verifyIdentity: async (userId: string, email: string, password: string): Promise<{ success: boolean, message?: string }> => {
    const res = await fetch(`${API_BASE_URL}/auth/verify-identity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, email, password })
    });
    return await handleResponse(res);
  },

  updateSecurity: async (userId: string, data: any): Promise<{ success: boolean, message: string }> => {
    const res = await fetch(`${API_BASE_URL}/users/${userId}/security`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await handleResponse(res);
  }
};
