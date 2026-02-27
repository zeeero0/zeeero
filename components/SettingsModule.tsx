
import React, { useState, useRef, useEffect } from 'react';
import { User, AuditLog } from '../types';
import { dbService } from '../services/dbService';

interface SettingsProps {
  user: User;
  onUpdate: (user: User) => void;
}

type SettingsTab = 'profile' | 'security' | 'activity';

const SettingsModule: React.FC<SettingsProps> = ({ user, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  
  // Profile States
  const [username, setUsername] = useState(user.username);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  
  // Security Verification States
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState('');
  const [verifyPassword, setVerifyPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  
  // Sensitive Data States
  const [newEmail, setNewEmail] = useState(user.email);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isUpdatingSecurity, setIsUpdatingSecurity] = useState(false);
  
  // Activity States
  const [myLogs, setMyLogs] = useState<AuditLog[]>([]);
  
  useEffect(() => {
    if (activeTab === 'activity') {
      const fetchLogs = async () => {
        const all = await dbService.getAuditLogs();
        setMyLogs(all.filter(l => l.userId === user.id));
      };
      fetchLogs();
    }
  }, [activeTab, user.id]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      const updatedUser = { ...user, username };
      await dbService.updateUser(updatedUser);
      onUpdate(updatedUser);
      alert('تم تحديث الاسم بنجاح ✅');
    } catch (err: any) { alert(err.message); }
    finally { setIsUpdatingProfile(false); }
  };

  const handleUnlockSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    try {
      const res = await dbService.verifyIdentity(user.id, verifyEmail, verifyPassword);
      if (res.success) {
        setIsUnlocked(true);
      } else {
        alert(res.message);
      }
    } catch (err: any) { alert(err.message); }
    finally { setIsVerifying(false); }
  };

  const handleUpdateSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmNewPassword) {
      alert("كلمات المرور الجديدة غير متطابقة.");
      return;
    }
    setIsUpdatingSecurity(true);
    try {
      const res = await dbService.updateSecurity(user.id, {
        currentEmail: verifyEmail,
        currentPassword: verifyPassword,
        newEmail: newEmail !== user.email ? newEmail : undefined,
        newPassword: newPassword || undefined
      });
      if (res.success) {
        alert(res.message);
        // Update local session
        onUpdate({ ...user, email: newEmail, password: newPassword || user.password });
        setIsUnlocked(false);
        setVerifyPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        alert(res.message);
      }
    } catch (err: any) { alert(err.message); }
    finally { setIsUpdatingSecurity(false); }
  };

  const currentAvatar = user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`;
  const profileCompletion = [user.username, user.avatar, user.email, user.trustScore >= 100].filter(Boolean).length * 25;

  return (
    <div className="max-w-6xl mx-auto space-y-8 lg:space-y-12 animate-in fade-in duration-700 pb-16 lg:pb-24 transition-theme">
      
      {/* Dynamic Header */}
      <div className="bg-white dark:bg-[#0f172a] rounded-3xl lg:rounded-[4rem] p-6 lg:p-12 border-2 border-slate-100 dark:border-white/10 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center gap-6 lg:gap-12">
        <div className="absolute top-0 left-0 w-full h-1.5 lg:h-2 bg-gradient-to-r from-morocco-red via-morocco-gold to-morocco-green"></div>
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full"></div>
        
        <div className="relative shrink-0">
          <div className="w-24 h-24 lg:w-48 lg:h-48 rounded-2xl lg:rounded-[3.5rem] overflow-hidden border-2 lg:border-4 border-white dark:border-slate-800 shadow-2xl">
            <img src={currentAvatar} className="w-full h-full object-cover" />
          </div>
        </div>

        <div className="flex-1 text-center md:text-right space-y-3 lg:space-y-5">
          <div className="flex items-center gap-3 lg:gap-4 justify-center md:justify-start">
            <h2 className="text-2xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{user.username}</h2>
            <div className="bg-emerald-500 text-white text-[8px] lg:text-[10px] px-3 lg:px-4 py-1 lg:py-1.5 rounded-full font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">Active Warrior</div>
          </div>
          
          <div className="flex flex-wrap gap-4 lg:gap-8 justify-center md:justify-start">
             <div className="space-y-1">
                <p className="text-[8px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest">اكتمال البروفايل</p>
                <div className="flex items-center gap-3 lg:gap-4">
                   <div className="w-24 lg:w-32 h-1.5 lg:h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-morocco-red" style={{width: `${profileCompletion}%`}}></div>
                   </div>
                   <span className="text-[10px] lg:text-xs font-black text-slate-900 dark:text-white">{profileCompletion}%</span>
                </div>
             </div>
             <div className="space-y-1">
                <p className="text-[8px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest">رتبة الثقة</p>
                <div className="flex items-center gap-2">
                   <i className={`fas fa-shield-halved text-[10px] lg:text-xs ${user.trustScore > 80 ? 'text-emerald-500' : 'text-morocco-red'}`}></i>
                   <span className="text-[10px] lg:text-xs font-black text-slate-900 dark:text-white">{user.trustScore}% Verified</span>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex bg-white dark:bg-[#020617] p-2 lg:p-3 rounded-2xl lg:rounded-[2.5rem] border-2 border-slate-100 dark:border-white/10 shadow-xl w-full lg:w-fit mx-auto md:mx-0 overflow-x-auto no-scrollbar">
        {(['profile', 'security', 'activity'] as SettingsTab[]).map(t => (
          <button 
            key={t} onClick={() => setActiveTab(t)}
            className={`flex-1 lg:flex-none px-4 lg:px-10 py-3 lg:py-4 rounded-xl lg:rounded-[1.8rem] text-[10px] lg:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === t ? 'bg-morocco-red text-white shadow-xl' : 'text-slate-400 dark:text-slate-500 hover:text-morocco-red'}`}
          >
            {t === 'profile' ? 'البيانات' : t === 'security' ? 'الأمان' : 'النشاط'}
          </button>
        ))}
      </div>

      {/* Tab Content: Profile */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 animate-in slide-in-from-bottom-10">
           <div className="lg:col-span-7 bg-white dark:bg-[#0f172a] p-6 lg:p-12 rounded-3xl lg:rounded-[4rem] border-2 border-slate-100 dark:border-white/10 shadow-2xl">
              <h3 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white mb-6 lg:mb-10 flex items-center gap-4 lg:gap-5">
                <i className="fas fa-id-card text-morocco-red"></i> تحرير الهوية
              </h3>
              <form onSubmit={handleUpdateProfile} className="space-y-6 lg:space-y-8">
                <div className="space-y-2 lg:space-y-3">
                   <label className="text-[8px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 block">اسم العرض</label>
                   <input 
                     value={username} onChange={e => setUsername(e.target.value)}
                     className="w-full bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/10 rounded-2xl lg:rounded-3xl p-4 lg:p-6 outline-none focus:border-morocco-red transition-all font-bold text-sm lg:text-base text-slate-900 dark:text-white"
                   />
                </div>
                <div className="p-4 lg:p-6 bg-slate-50 dark:bg-white/5 rounded-2xl lg:rounded-3xl border-2 border-slate-100 dark:border-white/5 opacity-50 cursor-not-allowed">
                   <p className="text-[8px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 lg:mb-2">تاريخ الانضمام</p>
                   <p className="font-bold text-xs lg:text-base text-slate-900 dark:text-white">{new Date(user.createdAt).toLocaleDateString('ar-MA', {year:'numeric', month:'long', day:'numeric'})}</p>
                </div>
                <button type="submit" disabled={isUpdatingProfile} className="w-full py-4 lg:py-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl lg:rounded-[2.2rem] font-black text-base lg:text-lg hover:scale-[1.02] transition-all disabled:opacity-50">
                   {isUpdatingProfile ? <i className="fas fa-spinner fa-spin"></i> : 'حفظ التغييرات'}
                </button>
              </form>
           </div>
           
           <div className="lg:col-span-5 bg-gradient-to-br from-morocco-red to-red-900 p-6 lg:p-12 rounded-3xl lg:rounded-[4rem] shadow-2xl text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full"></div>
              <h3 className="text-xl lg:text-2xl font-black mb-6 lg:mb-8 relative z-10">إحصائيات الأداء 📊</h3>
              <div className="space-y-4 lg:space-y-8 relative z-10">
                 <StatRow label="إجمالي المهام" val={user.totalFollowsDone} icon="fa-check-double" />
                 <StatRow label="متابعين مكتسبين" val={user.totalFollowersReceived} icon="fa-users" />
                 <StatRow label="رصيد الجواهر" val={user.points} icon="fa-gem" />
              </div>
           </div>
        </div>
      )}

      {/* Tab Content: Security */}
      {activeTab === 'security' && (
        <div className="max-w-3xl mx-auto space-y-8 lg:space-y-10 animate-in slide-in-from-bottom-10">
           {!isUnlocked ? (
             <div className="bg-white dark:bg-[#0f172a] p-6 lg:p-12 rounded-3xl lg:rounded-[4rem] border-2 border-slate-100 dark:border-white/10 shadow-2xl text-center">
                <div className="w-16 h-16 lg:w-24 lg:h-24 bg-red-100 dark:bg-red-950/40 text-morocco-red rounded-2xl lg:rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 lg:mb-8 text-2xl lg:text-4xl shadow-xl border border-white/20">
                   <i className="fas fa-lock"></i>
                </div>
                <h3 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white mb-3 lg:mb-4">منطقة البيانات الحساسة</h3>
                <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 font-bold mb-6 lg:mb-10">يرجى تأكيد بياناتك الحالية لفتح صلاحية التعديل.</p>
                
                <form onSubmit={handleUnlockSecurity} className="space-y-4 lg:space-y-6 text-right">
                   <div className="space-y-2">
                      <label className="text-[8px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">البريد الحالي</label>
                      <input type="email" value={verifyEmail} onChange={e => setVerifyEmail(e.target.value)} required className="w-full bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/10 rounded-xl lg:rounded-2xl p-4 lg:p-5 outline-none font-bold text-sm lg:text-base text-slate-900 dark:text-white" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[8px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">كلمة المرور الحالية</label>
                      <input type="password" value={verifyPassword} onChange={e => setVerifyPassword(e.target.value)} required className="w-full bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/10 rounded-xl lg:rounded-2xl p-4 lg:p-5 outline-none font-bold text-sm lg:text-base text-slate-900 dark:text-white" />
                   </div>
                   <button type="submit" disabled={isVerifying} className="w-full py-4 lg:py-5 bg-morocco-red text-white rounded-2xl lg:rounded-3xl font-black text-base lg:text-lg shadow-xl shadow-red-500/20">
                      {isVerifying ? <i className="fas fa-spinner fa-spin"></i> : 'فتح القفل الأمني'}
                   </button>
                </form>
             </div>
           ) : (
             <div className="bg-white dark:bg-[#0f172a] p-6 lg:p-12 rounded-3xl lg:rounded-[4rem] border-2 border-emerald-500/30 shadow-2xl relative">
                <div className="absolute top-4 lg:top-8 left-6 lg:left-12 flex items-center gap-2 text-emerald-500 font-black text-[8px] lg:text-[10px] uppercase">
                   <span className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-emerald-500 rounded-full animate-ping"></span>
                   صلاحية مفتوحة
                </div>
                <h3 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white mb-8 lg:mb-10 pt-4 lg:pt-0">تحديث البيانات الأمنية 🛡️</h3>
                
                <form onSubmit={handleUpdateSecurity} className="space-y-6 lg:space-y-8 text-right">
                   <div className="space-y-2 lg:space-y-3">
                      <label className="text-[8px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 block">بريد إلكتروني جديد</label>
                      <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/10 rounded-2xl lg:rounded-3xl p-4 lg:p-6 outline-none focus:border-emerald-500 transition-all font-bold text-sm lg:text-base text-slate-900 dark:text-white" />
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                      <div className="space-y-2 lg:space-y-3">
                         <label className="text-[8px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 block">كلمة مرور جديدة</label>
                         <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="اتركها فارغة" className="w-full bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/10 rounded-2xl lg:rounded-3xl p-4 lg:p-6 outline-none focus:border-emerald-500 transition-all font-bold text-sm lg:text-base text-slate-900 dark:text-white" />
                      </div>
                      <div className="space-y-2 lg:space-y-3">
                         <label className="text-[8px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 block">تأكيد كلمة المرور</label>
                         <input type="password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/10 rounded-2xl lg:rounded-3xl p-4 lg:p-6 outline-none focus:border-emerald-500 transition-all font-bold text-sm lg:text-base text-slate-900 dark:text-white" />
                      </div>
                   </div>

                   <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
                      <button type="submit" disabled={isUpdatingSecurity} className="w-full lg:flex-1 py-4 lg:py-6 bg-emerald-600 text-white rounded-2xl lg:rounded-[2.2rem] font-black text-base lg:text-lg shadow-xl shadow-emerald-500/20">
                         {isUpdatingSecurity ? <i className="fas fa-spinner fa-spin"></i> : 'تحديث البيانات الحساسة'}
                      </button>
                      <button type="button" onClick={() => setIsUnlocked(false)} className="w-full lg:w-auto px-10 py-4 lg:py-6 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-300 rounded-2xl lg:rounded-[2.2rem] font-black text-sm lg:text-base">إلغاء</button>
                   </div>
                </form>
             </div>
           )}
        </div>
      )}

      {/* Tab Content: Activity */}
      {activeTab === 'activity' && (
        <div className="bg-white dark:bg-[#0f172a] p-12 rounded-[4rem] border-2 border-slate-100 dark:border-white/10 shadow-2xl animate-in slide-in-from-bottom-10">
           <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-10 flex items-center gap-5">
             <i className="fas fa-satellite-dish text-morocco-red"></i> سجل الجلسات والنشاط الأمني
           </h3>
           <div className="space-y-4 max-h-[500px] overflow-y-auto pr-6 custom-scrollbar">
              {myLogs.length === 0 ? (
                <div className="py-20 text-center opacity-30 italic font-bold">لا توجد سجلات نشاط حديثة.</div>
              ) : (
                myLogs.map(log => (
                  <div key={log.id} className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5 flex items-center justify-between group">
                     <div className="flex items-center gap-6">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner ${log.action.includes('SECURITY') ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                           <i className={`fas ${log.action.includes('SECURITY') ? 'fa-shield-halved' : 'fa-bolt'}`}></i>
                        </div>
                        <div>
                           <p className="font-black text-slate-900 dark:text-white text-sm">{log.details}</p>
                           <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mt-1">{log.action}</p>
                        </div>
                     </div>
                     <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{new Date(log.timestamp).toLocaleString('ar-MA')}</span>
                  </div>
                ))
              )}
           </div>
        </div>
      )}
    </div>
  );
};

const StatRow: React.FC<{ label: string, val: any, icon: string }> = ({ label, val, icon }) => (
  <div className="flex items-center justify-between p-4 lg:p-6 bg-white/10 rounded-2xl lg:rounded-3xl border border-white/10 backdrop-blur-md group hover:bg-white/20 transition-all">
     <div className="flex items-center gap-3 lg:gap-5">
        <i className={`fas ${icon} text-xl lg:text-2xl text-morocco-gold`}></i>
        <p className="font-bold text-sm lg:text-lg">{label}</p>
     </div>
     <span className="text-xl lg:text-3xl font-black tracking-tighter">{(val || 0).toLocaleString()}</span>
  </div>
);

export default SettingsModule;
