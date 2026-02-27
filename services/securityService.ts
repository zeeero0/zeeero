
import { User } from '../types';

export const securityService = {
  // توليد بصمة رقمية للبيانات لمنع التلاعب اليدوي في LocalStorage
  generateIntegrityHash: (user: User): string => {
    const dataString = `${user.id}-${user.points}-${user.trustScore}-${user.email}`;
    return btoa(dataString).split('').reverse().join('');
  },

  // التحقق من أن البيانات لم يتم تعديلها خارج التطبيق
  verifyIntegrity: (user: User, savedHash?: string): boolean => {
    if (!savedHash) return true; // للحسابات القديمة
    const expectedHash = securityService.generateIntegrityHash(user);
    return savedHash === expectedHash;
  },

  // كشف البوتات: التحقق من سرعة الإنجاز
  isVelocitySuspicious: (lastTaskTime?: Date): boolean => {
    if (!lastTaskTime) return false;
    const now = new Date();
    const diff = (now.getTime() - new Date(lastTaskTime).getTime()) / 1000;
    return diff < 5; // إذا أنجز مهمة في أقل من 5 ثواني
  },

  // تحدي بشري بسيط (Captcha Lite)
  generateChallenge: () => {
    const num1 = Math.floor(Math.random() * 10);
    const num2 = Math.floor(Math.random() * 10);
    return {
      question: `ما هو حاصل جمع ${num1} + ${num2}؟`,
      answer: num1 + num2
    };
  }
};
