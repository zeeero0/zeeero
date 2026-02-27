
import React, { useState, useEffect, useMemo } from 'react';
import { dbService } from '../services/dbService';
import { User, Campaign, Transaction, AuditLog } from '../types';

type AdminTab = 'command_center' | 'warriors' | 'treasury' | 'security_radar';

const AdminModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('command_center');
  const [users, setUsers] = useState<User[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pointsDelta, setPointsDelta] = useState<Record<string, number>>({});

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      const [u, c, t, a] = await Promise.all([
        dbService.getUsers(),
        dbService.getCampaigns(),
        dbService.getTransactions(),
        dbService.getAuditLogs()
      ]);
      setUsers(u || []);
      setCampaigns(c || []);
      setTransactions(t || []);
      setAuditLogs(a || []);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const countries: Record<string, { name: string, flag: string }> = {
    'MA': { name: 'المغرب', flag: '🇲🇦' },
    'FR': { name: 'فرنسا', flag: '🇫🇷' },
    'SA': { name: 'السعودية', flag: '🇸🇦' },
    'AE': { name: 'الإمارات', flag: '🇦🇪' },
    'US': { name: 'أمريكا', flag: '🇺🇸' },
    'ES': { name: 'إسبانيا', flag: '🇪🇸' }
  };

  const getUserCountry = (u: User) => {
    return countries[u.countryCode || 'MA'] || { name: 'دولي', flag: '🌐' };
  };

  const suspiciousUsers = useMemo(() => users.filter(u => u.trustScore <= 60 && !u.isSuspended), [users]);
  const pendingPurchases = useMemo(() => transactions.filter(t => t.status === 'pending' && t.type === 'purchase'), [transactions]);

  const handleProcessPurchase = async (id: string, action: 'approve' | 'reject') => {
    try {
      const res = await dbService.processPurchaseRequest(id, action);
      alert(res.message || "تمت العملية بنجاح ✅");
      await refreshData();
    } catch (e: any) { 
      alert("خطأ: " + e.message); 
    }
  };

  const handleManualPoints = async (user: User, delta: number) => {
    const updated = { ...user, points: user.points + delta };
    await dbService.updateUser(updated);
    await dbService.addTransaction(user.id, delta > 0 ? 'earn' : 'spend', Math.abs(delta), `تعديل إداري للرصيد`, 'completed', user.username);
    await refreshData();
    alert(`تم تعديل رصيد ${user.username} بنجاح.`);
  };

  const handleBan = async (user: User) => {
    if (!window.confirm(`هل أنت متأكد من حظر المستخدم ${user.username} نهائياً؟`)) return;
    const updated = { ...user, isSuspended: !user.isSuspended };
    await dbService.updateUser(updated);
    await refreshData();
  };

  const formatDate = (date: any) => new Date(date).toLocaleString('ar-MA', {
    hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit'
  });

  return (
    <div className="max-w-[1600px] mx-auto space-y-12 animate-in fade-in duration-700 pb-20 text-right" dir="rtl">
      
      {/* Header Dashboard */}
      <div className="bg-[#020617] p-12 rounded-[4rem] border-2 border-white/5 shadow-[0_0_50px_rgba(225,29,72,0.1)] flex flex-col lg:flex-row items-center justify-between gap-10">
        <div className="flex items-center gap-10">
           <div className="w-24 h-24 bg-morocco-red rounded-3xl flex items-center justify-center text-5xl text-white shadow-2xl shadow-red-500/20 rotate-3 border-2 border-white/10">
              <i className="fas fa-crown"></i>
           </div>
           <div>
              <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase">مركز التحكم السلطوي</h2>
              <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-xs mt-3">نظام الإدارة الموحد - SocialBoost Core 🛡️</p>
           </div>
        </div>

        <div className="flex bg-white/5 p-3 rounded-[3rem] border border-white/10 backdrop-blur-xl">
           {(['command_center', 'warriors', 'treasury', 'security_radar'] as AdminTab[]).map(tab => (
             <button
               key={tab} onClick={() => setActiveTab(tab)}
               className={`px-10 py-5 rounded-[2.5rem] text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-morocco-red text-white shadow-2xl' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
             >
               {tab === 'command_center' ? 'الإحصائيات' : tab === 'warriors' ? 'إدارة الجنود' : tab === 'treasury' ? `الخزينة (${pendingPurchases.length})` : `التهديدات (${suspiciousUsers.length})`}
             </button>
           ))}
        </div>
      </div>

      {activeTab === 'command_center' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
           <StatCard label="إجمالي المستخدمين" val={users.length} icon="fa-users" color="text-blue-500" />
           <StatCard label="الجواهر المتداولة" val={users.reduce((a,b)=>a+(Number(b.points)||0), 0)} icon="fa-gem" color="text-morocco-gold" />
           <StatCard label="الحملات النشطة" val={campaigns.filter(c=>c.active).length} icon="fa-rocket" color="text-morocco-red" />
           <StatCard label="معدل النزاهة العام" val="94.2%" icon="fa-shield-halved" color="text-emerald-500" />
        </div>
      )}

      {activeTab === 'treasury' && (
        <div className="bg-[#020617] p-12 rounded-[4rem] border-2 border-white/5 shadow-2xl">
           <h3 className="text-3xl font-black text-white mb-10 flex items-center gap-6 italic">
             <i className="fas fa-vault text-morocco-gold"></i> طلبات الشحن بانتظار التفعيل
           </h3>
           <div className="grid grid-cols-1 gap-6">
              {pendingPurchases.length === 0 ? (
                <div className="py-24 text-center opacity-20 font-black text-3xl">لا توجد عمليات معلقة. الخزينة مستقرة.</div>
              ) : (
                pendingPurchases.map(tx => (
                  <div key={tx.id} className="p-10 bg-white/5 border border-white/10 rounded-[3.5rem] flex flex-col lg:flex-row justify-between items-center gap-10 hover:border-morocco-gold/40 transition-all group">
                     <div className="flex items-center gap-8">
                        <div className="w-20 h-20 bg-morocco-gold text-black rounded-3xl flex items-center justify-center text-3xl shadow-2xl">
                           <i className="fas fa-money-bill-transfer"></i>
                        </div>
                        <div>
                           <p className="text-3xl font-black text-white">@{tx.username}</p>
                           <p className="text-slate-400 font-bold mt-1">{tx.description}</p>
                           <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-2">{formatDate(tx.date)}</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-10">
                        <div className="text-center px-10 border-l border-white/10">
                           <p className="text-5xl font-black text-morocco-gold">+{tx.amount.toLocaleString()}</p>
                           <p className="text-[10px] text-slate-500 font-black uppercase mt-1">جواهر مطلوبة</p>
                        </div>
                        <div className="flex gap-4">
                           <button onClick={() => handleProcessPurchase(tx.id, 'approve')} className="px-10 py-5 bg-emerald-600 text-white rounded-3xl font-black text-sm shadow-xl hover:scale-105 transition-all">
                              شحن فوري (One-Click)
                           </button>
                           <button onClick={() => handleProcessPurchase(tx.id, 'reject')} className="px-10 py-5 bg-red-600 text-white rounded-3xl font-black text-sm hover:scale-105 transition-all">
                              رفض
                           </button>
                        </div>
                     </div>
                  </div>
                ))
              )}
           </div>
        </div>
      )}

      {activeTab === 'warriors' && (
        <div className="bg-[#020617] p-12 rounded-[4rem] border-2 border-white/5 shadow-2xl">
           <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
              <h3 className="text-3xl font-black text-white italic">
                <i className="fas fa-user-gear text-morocco-red ml-4"></i> إدارة الجنود الرقميين
              </h3>
              <input 
                placeholder="ابحث عن جندي..." 
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="w-full md:w-96 bg-white/5 border-2 border-white/10 rounded-[2rem] py-5 px-8 outline-none focus:border-morocco-red transition-all text-white font-bold"
              />
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {users.filter(u => u.username.toLowerCase().includes(searchTerm.toLowerCase())).map(u => {
                const country = getUserCountry(u);
                return (
                  <div key={u.id} className="p-10 bg-white/5 border border-white/10 rounded-[4rem] group hover:border-white/20 transition-all relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-morocco-red to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                     
                     {/* Border Control Badge */}
                     <div className="absolute top-8 left-8 flex items-center gap-2 bg-slate-900/50 px-4 py-2 rounded-xl border border-white/5">
                        <span className="text-xl">{country.flag}</span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{country.name}</span>
                     </div>

                     <div className="flex items-center justify-between mb-8 pt-6">
                        <div className="flex items-center gap-6">
                           <img src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`} className="w-20 h-20 rounded-3xl border-2 border-white/10 shadow-2xl" />
                           <div>
                              <div className="flex items-center gap-3">
                                 <p className="text-2xl font-black text-white">@{u.username}</p>
                              </div>
                              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">IP: {u.ipAddress || 'Hidden'}</p>
                           </div>
                        </div>
                        <div className="text-left">
                           <p className="text-3xl font-black text-morocco-blue">{u.points.toLocaleString()} 💎</p>
                           <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">الرصيد الحالي</p>
                        </div>
                     </div>

                     <div className="space-y-6">
                        <div className="flex gap-4">
                           <input 
                             type="number" 
                             placeholder="المبلغ..." 
                             className="flex-1 bg-white/5 border-2 border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-morocco-blue"
                             onChange={(e) => setPointsDelta({...pointsDelta, [u.id]: parseInt(e.target.value)})}
                           />
                           <button onClick={() => handleManualPoints(u, pointsDelta[u.id] || 0)} className="px-8 py-4 bg-morocco-blue text-white rounded-2xl font-black text-xs hover:scale-105 transition-all">
                              تعديل الرصيد
                           </button>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                           <div className="flex items-center gap-4">
                              <span className="text-[10px] font-black text-slate-500 uppercase">نزاهة الجندي:</span>
                              <span className={`text-xl font-black ${u.trustScore <= 60 ? 'text-red-500' : 'text-emerald-500'}`}>{u.trustScore}%</span>
                           </div>
                           <button onClick={() => handleBan(u)} className={`px-6 py-2 rounded-xl font-black text-[10px] uppercase border ${u.isSuspended ? 'bg-emerald-600 text-white border-emerald-500' : 'border-red-600 text-red-600 hover:bg-red-600 hover:text-white'}`}>
                              {u.isSuspended ? 'فك الحظر' : 'حظر نهائي'}
                           </button>
                        </div>
                     </div>
                  </div>
                );
              })}
           </div>
        </div>
      )}

      {activeTab === 'security_radar' && (
        <div className="bg-[#020617] p-12 rounded-[4rem] border-2 border-red-600/20 shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/5 blur-[120px] rounded-full animate-pulse"></div>
           <h3 className="text-3xl font-black text-white mb-10 flex items-center gap-6">
             <i className="fas fa-radiation text-red-600 animate-spin-slow"></i> رادار التهديدات والمشبوهين
           </h3>
           
           <div className="grid grid-cols-1 gap-6">
              {suspiciousUsers.length === 0 ? (
                <div className="py-24 text-center opacity-30 font-black text-2xl italic">المجتمع آمن حالياً. لا يوجد مشبوهون تحت الرادار.</div>
              ) : (
                suspiciousUsers.map(u => (
                  <div key={u.id} className="p-8 bg-red-600/5 border border-red-600/20 rounded-[3rem] flex justify-between items-center group hover:bg-red-600/10 transition-all">
                     <div className="flex items-center gap-8">
                        <div className="w-16 h-16 bg-red-600 text-white rounded-2xl flex items-center justify-center text-3xl shadow-2xl">
                           <i className="fas fa-user-ninja"></i>
                        </div>
                        <div>
                           <p className="text-2xl font-black text-white">@{u.username}</p>
                           <p className="text-sm font-bold text-red-500 mt-1">درجة الثقة: {u.trustScore}% (خطير جداً)</p>
                        </div>
                     </div>
                     <button onClick={() => handleBan(u)} className="px-12 py-5 bg-red-600 text-white rounded-3xl font-black text-sm shadow-xl shadow-red-600/20 hover:scale-110 active:scale-95 transition-all">
                        تصفية الحساب (Execute Ban)
                     </button>
                  </div>
                ))
              )}
           </div>
        </div>
      )}
    </div>
  );
};

const StatCard: React.FC<{ label: string, val: any, icon: string, color: string }> = ({ label, val, icon, color }) => (
  <div className="bg-[#020617] p-10 rounded-[3.5rem] border-2 border-white/5 shadow-2xl flex flex-col gap-6 group hover:scale-105 transition-all">
     <div className={`w-16 h-16 bg-white/5 ${color} rounded-2xl flex items-center justify-center text-3xl shadow-inner group-hover:rotate-12 transition-transform`}>
        <i className={`fas ${icon}`}></i>
     </div>
     <div className="text-right">
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">{label}</p>
        <p className={`text-4xl font-black tracking-tighter text-white`}>{val.toLocaleString()}</p>
     </div>
  </div>
);

export default AdminModule;
