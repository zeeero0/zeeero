
import React, { useState, useEffect, useMemo } from 'react';
import { Platform, Campaign, User } from '../types';
import { dbService } from '../services/dbService';
import { securityService } from '../services/securityService';

interface EarnModuleProps {
  currentUser: User;
  onEarn: (pts: number, campaignId: string) => void;
}

const EarnModule: React.FC<EarnModuleProps> = ({ currentUser, onEarn }) => {
  const [filter, setFilter] = useState<Platform | 'all'>('all');
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openedBoxes, setOpenedBoxes] = useState<number[]>([]);

  const handleSpecialBoxClick = async (boxId: number) => {
    if (currentUser.isSuspended) {
      alert("⚠️ تم تجميد حسابك بسبب نشاط مشبوه.");
      return;
    }

    // Mark as opened
    if (!openedBoxes.includes(boxId)) {
      setOpenedBoxes(prev => [...prev, boxId]);
    }

    // Open the link as requested
    window.open('https://omg10.com/4/10645896', '_blank');

    try {
      // Update locally via the provided onEarn callback
      onEarn(35, `special_box_${boxId}`);
      
      // Since onEarn only updates local state in App.tsx, we must persist to DB here
      const updatedUser = { ...currentUser, points: currentUser.points + 35 };
      await dbService.updateUser(updatedUser);
      
      // Record the transaction
      await dbService.addTransaction(
        currentUser.id, 
        'earn', 
        35, 
        `مكافأة الصندوق الذهبي الخاص #${boxId}`, 
        'completed', 
        currentUser.username
      );

      // Success message as requested
      alert("تهانينا! لقد ربحت 35 جوهرة من الصندوق الخاص. استمتع بمكافأتك! 🎉");
    } catch (error: any) {
      console.error("Special box error:", error);
    }
  };

  const refreshData = async () => {
    const campaigns = await dbService.getCampaigns();
    setAllCampaigns(campaigns);
  };

  useEffect(() => {
    refreshData();
  }, [currentUser.id]);

  useEffect(() => {
    let interval: any;
    if (verifying && timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [verifying, timer]);

  const normalizeUrl = (url: string) => {
    try {
      return url.toLowerCase()
        .replace(/^https?:\/\/(www\.)?/, '')
        .replace(/\/$/, '');
    } catch (e) {
      return url.toLowerCase();
    }
  };

  const followedProfileKeys = useMemo(() => {
    const keys = new Set<string>();
    allCampaigns.forEach(c => {
      const isCompletedByMe = c.completers.some(comp => comp.userId === currentUser.id);
      if (isCompletedByMe) {
        keys.add(`${c.platform}:${c.type}:${normalizeUrl(c.url)}`);
      }
    });
    return keys;
  }, [allCampaigns, currentUser.id]);

  const startTask = (campaign: Campaign) => {
    if (currentUser.isSuspended) {
      alert("⚠️ تم تجميد حسابك بسبب نشاط مشبوه.");
      return;
    }
    window.open(campaign.url, '_blank');
    setVerifying(campaign.id);
    setTimer(10);
  };

  const handleConfirmTask = async (campaign: Campaign) => {
    if (timer > 0 || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const trans = await dbService.getTransactions(currentUser.id);
      const earnTrans = trans.filter(t => t.type === 'earn');
      const lastTask = earnTrans[0];
      
      if (lastTask && securityService.isVelocitySuspicious(lastTask.date)) {
        alert("⚠️ مهلاً! أنت سريع جداً. يرجى إتمام المهام بصدق.");
        setIsSubmitting(false);
        return;
      }

      const result = await dbService.registerCompletion(campaign.id, currentUser.id, currentUser.username);
      if (result.message) {
        alert(result.message);
      }
      onEarn(campaign.pointsReward, campaign.id);
      setVerifying(null);
      await refreshData();
    } catch (error: any) {
      alert(error.message || "فشل تسجيل الإنجاز.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayedCampaigns = allCampaigns
    .filter(c => {
      const platformMatch = filter === 'all' || c.platform === filter;
      const isMyOwn = c.userId === currentUser.id;
      const profileKey = `${c.platform}:${c.type}:${normalizeUrl(c.url)}`;
      const alreadyFollowedThisProfile = followedProfileKeys.has(profileKey);
      return platformMatch && c.active && !isMyOwn && !alreadyFollowedThisProfile;
    });

  return (
    <div className="space-y-8 lg:space-y-12 animate-in fade-in duration-700 w-full relative transition-all">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 lg:gap-8">
        <div className="text-center md:text-right">
          <h2 className="text-3xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tighter italic">سوق المهام الموثقة 🛡️</h2>
          <p className="text-slate-500 dark:text-slate-300 font-bold text-sm lg:text-lg opacity-80 mt-1">نظام يضمن حق المتابع والمروّج بكل عدالة.</p>
        </div>
        <div className="flex bg-white dark:bg-[#020617] p-1.5 lg:p-2 rounded-2xl lg:rounded-[2.5rem] border lg:border-2 border-slate-100 dark:border-white/10 shadow-2xl overflow-x-auto max-w-full">
          {(['all', 'youtube', 'instagram', 'tiktok'] as const).map(p => (
            <button key={p} onClick={() => setFilter(p)} className={`px-4 lg:px-8 py-2 lg:py-3 rounded-xl lg:rounded-[2rem] text-[10px] lg:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${filter === p ? 'bg-morocco-red text-white shadow-xl' : 'text-slate-400 dark:text-slate-500 hover:text-morocco-red'}`}>
              {p === 'all' ? 'الكل' : p}
            </button>
          ))}
        </div>
      </div>

      {/* Progress to Treasures */}
      {followedProfileKeys.size < 20 && (
        <div className="bg-white dark:bg-[#0f172a] p-6 lg:p-8 rounded-2xl lg:rounded-[3rem] border lg:border-2 border-slate-100 dark:border-white/10 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-slate-100 dark:bg-white/5">
            <div 
              className="h-full bg-morocco-red transition-all duration-1000 ease-out"
              style={{ width: `${(followedProfileKeys.size / 20) * 100}%` }}
            ></div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 lg:gap-6">
            <div className="flex items-center gap-4 lg:gap-5">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-amber-500/10 text-amber-500 rounded-xl lg:rounded-2xl flex items-center justify-center text-lg animate-pulse">
                <i className="fas fa-lock"></i>
              </div>
              <div className="text-right">
                <h4 className="text-lg lg:text-xl font-black text-slate-900 dark:text-white">صناديق الكنز 🎁</h4>
                <p className="text-[10px] lg:text-sm font-bold text-slate-500 dark:text-slate-400">أكمل 20 مهمة لربح 105 جوهرة إضافية!</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-[8px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest">التقدم</p>
                <p className="text-xl lg:text-2xl font-black text-morocco-red">{followedProfileKeys.size} / 20</p>
              </div>
              <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-full border-2 lg:border-4 border-slate-100 dark:border-white/5 flex items-center justify-center relative">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="24" cy="24" r="20"
                    stroke="currentColor" strokeWidth="2" fill="transparent"
                    className="text-morocco-red lg:hidden"
                    strokeDasharray={125.6}
                    strokeDashoffset={125.6 - (followedProfileKeys.size / 20) * 125.6}
                  />
                  <circle
                    cx="32" cy="32" r="28"
                    stroke="currentColor" strokeWidth="4" fill="transparent"
                    className="text-morocco-red hidden lg:block"
                    strokeDasharray={175.9}
                    strokeDashoffset={175.9 - (followedProfileKeys.size / 20) * 175.9}
                  />
                </svg>
                <span className="absolute text-[8px] lg:text-[10px] font-black text-slate-900 dark:text-white">{Math.round((followedProfileKeys.size / 20) * 100)}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Special Treasure Section - Only visible after 20 tasks */}
      {followedProfileKeys.size >= 20 && (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 lg:p-8 rounded-3xl lg:rounded-[3.5rem] border lg:border-2 border-amber-500/30 shadow-2xl relative overflow-hidden transition-all animate-in zoom-in duration-700">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[100px] rounded-full"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 blur-[80px] rounded-full"></div>
          
          <div className="relative z-10 flex flex-col items-center text-center space-y-4">
            <div className="flex items-center gap-3 lg:gap-4">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-amber-500 rounded-xl lg:rounded-2xl flex items-center justify-center text-black shadow-xl shadow-amber-500/20 rotate-3">
                <i className="fas fa-gift text-lg lg:text-xl"></i>
              </div>
              <h3 className="text-xl lg:text-2xl font-black text-white italic tracking-tighter">صناديق الكنز الأسطورية! 🎁</h3>
            </div>
            
            <div className="space-y-1">
              <p className="text-amber-400 font-black text-base lg:text-lg">افتح الصندوق، شاهد الإعلان، وفز بـ 35 جوهرة!</p>
            </div>
            
            <div className="grid grid-cols-3 gap-3 lg:gap-6 w-full max-w-2xl mt-4 lg:mt-6">
              {[1, 2, 3].map((box) => (
                <button
                  key={box}
                  onClick={() => handleSpecialBoxClick(box)}
                  className="group relative bg-white/5 border border-white/10 p-4 lg:p-6 rounded-2xl lg:rounded-[2.5rem] hover:border-amber-500/50 transition-all hover:scale-105 active:scale-95 flex flex-col items-center gap-3 lg:gap-4 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className={`text-3xl lg:text-5xl transition-all duration-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.3)] ${openedBoxes.includes(box) ? 'text-emerald-500 rotate-0' : 'text-amber-500 group-hover:rotate-6'}`}>
                    <i className={`fas ${openedBoxes.includes(box) ? 'fa-box-open' : 'fa-box'}`}></i>
                  </div>
                  
                  <div className="space-y-1 relative z-10">
                    <p className="text-white font-black text-[8px] lg:text-[10px] uppercase tracking-widest">#{box}</p>
                    <div className={`px-2 lg:px-3 py-1 rounded-full border flex items-center gap-1 transition-colors ${openedBoxes.includes(box) ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-500' : 'bg-amber-500/20 border-amber-500/30 text-amber-500'}`}>
                      <span className="font-black text-xs lg:text-sm">+35</span>
                      <i className="fas fa-gem text-[7px] lg:text-[8px]"></i>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {displayedCampaigns.length === 0 ? (
        <div className="py-16 lg:py-32 text-center flex flex-col items-center gap-6 opacity-30">
          <div className="relative">
             <i className="fas fa-check-double text-6xl lg:text-8xl text-slate-300 dark:text-white"></i>
             <i className="fas fa-star text-morocco-gold absolute -top-3 -right-3 lg:-top-4 lg:-right-4 animate-bounce text-xl lg:text-2xl"></i>
          </div>
          <p className="text-xl lg:text-2xl font-black text-slate-500 dark:text-white">لا توجد مهام جديدة حالياً!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-10">
          {displayedCampaigns.map((campaign) => (
            <div key={campaign.id} className="bg-white dark:bg-[#0f172a] p-6 lg:p-10 rounded-3xl lg:rounded-[4rem] border lg:border-2 border-slate-100 dark:border-white/10 shadow-2xl flex flex-col items-center text-center group hover:border-morocco-red/40 transition-all hover:scale-[1.04] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
              
              <div className={`w-16 h-16 lg:w-24 lg:h-24 rounded-2xl lg:rounded-[2.2rem] flex items-center justify-center mb-4 lg:mb-6 text-3xl lg:text-5xl shadow-inner group-hover:rotate-6 transition-transform border dark:border-white/20 ${campaign.platform === 'youtube' ? 'text-red-500 bg-red-50 dark:bg-red-950/40' : 'text-slate-900 dark:text-white bg-slate-50 dark:bg-white/5'}`}>
                <i className={`fab fa-${campaign.platform}`}></i>
              </div>
              
              <div className="flex items-center gap-2 mb-3 lg:mb-4">
                <div className="bg-slate-100 dark:bg-white/10 px-3 lg:px-4 py-1 lg:py-1.5 rounded-full flex items-center gap-2">
                  <i className={`fas ${campaign.type === 'follow' ? 'fa-user-plus' : campaign.type === 'like' ? 'fa-heart' : 'fa-comment-dots'} text-[8px] lg:text-[10px] text-morocco-red`}></i>
                  <span className="text-[8px] lg:text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    {campaign.type === 'follow' ? 'متابعة' : campaign.type === 'like' ? 'إعجاب' : 'تعليق'}
                  </span>
                </div>
              </div>

              <h4 className="font-black text-xl lg:text-3xl text-slate-900 dark:text-white mb-1 lg:mb-2 tracking-tighter">@{campaign.username}</h4>
              
              <div className="bg-blue-50 dark:bg-blue-900/30 px-4 lg:px-8 py-3 lg:py-5 rounded-2xl lg:rounded-[2rem] w-full my-4 lg:my-6 border border-blue-100 dark:border-blue-500/20 shadow-inner">
                 <p className="text-morocco-blue dark:text-blue-400 font-black text-2xl lg:text-4xl">+{campaign.pointsReward} <span className="text-[10px] lg:text-xs font-black tracking-widest uppercase ml-1 lg:ml-2 opacity-60">جواهر</span></p>
              </div>
              
              {verifying === campaign.id ? (
                <button 
                  onClick={() => handleConfirmTask(campaign)} 
                  disabled={timer > 0 || isSubmitting} 
                  className="w-full py-4 lg:py-6 bg-emerald-600 text-white rounded-2xl lg:rounded-[2.2rem] font-black text-sm lg:text-lg shadow-2xl shadow-emerald-500/30 disabled:opacity-50 transition-all animate-pulse border border-white/20"
                >
                  {isSubmitting ? <i className="fas fa-spinner fa-spin"></i> : timer > 0 ? `تحقق (${timer} ث)` : 'تأكيد الإنجاز 🔥'}
                </button>
              ) : (
                <button onClick={() => startTask(campaign)} className="w-full py-4 lg:py-6 bg-slate-950 dark:bg-white text-white dark:text-black rounded-2xl lg:rounded-[2.2rem] font-black text-sm lg:text-lg shadow-2xl hover:brightness-110 active:scale-95 transition-all border dark:border-white/20">بدء المهمة</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EarnModule;
