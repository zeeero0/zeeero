import React from 'react';
import { AppView, User } from '../types';

interface SidebarProps {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
  onLogout: () => void;
  isAdmin: boolean;
  currentUser?: User;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange, onLogout, isAdmin, isDarkMode, onToggleTheme, isOpen, onClose }) => {
  const menu = [
    { id: AppView.DASHBOARD, icon: 'fa-house', label: 'الرئيسية' },
    { id: AppView.EARN, icon: 'fa-gem', label: 'ربح الجواهر' },
    { id: AppView.PROMOTE, icon: 'fa-rocket', label: 'ترويج حسابي' },
    { id: AppView.WALLET, icon: 'fa-wallet', label: 'المحفظة' },
    { id: AppView.PROFILE, icon: 'fa-user-gear', label: 'الملف الشخصي' },
  ];

  return (
    <aside className={`fixed lg:sticky top-0 right-0 h-screen w-64 md:w-72 flex-shrink-0 flex flex-col bg-white dark:bg-[#020817] border-l border-slate-200 dark:border-white/5 shadow-xl z-50 transition-all duration-300 ${
      isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
    } font-['Tajawal']`}>
      
      {/* Header Section - تحسين الحجم واللوجو */}
      <div className="p-6 flex flex-col items-center border-b border-slate-100 dark:border-white/5 relative">
        <button 
          onClick={onClose}
          className="lg:hidden absolute top-4 left-4 w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-white/5 rounded-lg text-slate-500"
        >
          <i className="fas fa-times text-sm"></i>
        </button>
        
        <div className="relative group mb-4">
          <div className="relative w-16 h-16 lg:w-20 lg:h-20 flex items-center justify-center">
            <div className="absolute inset-0 bg-red-600/20 rounded-full blur-lg group-hover:bg-red-600/30 transition-all animate-pulse"></div>
            <div className="relative w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-tr from-red-600 to-rose-500 rounded-full flex items-center justify-center text-white text-xl lg:text-3xl shadow-lg border-2 border-white/20">
              <i className="fas fa-crown relative z-10"></i>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 lg:w-6 lg:h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-[8px] border-2 border-white dark:border-[#020817] z-20">
              <i className="fas fa-check"></i>
            </div>
          </div>
        </div>
        <h2 className="text-lg lg:text-xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase">Nokhba <span className="text-red-600">Hub</span></h2>
        <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1 opacity-70">نخبة التكافل الرقمي 🇲🇦</p>
      </div>

      {/* Navigation Links - جعلها أكثر رشاقة */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menu.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-200 group relative ${
              activeView === item.id 
              ? 'bg-red-600 text-white shadow-lg shadow-red-600/20 translate-x-1' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <i className={`fas ${item.icon} w-5 text-center text-base transition-transform group-hover:scale-110 ${activeView === item.id ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`}></i>
            <span className="tracking-tight">{item.label}</span>
          </button>
        ))}

        {isAdmin && (
          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-white/5">
            <button
              onClick={() => onViewChange(AppView.ADMIN)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-200 border ${
                activeView === AppView.ADMIN 
                ? 'bg-slate-900 dark:bg-white dark:text-black border-transparent shadow-md' 
                : 'text-red-600 bg-red-50 dark:bg-red-950/20 border-red-500/10 hover:bg-red-100'
              }`}
            >
              <i className="fas fa-fingerprint w-5 text-center text-base"></i>
              <span>لوحة الإدارة</span>
            </button>
          </div>
        )}
      </nav>

      {/* Footer Controls - تصغير الحجم النهائي */}
      <div className="p-4 bg-slate-50 dark:bg-white/5 m-4 rounded-2xl border dark:border-white/5 space-y-2">
        <button 
          onClick={onToggleTheme}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-white dark:bg-slate-800 rounded-xl text-slate-700 dark:text-white font-bold text-[10px] shadow-sm hover:scale-[1.02] transition-all border border-slate-100 dark:border-white/10"
        >
          <span className="opacity-80">{isDarkMode ? 'الوضع النهاري' : 'الوضع الليلي'}</span>
          <i className={`fas ${isDarkMode ? 'fa-sun text-yellow-500' : 'fa-moon text-blue-500'}`}></i>
        </button>
        
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-white dark:bg-red-950/10 rounded-xl text-red-600 font-bold text-[10px] shadow-sm hover:scale-[1.02] transition-all border border-slate-100 dark:border-red-500/20"
        >
          <span className="opacity-80">تسجيل الخروج</span>
          <i className="fas fa-right-from-bracket"></i>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;