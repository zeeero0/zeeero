
import { Platform } from '../types';

export const verifyService = {
  validateUrl: (url: string, platform: Platform): boolean => {
    const patterns = {
      instagram: /^https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9_.]+\/?(\?.*)?$/,
      tiktok: /^https?:\/\/(www\.)?tiktok\.com\/@[a-zA-Z0-9_.]+\/?(\?.*)?$/,
      youtube: /^https?:\/\/(www\.)?youtube\.com\/(@[a-zA-Z0-9_-]+|(c|channel|user)\/[a-zA-Z0-9_-]+)\/?(\?.*)?$/
    };
    return patterns[platform].test(url);
  },

  fetchProfileData: async (url: string, platform: Platform) => {
    // محاكاة استدعاء API خارجي لاستخراج البيانات
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const username = url.split('/').filter(Boolean).pop()?.replace('@', '') || 'user_detect';
    
    return {
      username: username,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      followers: Math.floor(Math.random() * 5000) + 100,
      bio: "حساب مغربي مهتم بالمحتوى الرقمي 🇲🇦"
    };
  }
};
