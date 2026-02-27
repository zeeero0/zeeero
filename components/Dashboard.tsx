
import React, { useState, useEffect } from 'react';
import { User, Campaign } from '../types';
import { dbService } from '../services/dbService';
import CommunityTrustBoard from './CommunityTrustBoard';

interface DashboardProps {
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [myCampaigns, setMyCampaigns] = useState<Campaign[]>([]);
  const [isRating, setIsRating] = useState<string | null>(null); 
  const [ratingMessage, setRatingMessage] = useState<string | null>(null);
  const [completerDetails, setCompleterDetails] = useState<Record<string, User>>({});

  useEffect(() => {
    const fetchMyCampaigns = async () => {
      const all = await dbService.getCampaigns();
      setMyCampaigns(all.filter(c => c.userId === user.id));
    };
    fetchMyCampaigns();
  }, [user.id]);

  useEffect(() => {
    if (selectedCampaign) {
      const fetchCompleters = async () => {
        const users = await dbService.getUsers();
        const detailsMap: Record<string, User> = {};
        selectedCampaign.completers.forEach(comp => {
          const u = users.find(usr => usr.id === comp.userId);
          if (u) detailsMap[comp.userId] = u;
        });
        setCompleterDetails(detailsMap);
      };
      fetchCompleters();
    }
  }, [selectedCampaign]);

