
import React, { useState } from 'react';
import { User, Platform } from '../types';
import { dbService } from '../services/dbService';

interface Props {
  user: User;
  onComplete: (updatedUser: User) => void;
  onDismiss: () => void;
}

const AccountLinkingModal: React.FC<Props> = ({ user, onComplete, onDismiss }) => {
  const [links, setLinks] = useState({
    instagram: '',
    youtube: '',
    tiktok: ''
  });
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  const handleLinkChange = (p: Platform, val: string) => {
    setLinks(prev => ({ ...prev, [p]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsVerifying(true);

    try {
      const platforms: Platform[] = ['instagram', 'youtube', 'tiktok'];
      const linkedAccounts = [...(user.linkedAccounts || [])];

      for (const p of platforms) {
        const url = links[p].trim();
        if (url) {
          try {
            const res = await dbService.verifyProfile(p, url);
            if (!res.isValid) throw new Error(`الرابط الخاص بـ ${p} غير صحيح.`);
            
            // تجنب التكرار
            if (!linkedAccounts.some(acc => acc.platform === p)) {
              // Add missing avatar and followers properties to match LinkedAccount type
              linkedAccounts.push({
                id: Math.random().toString(36).substr(2, 9),
                platform: p,
                url: url,
                username: res.profileName || "User",
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${res.profileName || "User"}`,
                followers: 0,
                verified: true,
                linkedAt: new Date()
              });
            }
          } catch (verifErr: any) {
             throw new Error(verifErr.message || `فشل التحقق من حساب ${p}`);
          }
        }
      }

      // إذا تم إدخال روابط، نقوم بحفظها وتفعيل حالة التخطي لمنع ظهور النافذة مجدداً
      if (linkedAccounts.length > 0) {
        const updatedUser = { 
          ...user, 
          linkedAccounts, 
          linkingDismissed: true 
        };
        
        // حفظ في قاعدة البيانات بشكل كامل
        await dbService.updateUser(updatedUser);
        
        // إشعار التطبيق بالاكتمال
        onComplete(updatedUser);
      } else {
        setError('يرجى إدخال رابط واحد على الأقل أو الضغط على تخطي.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-slate-950 flex items-center justify-center p-6 backdrop-blur-3xl overflow-y-auto">
      <div className="max-w-2xl w-full bg-[#020617] rounded-[4rem] border-4 border-morocco-red p-12 shadow-[0_0_100px_rgba(225,29,72,0.4)] animate-in zoom-in duration-500">
        <div className="text-center mb-10">
          <div className="w-24 h-24 bg-morocco-red text-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-4xl shadow-2xl rotate-12">
            <i className="fas fa-user-shield"></i>
          </div>
          <h2 className="text-4xl font-black text-white italic tracking-tighter mb-4">ميثاق الجندي الرقمي 🇲🇦</h2>
          <p className="text-slate-400 font-bold leading-relaxed">
            اربط حساباتك الآن ليتمكن الآخرون من التحقق من مهامك. هذه الخطوة تظهر لمرة واحدة فقط بعد التسجيل.
          </p>
        </div>

        {error && (
          <div className="mb-8 p-6 bg-red-600/10 border-2 border-red-600/20 rounded-3xl text-red-500 font-bold text-sm text-center animate-shake">
            <i className="fas fa-exclamation-triangle ml-2"></i> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {(['instagram', 'youtube', 'tiktok'] as Platform[]).map(p => (
            <div key={p} className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">رابط حساب {p}</label>
              <div className="relative group">
                <i className={`fab fa-${p} absolute right-6 top-1/2 -translate-y-1/2 text-xl text-slate-400 group-focus-within:text-morocco-red`}></i>
                <input 
                  type="url" value={links[p]} 
                  onChange={e => handleLinkChange(p, e.target.value)}
                  placeholder={`https://${p}.com/...`}
                  className="w-full bg-white/5 border-2 border-white/10 p-6 rounded-3xl pr-14 text-white font-bold outline-none focus:border-morocco-red transition-all"
                  dir="ltr"
                />
              </div>
            </div>
          ))}

          <div className="flex flex-col gap-4 mt-10">
            <button 
              type="submit" disabled={isVerifying}
              className="w-full py-7 bg-morocco-red text-white rounded-[2.5rem] font-black text-2xl shadow-2xl shadow-red-600/40 hover:scale-[1.02] active:scale-95 transition-all"
            >
              {isVerifying ? <i className="fas fa-sync fa-spin"></i> : 'تأكيد الربط والدخول'}
            </button>
            
            <button 
              type="button" 
              onClick={onDismiss}
              className="w-full py-5 text-slate-500 hover:text-white font-black text-sm uppercase tracking-widest transition-all"
            >
              تخطي هذه الخطوة نهائياً
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccountLinkingModal;
