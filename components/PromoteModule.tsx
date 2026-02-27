
import React, { useState, useEffect } from 'react';
import { Platform, User, Campaign, CampaignType } from '../types';
import { dbService } from '../services/dbService';

interface PromoteProps {
  user: User;
  onPromote: (pts: number, amount: number) => void;
}

const PromoteModule: React.FC<PromoteProps> = ({ user, onPromote }) => {
  const [platform, setPlatform] = useState<Platform>('youtube');
  const [campaignType, setCampaignType] = useState<CampaignType>('follow');
  const [username, setUsername] = useState('');
  const [url, setUrl] = useState('');
  const [amount, setAmount] = useState(50);
  const [boostLevel, setBoostLevel] = useState<'normal' | 'fast' | 'ultra'>('normal');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ isValid: boolean, profileName?: string, message?: string, error?: string } | null>(null);

  const boostSettings = {
    follow: {
      normal: { cost: 12, reward: 10, label: 'سرعة عادية', icon: 'fa-walking', color: '#e11d48' },
      fast: { cost: 22, reward: 18, label: 'سرعة مضاعفة', icon: 'fa-running', color: '#fbbf24' },
      ultra: { cost: 35, reward: 30, label: 'سرعة صاروخية', icon: 'fa-rocket', color: '#3b82f6' }
    },
    like: {
      normal: { cost: 6, reward: 5, label: 'سرعة عادية', icon: 'fa-walking', color: '#e11d48' },
      fast: { cost: 12, reward: 10, label: 'سرعة مضاعفة', icon: 'fa-running', color: '#fbbf24' },
      ultra: { cost: 20, reward: 16, label: 'سرعة صاروخية', icon: 'fa-rocket', color: '#3b82f6' }
    },
    comment: {
      normal: { cost: 8, reward: 6, label: 'سرعة عادية', icon: 'fa-walking', color: '#e11d48' },
      fast: { cost: 15, reward: 12, label: 'سرعة مضاعفة', icon: 'fa-running', color: '#fbbf24' },
      ultra: { cost: 25, reward: 20, label: 'سرعة صاروخية', icon: 'fa-rocket', color: '#3b82f6' }
    }
  };

  const currentSettings = boostSettings[campaignType][boostLevel];
  const totalCost = amount * currentSettings.cost;
  
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const maxAmount = campaignType === 'follow' ? 1000 : 2000;
  const strokeDashoffset = circumference - (amount / maxAmount) * circumference;

  const handleVerify = async () => {
    if (!url.trim()) return;
    setVerificationResult(null);
    setIsVerifying(true);

    try {
      // For likes and comments, we might want to check for post URLs, but for now we use the same structural check
      const result = await dbService.verifyProfile(platform, url);
      setVerificationResult(result);
      if (result.isValid && result.profileName) {
        setUsername(result.profileName);
      }
    } catch (e: any) {
      setVerificationResult({ 
        isValid: false, 
        message: "فشل التحقق الهيكلي. تأكد من الرابط." 
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationResult?.isValid) {
      alert("⚠️ يرجى إجراء الفحص الهيكلي للرابط أولاً.");
      return;
    }

    if (user.points >= totalCost) {
      onPromote(totalCost, amount);
      
      try {
        await dbService.addCampaign({
          id: Math.random().toString(36).substr(2, 9),
          userId: user.id,
          platform,
          type: campaignType,
          username: username || verificationResult?.profileName || "User",
          url,
          targetCount: amount,
          currentCount: 0,
          pointsReward: currentSettings.reward,
          totalInvestment: totalCost,
          createdAt: new Date(),
          active: true,
          completers: []
        });

        setIsSuccess(true);
        setTimeout(() => setIsSuccess(false), 4000);
        setUsername('');
        setUrl('');
        setVerificationResult(null);
      } catch (err: any) {
        alert("فشل إنشاء الحملة: " + err.message);
      }
    } else {
      alert("رصيد الجواهر غير كافٍ.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 lg:space-y-12 animate-in fade-in duration-700 pb-12 lg:pb-24 w-full transition-theme" dir="rtl">
      <div className="text-center space-y-3 lg:space-y-4">
        <h2 className="text-3xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tighter italic">إطلاق الصاروخ الرقمي 🚀</h2>
        <p className="text-slate-500 dark:text-slate-400 font-bold text-base lg:text-xl opacity-80">حدد أهدافك، واستثمر جواهرك للوصول إلى القمة.</p>
      </div>

      <div className="bg-amber-50 dark:bg-amber-950/20 border lg:border-2 border-amber-200 dark:border-amber-800 p-6 lg:p-8 rounded-3xl lg:rounded-[3rem] flex flex-col md:flex-row items-center gap-4 lg:gap-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full"></div>
        <div className="w-14 h-14 lg:w-20 lg:h-20 bg-amber-500 text-white rounded-2xl lg:rounded-[2rem] flex items-center justify-center text-2xl lg:text-4xl shadow-2xl shadow-amber-500/20 rotate-12 shrink-0">
           <i className="fas fa-hand-holding-heart"></i>
        </div>
        <div className="flex-1 text-center md:text-right">
           <h3 className="text-xl lg:text-2xl font-black text-amber-800 dark:text-amber-400 mb-1 lg:mb-2">ميثاق الثقة المتبادلة ⚖️</h3>
           <p className="text-sm lg:text-base font-bold text-amber-700 dark:text-amber-500 leading-relaxed">
             بإطلاقك لهذه الحملة، أنت تؤكد أن الرابط يعمل والحساب عام. نظامنا يضمن لك المتابعين الحقيقيين.
           </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 space-y-6 lg:space-y-8">
          <div className="bg-white dark:bg-slate-900 p-6 lg:p-10 rounded-3xl lg:rounded-[4rem] border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col items-center relative overflow-hidden transition-theme">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-morocco-red to-transparent opacity-50"></div>
             
             <h3 className="text-slate-900 dark:text-slate-500 text-[8px] lg:text-[10px] font-black uppercase tracking-[0.4em] mb-8 lg:mb-12">مقياس النمو المستهدف</h3>
             
             <div className="relative w-48 h-48 lg:w-64 lg:h-64 mb-8 lg:mb-10 group">
                <svg className="w-full h-full transform -rotate-90 drop-shadow-2xl">
                   <circle
                      cx="96"
                      cy="96"
                      r="60"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className="text-slate-100 dark:text-slate-800 lg:hidden"
                   />
                   <circle
                      cx="96"
                      cy="96"
                      r="60"
                      stroke={currentSettings.color}
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={377}
                      style={{ strokeDashoffset: 377 - (amount / maxAmount) * 377, transition: 'stroke-dashoffset 0.5s ease-out' }}
                      strokeLinecap="round"
                      className="drop-shadow-[0_0_10px_rgba(225,29,72,0.4)] lg:hidden"
                   />
                   <circle
                      cx="128"
                      cy="128"
                      r={radius}
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="transparent"
                      className="text-slate-100 dark:text-slate-800 hidden lg:block"
                   />
                   <circle
                      cx="128"
                      cy="128"
                      r={radius}
                      stroke={currentSettings.color}
                      strokeWidth="12"
                      fill="transparent"
                      strokeDasharray={circumference}
                      style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease-out' }}
                      strokeLinecap="round"
                      className="drop-shadow-[0_0_10px_rgba(225,29,72,0.4)] hidden lg:block"
                   />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center animate-in zoom-in duration-500">
                   <span className="text-4xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tighter">{amount}</span>
                   <span className="text-[8px] lg:text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">
                     {campaignType === 'follow' ? 'متابع' : campaignType === 'like' ? 'إعجاب' : 'تعليق'}
                   </span>
                </div>

                <button 
                  type="button"
                  onClick={() => setAmount(prev => Math.max(10, prev - 10))}
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 lg:w-12 lg:h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl lg:rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all text-slate-900 dark:text-white"
                >
                  <i className="fas fa-minus text-sm"></i>
                </button>
                <button 
                  type="button"
                  onClick={() => setAmount(prev => Math.min(maxAmount, prev + 10))}
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 lg:w-12 lg:h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl lg:rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all text-slate-900 dark:text-white"
                >
                  <i className="fas fa-plus text-sm"></i>
                </button>
             </div>

             <input 
                type="range" 
                min="10" 
                max={maxAmount} 
                step="10"
                value={amount} 
                onChange={(e) => setAmount(parseInt(e.target.value))}
                className="w-full h-1.5 lg:h-2 bg-slate-100 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-morocco-red mb-8 lg:mb-10"
             />

             <div className="w-full pt-6 lg:pt-8 border-t border-slate-100 dark:border-white/5 flex flex-col items-center">
                <p className="text-[8px] lg:text-[10px] font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest mb-1 lg:mb-2">الاستثمار المطلوب</p>
                <div className="flex items-baseline gap-2 lg:gap-3 group">
                   <span className={`text-3xl lg:text-5xl font-black transition-all duration-300 ${user.points < totalCost ? 'text-red-500 animate-shake' : 'text-slate-900 dark:text-white group-hover:text-morocco-red'}`}>
                    {totalCost.toLocaleString()}
                   </span>
                   <i className="fas fa-gem text-morocco-blue text-xl lg:text-2xl group-hover:rotate-12 transition-transform"></i>
                </div>
             </div>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6 lg:space-y-8">
          <div className="bg-white dark:bg-slate-900 p-6 lg:p-10 rounded-3xl lg:rounded-[4rem] border border-slate-200 dark:border-slate-800 shadow-2xl transition-theme">
            <form onSubmit={handleSubmit} className="space-y-8 lg:space-y-10">
              
              <div className="space-y-3 lg:space-y-4">
                <label className="text-[8px] lg:text-[10px] font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest px-4 block">نوع التعزيز</label>
                <div className="grid grid-cols-3 gap-2 lg:gap-4">
                  {[
                    { id: 'follow', label: 'متابعين', icon: 'fa-user-plus' },
                    { id: 'like', label: 'إعجابات', icon: 'fa-heart' },
                    { id: 'comment', label: 'تعليقات', icon: 'fa-comment-dots' }
                  ].map(t => (
                    <button 
                      key={t.id} 
                      type="button" 
                      onClick={() => { setCampaignType(t.id as CampaignType); setVerificationResult(null); }} 
                      className={`flex flex-col items-center gap-1.5 lg:gap-2 p-3 lg:p-4 rounded-2xl lg:rounded-3xl border-2 transition-all duration-300 ${campaignType === t.id ? 'border-morocco-red bg-red-50 dark:bg-red-950/20' : 'border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:border-slate-400'}`}
                    >
                      <i className={`fas ${t.icon} text-lg lg:text-xl ${campaignType === t.id ? 'text-morocco-red' : 'text-slate-400 dark:text-slate-500'}`}></i>
                      <span className={`text-[8px] lg:text-[9px] font-black uppercase tracking-widest ${campaignType === t.id ? 'text-morocco-red' : 'text-slate-900 dark:text-slate-400'}`}>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 lg:space-y-4">
                <label className="text-[8px] lg:text-[10px] font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest px-4 block">المنصة</label>
                <div className="grid grid-cols-3 gap-2 lg:gap-4">
                  {(['youtube', 'instagram', 'tiktok'] as Platform[]).map(p => (
                    <button 
                      key={p} 
                      type="button" 
                      onClick={() => { setPlatform(p); setVerificationResult(null); }} 
                      className={`flex flex-col items-center gap-2 lg:gap-3 p-4 lg:p-6 rounded-2xl lg:rounded-[2.5rem] border-2 transition-all duration-300 group ${platform === p ? 'border-morocco-red bg-red-50 dark:bg-red-950/20' : 'border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:border-slate-400'}`}
                    >
                      <i className={`fab fa-${p} text-2xl lg:text-3xl transition-transform group-hover:scale-110 ${platform === p ? 'text-morocco-red' : 'text-slate-400 dark:text-slate-500'}`}></i>
                      <span className={`text-[8px] lg:text-[10px] font-black uppercase tracking-widest ${platform === p ? 'text-morocco-red' : 'text-slate-900 dark:text-slate-400'}`}>{p}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 lg:space-y-4">
                <label className="text-[8px] lg:text-[10px] font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest px-4 block">
                  الرابط (Copy/Paste)
                </label>
                <div className="flex flex-col gap-3 lg:gap-4">
                  <div className="relative group">
                    <i className="fas fa-link absolute left-4 lg:left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-morocco-red text-sm lg:text-base"></i>
                    <input 
                      type="url" 
                      required 
                      value={url} 
                      onChange={e => { setUrl(e.target.value); setVerificationResult(null); }} 
                      placeholder={campaignType === 'follow' ? `https://${platform}.com/user...` : `https://${platform}.com/p/post...`} 
                      className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-2xl lg:rounded-3xl py-4 lg:py-5 pl-10 lg:pl-14 pr-6 lg:pr-8 outline-none focus:border-morocco-red transition-all font-bold text-slate-900 dark:text-white text-left shadow-inner text-sm lg:text-base placeholder:text-slate-400" 
                      dir="ltr"
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={handleVerify} 
                    disabled={isVerifying || !url.trim()} 
                    className="w-full lg:w-auto px-8 py-4 lg:py-5 bg-slate-900 text-white rounded-2xl lg:rounded-3xl font-black text-[10px] lg:text-xs flex items-center justify-center gap-3 hover:scale-105 transition-all disabled:opacity-50 shadow-xl"
                  >
                    {isVerifying ? <i className="fas fa-sync fa-spin"></i> : <i className="fas fa-shield-check"></i>}
                    فحص الرابط
                  </button>
                </div>
                
                {verificationResult && (
                  <div className={`p-4 lg:p-5 rounded-2xl lg:rounded-[2rem] border-2 flex items-center gap-4 lg:gap-5 animate-in slide-in-from-top-4 ${verificationResult.isValid ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500/20 text-emerald-600' : 'bg-red-50 dark:bg-red-950/20 border-red-500/20 text-red-600'}`}>
                    <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl flex items-center justify-center text-lg lg:text-xl shadow-lg shrink-0 ${verificationResult.isValid ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                      <i className={`fas ${verificationResult.isValid ? 'fa-check-double' : 'fa-times'}`}></i>
                    </div>
                    <div>
                      <p className="font-black text-sm lg:text-lg">{verificationResult.isValid ? `${verificationResult.profileName}` : 'خطأ في الرابط'}</p>
                      <p className="text-[10px] lg:text-xs font-bold opacity-70">{verificationResult.message}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3 lg:space-y-4">
                 <label className="text-[8px] lg:text-[10px] font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest px-4 block">وضع التعزيز</label>
                 <div className="grid grid-cols-3 gap-2 lg:gap-4">
                    {(['normal', 'fast', 'ultra'] as const).map(level => (
                      <button 
                        key={level} 
                        type="button" 
                        onClick={() => setBoostLevel(level)} 
                        className={`p-3 lg:p-5 rounded-2xl lg:rounded-3xl border-2 flex flex-col items-center gap-1.5 lg:gap-2 transition-all duration-300 ${boostLevel === level ? 'border-morocco-red bg-red-50 dark:bg-red-900/10' : 'border-slate-50 dark:border-slate-800 shadow-sm'}`}
                      >
                        <i className={`fas ${boostSettings[campaignType][level].icon} text-lg lg:text-xl ${boostLevel === level ? 'text-morocco-red animate-bounce' : 'text-slate-400 dark:text-slate-500'}`}></i>
                        <span className={`text-[8px] lg:text-[10px] font-black uppercase tracking-widest ${boostLevel === level ? 'text-morocco-red' : 'text-slate-900 dark:text-slate-400'}`}>{boostSettings[campaignType][level].label}</span>
                      </button>
                    ))}
                 </div>
              </div>

              <button 
                type="submit" 
                disabled={!verificationResult?.isValid || user.points < totalCost} 
                className="w-full py-5 lg:py-6 bg-morocco-red text-white rounded-2xl lg:rounded-[2.5rem] font-black text-lg lg:text-2xl hover:brightness-110 shadow-2xl shadow-red-500/40 disabled:opacity-50 disabled:grayscale transition-all active:scale-95 flex items-center justify-center gap-4 lg:gap-6"
              >
                <span>نشر الحملة الآن 🔥</span>
                <i className="fas fa-paper-plane text-sm lg:text-xl"></i>
              </button>
            </form>
          </div>
        </div>
      </div>

      {isSuccess && (
        <div className="fixed bottom-10 right-10 z-[200] bg-slate-900 text-white px-10 py-6 rounded-[2.5rem] shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-20 border border-white/10">
          <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-2xl">
            <i className="fas fa-rocket"></i>
          </div>
          <div>
            <p className="font-black text-xl">تم الإطلاق بنجاح! 🚀</p>
            <p className="text-xs text-slate-400 font-bold">خصم {(totalCost).toLocaleString()} جواهر وتسجيل العملية.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromoteModule;