  const handleRate = async (campaignId: string, completerId: string, rating: 'favorable' | 'negative') => {
    setIsRating(completerId);
    try {
      const res = await fetch('/api/campaigns/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId, completerId, rating })
      });
      const data = await res.json();
      
      const all = await dbService.getCampaigns();
      const updatedMyCampaigns = all.filter(c => c.userId === user.id);
      setMyCampaigns(updatedMyCampaigns);
      
      if (selectedCampaign) {
        const updatedCampaign = updatedMyCampaigns.find(c => c.id === campaignId);
        if (updatedCampaign) setSelectedCampaign(updatedCampaign);
      }

      if (data.message) {
        setRatingMessage(data.message);
        setTimeout(() => setRatingMessage(null), 5000);
      }
    } catch (error) {
      alert("فشل التقييم. يرجى التأكد من اتصال السيرفر.");
    } finally {
      setIsRating(null);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 w-full transition-all">
      {user.trustScore <= 50 && (
        <div className="p-6 lg:p-10 bg-red-600/20 border-2 lg:border-4 border-red-600 rounded-3xl lg:rounded-[3.5rem] animate-pulse flex flex-col md:flex-row items-center gap-4 lg:gap-8 shadow-2xl">
            <div className="w-16 h-16 lg:w-20 lg:h-20 bg-red-600 text-white rounded-2xl lg:rounded-[2rem] flex items-center justify-center text-3xl lg:text-4xl shadow-2xl border-2 border-white/20">
               <i className="fas fa-biohazard"></i>
            </div>
            <div className="flex-1 text-center md:text-right">
               <h3 className="text-xl lg:text-2xl font-black text-red-600 mb-1 lg:mb-2 italic">تحذير أمني خطير ⚠️</h3>
               <p className="text-slate-900 dark:text-white font-bold text-base lg:text-lg">
                 لقد وصلت نسبة ثقتك إلى <span className="text-red-600 text-2xl lg:text-3xl font-black">{user.trustScore}%</span>. حسابك معرض للتقييد النهائي.
               </p>
            </div>
        </div>
      )}

      <div className="flex flex-col gap-1 lg:gap-2 relative text-center md:text-right px-2 lg:px-0">
        <h2 className="text-2xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter italic">
          أهلاً <span className="text-morocco-red">{user.username}</span> 👋
        </h2>
        <p className="text-slate-500 dark:text-slate-300 font-bold text-xs lg:text-xl opacity-80">نظام التكافل الموثق - واجهة التحكم المركزية.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-10">
        <StatCard label="رصيد الجواهر" val={(user.points || 0).toLocaleString()} sub="جوهرة" icon="fa-gem" color="text-morocco-blue" bg="bg-blue-100 dark:bg-blue-900/30" />
        <StatCard label="درجة النزاهة" val={`${user.trustScore}%`} sub="Trust Score" icon="fa-shield-halved" color={user.trustScore <= 50 ? 'text-red-600' : 'text-emerald-600'} bg="bg-emerald-100 dark:bg-emerald-900/30" />
        <StatCard label="نمو الحساب" val={user.totalFollowersReceived || 0} sub="متابع" icon="fa-users" color="text-morocco-red" bg="bg-red-100 dark:bg-red-900/30" />
      </div>

      <div className="bg-white dark:bg-[#0f172a] rounded-3xl lg:rounded-[4rem] border border-slate-100 dark:border-white/10 shadow-2xl overflow-hidden">
        <div className="p-5 lg:p-10 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
           <h3 className="font-black text-lg lg:text-3xl text-slate-900 dark:text-white flex items-center gap-3 lg:gap-5 italic">
             <i className="fas fa-bullhorn text-morocco-red"></i> حملاتك الجارية
           </h3>
        </div>
        <div className="p-4 lg:p-10">
           {myCampaigns.length === 0 ? (
             <div className="py-12 lg:py-28 text-center text-slate-400 font-bold opacity-30 italic text-sm">لا توجد حملات نشطة حالياً...</div>
           ) : (
             <div className="space-y-4 lg:space-y-8">
                {myCampaigns.map(c => (
                  <div key={c.id} className="p-5 lg:p-10 bg-slate-50 dark:bg-white/5 rounded-2xl lg:rounded-[3.5rem] border border-slate-200 dark:border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 lg:gap-10 group hover:scale-[1.01] transition-all">
                     <div className="flex items-center gap-4 lg:gap-8 text-right w-full md:w-auto">
                        <div className="w-12 h-12 lg:w-20 lg:h-20 bg-white dark:bg-slate-800 rounded-xl lg:rounded-[2.5rem] flex items-center justify-center text-morocco-red shadow-xl border border-slate-100 dark:border-white/20">
                           <i className={`fab fa-${c.platform} text-xl lg:text-4xl`}></i>
                        </div>
                        <div>
                           <p className="font-black text-lg lg:text-3xl text-slate-900 dark:text-white tracking-tighter">@{c.username}</p>
                           <p className="text-[8px] lg:text-xs font-black uppercase tracking-widest mt-0.5 lg:mt-1 opacity-70">المكافأة: {c.pointsReward} جوهرة</p>
                        </div>
                     </div>
                     <div className="flex flex-col lg:flex-row items-center gap-4 lg:gap-12 w-full md:w-auto">
                        <div className="text-center md:text-right w-full md:w-auto">
                            <p className="text-base lg:text-2xl font-black text-slate-900 dark:text-white">{c.currentCount} / {c.targetCount}</p>
                            <div className="w-full md:w-64 h-2 lg:h-4 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-1.5 lg:mt-2">
                                <div className="h-full bg-morocco-red rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(225,29,72,0.8)]" style={{width: `${(c.currentCount/c.targetCount)*100}%`}}></div>
                            </div>
                        </div>
                        <button onClick={() => setSelectedCampaign(c)} className="w-full md:w-auto px-6 lg:px-10 py-3.5 lg:py-5 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl lg:rounded-[2rem] font-black text-[10px] lg:text-sm hover:scale-105 transition-all">
                           التحقق ({c.completers.filter(com => com.rating === 'pending').length})
                        </button>
                     </div>
                  </div>
                ))}
             </div>
           )}
        </div>
      </div>

      <CommunityTrustBoard />

{selectedCampaign && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 lg:p-8 bg-black/95 backdrop-blur-3xl animate-in fade-in duration-500">
            <div className="w-full max-w-5xl bg-white dark:bg-[#020617] rounded-3xl lg:rounded-[4.5rem] p-4 lg:p-12 relative shadow-2xl border border-slate-100 dark:border-white/10 overflow-hidden flex flex-col h-[90vh] lg:h-auto max-h-[95vh]">
               <div className="absolute top-0 left-0 w-full h-1.5 bg-morocco-red"></div>
               
               {/* الرأس - متجاوب */}
               <div className="flex justify-between items-center mb-6 lg:mb-12 shrink-0">
                  <div className="text-right">
                     <h2 className="text-xl lg:text-4xl font-black text-slate-900 dark:text-white italic tracking-tighter">التحقق من المنجزين</h2>
                     <p className="text-slate-500 font-bold mt-1 text-[10px] lg:text-base opacity-70">عاين الحسابات للتأكد من المتابعة.</p>
                  </div>
                  <button onClick={() => setSelectedCampaign(null)} className="w-10 h-10 lg:w-16 lg:h-16 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white hover:text-morocco-red transition-all flex items-center justify-center group">
                     <i className="fas fa-times text-xl lg:text-3xl group-hover:rotate-90 transition-transform"></i>
                  </button>
               </div>

               {/* قائمة المنجزين - تدعم التمرير للجوال */}
               <div className="space-y-4 lg:space-y-8 overflow-y-auto px-1 pb-6 custom-scrollbar flex-1">
                  {selectedCampaign.completers.length === 0 ? (
                    <div className="text-center py-20 opacity-20 italic font-black text-xl lg:text-2xl tracking-widest text-slate-500 dark:text-white">لا يوجد منجزون...</div>
                  ) : (
                    selectedCampaign.completers.map((completer, idx) => (
                      <div key={idx} className="p-4 lg:p-8 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2rem] lg:rounded-[3rem] flex flex-col gap-4 lg:gap-8 transition-all group">
                         
                         {/* بيانات الشخص والأزرار */}
                         <div className="flex flex-col lg:flex-row justify-between items-center lg:items-center gap-4 lg:gap-8">
                            <div className="flex items-center gap-3 lg:gap-6 w-full lg:w-auto text-right">
                               <img 
                                 src={completerDetails[completer.userId]?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${completer.username}`} 
                                 className="w-14 h-14 lg:w-20 lg:h-20 rounded-2xl lg:rounded-3xl border-2 border-white dark:border-slate-700 shadow-lg shrink-0" 
                                 alt="user" 
                               />
                               <div className="flex-1 min-w-0">
                                  <p className="font-black text-lg lg:text-2xl text-slate-900 dark:text-white truncate italic">@{completer.username}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                     <span className={`text-[9px] lg:text-[10px] font-black px-2 py-1 rounded-lg uppercase ${completerDetails[completer.userId]?.trustScore! >= 80 ? 'bg-emerald-500/20 text-emerald-600' : 'bg-red-500/20 text-red-600'}`}>
                                         نزاهة: {completerDetails[completer.userId]?.trustScore || 0}%
                                     </span>
                                  </div>
                               </div>
                            </div>

                            {/* أزرار التقييم - عرض كامل في الجوال */}
                            <div className="w-full lg:w-auto">
                            {completer.rating === 'pending' ? (
                               <div className="grid grid-cols-2 lg:flex gap-3 lg:gap-4 w-full">
                                   <button 
                                     onClick={() => handleRate(selectedCampaign.id, completer.userId, 'favorable')} 
                                     disabled={isRating === completer.userId} 
                                     className="px-4 lg:px-10 py-4 lg:py-5 bg-emerald-600 text-white rounded-2xl font-black text-xs lg:text-sm hover:scale-105 active:scale-95 transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                                   >
                                     {isRating === completer.userId ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-check"></i>} 
                                     <span>صادق</span>
                                   </button>
                                   <button 
                                     onClick={() => handleRate(selectedCampaign.id, completer.userId, 'negative')} 
                                     disabled={isRating === completer.userId} 
                                     className="px-4 lg:px-10 py-4 lg:py-5 bg-morocco-red text-white rounded-2xl font-black text-xs lg:text-sm hover:scale-105 active:scale-95 transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2"
                                   >
                                     {isRating === completer.userId ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-times"></i>} 
                                     <span>كاذب</span>
                                   </button>
                               </div>
                            ) : (
                               <div className={`w-full text-center px-8 py-4 rounded-2xl text-[10px] lg:text-sm font-black uppercase border-2 ${completer.rating === 'favorable' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-red-500/10 text-morocco-red border-red-500/20'}`}>
                                  {completer.rating === 'favorable' ? 'تم القبول ✅' : 'تم الإبلاغ ❌'}
                               </div>
                            )}
                            </div>
                         </div>

                         {/* الحسابات المربوطة - عرض شبكي مرن */}
                         <div className="bg-white/50 dark:bg-white/5 p-4 lg:p-6 rounded-[1.5rem] lg:rounded-[2.2rem] border border-slate-200 dark:border-white/5">
                            <p className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 text-right">معاينة الحسابات المربوطة:</p>
                            <div className="flex flex-wrap gap-2 lg:gap-4 justify-end">
                               {completerDetails[completer.userId]?.linkedAccounts?.length ? (
                                 completerDetails[completer.userId]?.linkedAccounts?.map((acc: any) => (
                                   <a 
                                     key={acc.id} 
                                     href={acc.url} 
                                     target="_blank" 
                                     rel="noopener noreferrer" 
                                     className="flex items-center gap-3 px-4 lg:px-6 py-3 lg:py-4 bg-white dark:bg-slate-800 rounded-xl lg:rounded-2xl text-[10px] lg:text-xs font-black border border-slate-200 dark:border-slate-700 hover:border-morocco-red hover:shadow-lg transition-all group"
                                   >
                                     <i className={`fab fa-${acc.platform} text-sm lg:text-xl ${acc.platform === 'youtube' ? 'text-red-600' : acc.platform === 'instagram' ? 'text-pink-500' : 'text-slate-900 dark:text-white'}`}></i>
                                     <span className="dark:text-white uppercase tracking-tighter">{acc.platform}</span>
                                     <i className="fas fa-external-link-alt text-[8px] opacity-40 group-hover:text-morocco-red transition-colors"></i>
                                   </a>
                                 ))
                               ) : (
                                 <p className="text-[10px] font-bold text-slate-400 italic">لا توجد حسابات موثقة لهذا المستخدم.</p>
                               )}
                            </div>
                         </div>
                      </div>
                    ))
                  )}
               </div>
            </div>
        </div>
      )}

