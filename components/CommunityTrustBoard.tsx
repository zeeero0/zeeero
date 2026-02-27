
import React, { useState, useEffect } from 'react';
import { User, AuditLog } from '../types';
import { dbService } from '../services/dbService';

interface AlertEvent {
  id: string;
  text: string;
  type: 'reward' | 'warning';
  timestamp: Date;
}

const CommunityTrustBoard: React.FC = () => {
  const [eliteUsers, setEliteUsers] = useState<User[]>([]);
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);

  const fetchLiveData = async () => {
    try {
      // 1. جلب النخبة الحقيقيين
      const allUsers = await dbService.getUsers();
      const top = allUsers
        .filter(u => u.trustScore >= 90)
        .sort((a, b) => b.trustScore - a.trustScore)
        .slice(0, 5);
      setEliteUsers(top);

      // 2. جلب سجلات التدقيق الحقيقية وتحويلها لتنبيهات
      const logs = await dbService.getAuditLogs();
      const mappedAlerts: AlertEvent[] = logs
        .filter(log => [
          'TRUST_UP', 'TRUST_DOWN', 'REWARD_100', 'WARNING_LOW', 
          'TASK_COMPLETE', 'PURCHASE_APPROVED', 'ACCOUNT_CREATE'
        ].includes(log.action))
        .map(log => ({
          id: log.id,
          text: log.details,
          // Fix: Use 'as const' to ensure the string literals match the 'reward' | 'warning' union type
          type: (log.action.includes('DOWN') || log.action.includes('WARNING') || log.action.includes('REJECTED')) 
                ? 'warning' as const : 'reward' as const,
          timestamp: new Date(log.timestamp)
        }))
        .slice(0, 6);

      setAlerts(mappedAlerts);
    } catch (e) {
      console.error("Failed to fetch live board data", e);
    }
  };

  useEffect(() => {
    fetchLiveData();
    // تحديث البيانات كل 10 ثوانٍ ليكون "لايف"
    const interval = setInterval(fetchLiveData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mt-12 animate-in fade-in slide-in-from-bottom-10 duration-1000 transition-theme">
      
      {/* Hall of Fame - Real Elite Users */}
      <div className="lg:col-span-5 bg-white dark:bg-[#0f172a] rounded-[4rem] border-2 border-slate-100 dark:border-white/10 shadow-2xl p-10 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full"></div>
        <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-4">
              <i className="fas fa-crown text-morocco-gold"></i> نخبة المجتمع
            </h3>
            <span className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-4 py-1.5 rounded-full uppercase tracking-widest animate-pulse">Live Stats</span>
        </div>
        
        <div className="space-y-6">
          {eliteUsers.length === 0 ? (
            <div className="py-10 text-center opacity-20 italic font-bold">جاري تحديث قائمة الشرف...</div>
          ) : (
            eliteUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between p-5 bg-slate-50 dark:bg-white/5 rounded-3xl border-2 border-transparent hover:border-emerald-500/20 transition-all group">
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <img src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`} className="w-12 h-12 rounded-xl border-2 border-white dark:border-slate-800 shadow-lg group-hover:scale-110 transition-transform" />
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 text-white text-[10px] rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                      <i className="fas fa-check"></i>
                    </div>
                  </div>
                  <div>
                    <p className="font-black text-slate-900 dark:text-white text-sm">@{u.username}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">موثق</p>
                  </div>
                </div>
                <div className="text-left">
                  <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{u.trustScore}%</span>
                  <div className="w-12 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mt-1">
                    <div className="h-full bg-emerald-500" style={{width: `${u.trustScore}%`}}></div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Live Integrity Radar - Real System Events */}
      <div className="lg:col-span-7 bg-white dark:bg-[#0f172a] rounded-[4rem] border-2 border-slate-100 dark:border-white/10 shadow-2xl p-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-32 h-32 bg-morocco-red/5 blur-3xl rounded-full"></div>
        <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-4">
              <i className="fas fa-satellite-dish text-morocco-red animate-pulse"></i> رادار النزاهة الفوري
            </h3>
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">نشاط السيرفر الحقيقي</span>
            </div>
        </div>

        <div className="space-y-4 min-h-[400px]">
          {alerts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20 py-20 italic font-bold">
               <i className="fas fa-radar text-6xl mb-4"></i>
               <p>في انتظار تسجيل أحداث جديدة من المجتمع...</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div key={alert.id} className={`p-6 rounded-[2.5rem] border-2 flex items-center gap-6 animate-in slide-in-from-right-12 duration-700 transition-all ${
                alert.type === 'reward' 
                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500/10 text-emerald-800 dark:text-emerald-400' 
                : 'bg-red-50 dark:bg-red-950/20 border-red-500/10 text-red-800 dark:text-red-400'
              }`}>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-xl border-2 border-white/20 shrink-0 ${
                  alert.type === 'reward' ? 'bg-emerald-600 text-white' : 'bg-morocco-red text-white'
                }`}>
                  <i className={`fas ${alert.type === 'reward' ? 'fa-bolt' : 'fa-triangle-exclamation'}`}></i>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black leading-relaxed">
                    {alert.text}
                  </p>
                  <p className="text-[9px] font-bold opacity-40 mt-1 uppercase tracking-widest">
                      {alert.timestamp.toLocaleTimeString('ar-MA')} - عبر نظام التدقيق
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-8 p-6 bg-slate-950 dark:bg-white text-white dark:text-slate-900 rounded-[2.5rem] text-center">
          <p className="text-xs font-black uppercase tracking-[0.3em] italic">
            "نظام المراقبة المركزية - SocialBoost Security"
          </p>
        </div>
      </div>
    </div>
  );
};

export default CommunityTrustBoard;
