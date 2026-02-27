
export enum AppView {
  DASHBOARD = 'dashboard',
  EARN = 'earn',
  PROMOTE = 'promote',
  WALLET = 'wallet',
  PROFILE = 'profile',
  ADMIN = 'admin',
  LOGIN = 'login'
}

export type Platform = 'youtube' | 'instagram' | 'tiktok';
export type CampaignType = 'follow' | 'like' | 'comment';

export interface CampaignCompleter {
  userId: string;
  username: string;
  timestamp: Date;
  rating: 'favorable' | 'negative' | 'pending';
}

export interface LinkedAccount {
  id: string;
  platform: Platform;
  url: string;
  username: string;
  avatar: string;
  followers: number;
  verified: boolean;
  linkedAt: Date;
}

export interface UserSession {
  type: 'login' | 'logout';
  timestamp: Date;
}

export interface AuditLog {
  id: string;
  userId: string;
  username: string;
  action: 'ACCOUNT_CREATE' | 'PROFILE_UPDATE' | 'POINTS_ADJUST' | 'LOGIN' | 'LOGOUT' | 'CAMPAIGN_CREATE' | 'PURCHASE_REQUEST' | 'ADMIN_DELETE_USER';
  details: string;
  metadata?: any;
  timestamp: Date;
}

export interface User {
  id: string;
  username: string;
  email: string;
  recoveryEmail: string;
  password?: string;
  avatar?: string;
  points: number;
  role: 'user' | 'admin';
  trustScore: number;
  negativeRatingsCount: number;
  favorableRatingCycle: number;
  negativeRatingCycle: number;
  linkedAccounts: LinkedAccount[];
  totalFollowsDone: number;
  totalFollowersReceived: number;
  createdAt: Date;
  isSuspended?: boolean;
  lastSpinDate?: string;
  sessionHistory?: UserSession[];
  lastActiveAt?: Date;
  linkingDismissed?: boolean;
  ipAddress?: string;
  countryCode?: string;
}

export interface Campaign {
  id: string;
  userId: string;
  platform: Platform;
  type: CampaignType;
  username: string;
  url: string;
  targetCount: number;
  currentCount: number;
  pointsReward: number;
  totalInvestment: number;
  createdAt: Date;
  active: boolean;
  completers: CampaignCompleter[];
}

export interface Transaction {
  id: string;
  userId: string;
  username?: string;
  type: 'earn' | 'spend' | 'purchase' | 'penalty' | 'daily_reward' | 'trust_reward';
  status: 'pending' | 'completed' | 'rejected';
  amount: number;
  description: string;
  date: Date;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  groundingUrls?: { uri: string; title: string }[];
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: Date;
}