                           {completer.rating === 'pending' ? (
                              <div className="flex gap-2 lg:gap-4 w-full lg:w-auto">
                                 <button onClick={() => handleRate(selectedCampaign.id, completer.userId, 'favorable')} disabled={isRating === completer.userId} className="flex-1 lg:flex-none px-4 lg:px-10 py-3 lg:py-5 bg-emerald-600 text-white rounded-lg lg:rounded-[1.8rem] font-black text-[9px] lg:text-sm hover:scale-105 transition-all shadow-xl shadow-emerald-600/20">
                                    {isRating === completer.userId ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-check ml-1 lg:ml-2"></i>} صادق
                                 </button>
                                 <button onClick={() => handleRate(selectedCampaign.id, completer.userId, 'negative')} disabled={isRating === completer.userId} className="flex-1 lg:flex-none px-4 lg:px-10 py-3 lg:py-5 bg-morocco-red text-white rounded-lg lg:rounded-[1.8rem] font-black text-[9px] lg:text-sm hover:scale-105 transition-all shadow-xl shadow-red-600/20">
                                    {isRating === completer.userId ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-times ml-1 lg:ml-2"></i>} كاذب
                                 </button>
                              </div>
                           ) : (
                              <div className={`w-full lg:w-auto text-center px-6 lg:px-10 py-3 lg:py-5 rounded-lg lg:rounded-[1.8rem] text-[9px] lg:text-sm font-black uppercase border ${completer.rating === 'favorable' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-red-500/10 text-morocco-red border-red-500/20'}`}>
                                 {completer.rating === 'favorable' ? 'تم القبول ✅' : 'تم الإبلاغ ❌'}
                              </div>
                           )}
                        </div>

                        <div className="bg-white/40 dark:bg-white/5 p-3 lg:p-6 rounded-xl lg:rounded-[2.2rem] border border-slate-200 dark:border-white/5">
                           <p className="text-[7px] lg:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 lg:mb-4 text-right">الحسابات المربوطة:</p>
                           <div className="flex flex-wrap gap-2 lg:gap-4 justify-end">
                              {completerDetails[completer.userId]?.linkedAccounts?.length ? (
                                completerDetails[completer.userId]?.linkedAccounts?.map((acc: any) => (
                                  <a 
                                    key={acc.id} 
                                    href={acc.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="flex items-center gap-2 lg:gap-4 px-3 lg:px-6 py-2 lg:py-4 bg-white dark:bg-slate-800 rounded-lg lg:rounded-2xl text-[8px] lg:text-xs font-black border border-slate-100 dark:border-slate-700 hover:border-morocco-red hover:scale-105 transition-all shadow-sm group"
                                  >
                                    <i className={`fab fa-${acc.platform} text-sm lg:text-xl ${acc.platform === 'youtube' ? 'text-red-500' : acc.platform === 'instagram' ? 'text-pink-500' : 'text-slate-900 dark:text-white'}`}></i>
                                    <div className="text-right">
                                       <p className="text-slate-900 dark:text-white">{acc.platform}</p>
                                    </div>
                                    <i className="fas fa-external-link-alt text-[7px] mr-1 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                                  </a>
                                ))
                              ) : (
                                <p className="text-[9px] font-bold text-slate-400 italic">لا توجد حسابات.</p>
                              )}
                           </div>
                        </div>
                     </div>
                   ))
                 )}
              </div>
           </div>
        </div>
      )}

      {ratingMessage && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-10 py-7 rounded-[3rem] shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-20 border-2 border-morocco-red/40">
            <div className="w-14 h-14 bg-morocco-red text-white rounded-2xl flex items-center justify-center text-3xl shadow-lg">
               <i className="fas fa-shield-heart"></i>
            </div>
            <div className="text-right">
               <p className="font-black text-xl">{ratingMessage}</p>
            </div>
        </div>
      )}
    </div>
  );
};

const StatCard: React.FC<{ label: string, val: any, sub: string, icon: string, color: string, bg: string }> = ({ label, val, icon, color, bg, sub }) => (
  <div className="bg-white dark:bg-[#0f172a] p-5 lg:p-10 rounded-2xl lg:rounded-[4rem] border border-slate-100 dark:border-white/10 shadow-2xl flex items-center justify-between group hover:scale-[1.03] transition-all">
    <div className="text-right relative z-10">
      <p className="text-slate-500 text-[8px] lg:text-xs font-black uppercase tracking-[0.2em] lg:tracking-[0.3em] mb-1.5 lg:mb-4 opacity-70">{label}</p>
      <div className="flex items-baseline gap-2 lg:gap-4">
        <p className={`text-2xl lg:text-5xl font-black tracking-tighter ${color}`}>{val}</p>
        <span className="text-[8px] lg:text-xs text-slate-400 font-bold uppercase tracking-widest">{sub}</span>
      </div>
    </div>
    <div className={`w-12 h-12 lg:w-20 lg:h-20 ${bg} ${color} rounded-xl lg:rounded-[2.2rem] flex items-center justify-center shadow-inner border border-white/10`}>
       <i className={`fas ${icon} text-xl lg:text-4xl`}></i>
    </div>
  </div>
);

export default Dashboard;
