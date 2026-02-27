
import React, { useState, useEffect, useCallback } from 'react';
import { AppView, User } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import EarnModule from './components/EarnModule';
import PromoteModule from './components/PromoteModule';
import WalletModule from './components/WalletModule';
import SettingsModule from './components/SettingsModule';
import AuthModule from './components/AuthModule';
import AdminModule from './components/AdminModule';
import DailySpinModal from './components/DailySpinModal';
import AccountLinkingModal from './components/AccountLinkingModal';
import WelcomeScreen from './components/WelcomeScreen';
import { dbService } from './services/dbService';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<AppView>(AppView.LOGIN);
  const [isChanging, setIsChanging] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showDailySpin, setShowDailySpin] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('socialboost_theme');
    return saved ? saved === 'dark' : false;
  });

  // فحص استحقاق مكافأة النزاهة 100%
  const checkTrustRewardSpin = useCallback((user: User) => {
    if (user.role === 'admin') return;

    // تظهر العجلة فقط إذا كانت درجة الثقة 100 ولم يسبق استلام مكافأة الـ 100%
    const hasClaimed100Reward = user.lastSpinDate === 'TRUST_100_CLAIMED';
    
    if (user.trustScore === 100 && !hasClaimed100Reward) {
      const sessionKey = `spin_shown_100_${user.id}`;
      const shownThisSession = sessionStorage.getItem(sessionKey);
      
      if (!shownThisSession) {
        sessionStorage.setItem(sessionKey, 'true');
        setTimeout(() => setShowDailySpin(true), 3000);
      }
    }
  }, []);

  useEffect(() => {
    const initApp = async () => {
      const savedUserId = localStorage.getItem('socialboost_active_id');
      if (savedUserId) {
        try {
          const users = await dbService.getUsers();
          const user = users.find(u => u.id === savedUserId);
          if (user) {
            setCurrentUser(user);
            setActiveView(AppView.DASHBOARD);
            checkTrustRewardSpin(user);
          }
        } catch (e) {
          console.error("Failed to load user session", e);
        }
      }
      setIsLoading(false);
    };
    initApp();
  }, [checkTrustRewardSpin]);

  // مراقبة تغييرات درجة الثقة أثناء الجلسة لتشغيل المكافأة فور الوصول لـ 100%
  useEffect(() => {
    if (currentUser) {
      checkTrustRewardSpin(currentUser);
    }
  }, [currentUser?.trustScore, currentUser, checkTrustRewardSpin]);

  useEffect(() => {
    localStorage.setItem('socialboost_theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const handleLogin = (user: User) => {
    localStorage.setItem('socialboost_active_id', user.id);
    setCurrentUser(user);
    setActiveView(AppView.DASHBOARD);
    checkTrustRewardSpin(user);
    
    const hasLinkedAnything = (user.linkedAccounts || []).length > 0;
    if (!hasLinkedAnything && !user.linkingDismissed && user.role !== 'admin') {
      setShowWelcome(true);
    }
  };

  const handleLogout = () => {
    if (currentUser) {
      sessionStorage.removeItem(`spin_shown_100_${currentUser.id}`);
    }
    setCurrentUser(null);
    localStorage.removeItem('socialboost_active_id');
    setActiveView(AppView.LOGIN);
    setShowDailySpin(false);
    setShowWelcome(false);
  };

  const handleViewChange = (view: AppView) => {
    if (view === activeView) {
      setIsSidebarOpen(false);
      return;
    }
    setIsChanging(true);
    setIsSidebarOpen(false);
    setTimeout(() => {
      setActiveView(view);
      setIsChanging(false);
    }, 150); 
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-900 dark:text-white">
        <div className="w-16 h-16 border-4 border-morocco-red border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-black text-xl animate-pulse tracking-widest uppercase">Nokhba Hub loading...</p>
      </div>
    );
  }

  if (activeView === AppView.LOGIN || !currentUser) {
    return <AuthModule onLogin={handleLogin} />;
  }

  const hasLinkedAnything = (currentUser.linkedAccounts || []).length > 0;
  const shouldShowLinking = !hasLinkedAnything && !currentUser.linkingDismissed && currentUser.role !== 'admin';

  if (shouldShowLinking) {
    if (showWelcome) {
      return <WelcomeScreen username={currentUser.username} onContinue={() => setShowWelcome(false)} />;
    }
    return (
      <AccountLinkingModal 
        user={currentUser} 
        onComplete={(u) => setCurrentUser(u)} 
        onDismiss={async () => {
          const updatedUser = { ...currentUser, linkingDismissed: true };
          setCurrentUser(updatedUser);
          await dbService.updateUser(updatedUser);
        }} 
      />
    );
  }

  const userAvatar = currentUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username}`;

  return (
    <div className="flex flex-row min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500 w-full overflow-x-hidden relative" dir="rtl">
      <Sidebar 
        activeView={activeView} 
        onViewChange={handleViewChange} 
        onLogout={handleLogout}
        isAdmin={currentUser?.role === 'admin'}
        currentUser={currentUser}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      <main className={`flex-1 flex flex-col min-h-screen relative transition-opacity duration-200 ${isChanging ? 'opacity-0' : 'opacity-100 animate-fast-in'}`}>
        <header className="sticky top-0 z-40 h-16 lg:h-20 flex-shrink-0 flex items-center justify-between px-4 lg:px-12 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 shadow-sm transition-theme">
          <div className="flex items-center gap-3 lg:gap-5">
             <button 
               onClick={() => setIsSidebarOpen(true)}
               className="lg:hidden w-9 h-9 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-white"
             >
               <i className="fas fa-bars text-base"></i>
             </button>
             <div className="relative group">
               <div className="w-9 h-9 lg:w-12 lg:h-12 bg-gradient-to-tr from-morocco-red to-red-500 rounded-full flex items-center justify-center shadow-xl shadow-red-500/20 border-2 border-white/20 transition-transform group-hover:scale-110">
                  <i className="fas fa-crown text-white text-base lg:text-xl drop-shadow-md"></i>
               </div>
               <div className="absolute -bottom-1 -right-1 w-4 h-4 lg:w-5 lg:h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-[6px] lg:text-[8px] border-2 border-white dark:border-slate-950 shadow-lg">
                 <i className="fas fa-check"></i>
               </div>
             </div>
             <div>
                <h1 className="text-lg lg:text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic font-['Tajawal']">Nokhba <span className="text-morocco-red">Hub</span></h1>
             </div>
          </div>
          
          <div className="flex items-center gap-3 lg:gap-8">
            <button onClick={() => handleViewChange(AppView.WALLET)} className="flex items-center gap-2 lg:gap-3 bg-white dark:bg-blue-900/20 px-3 lg:px-6 py-1.5 lg:py-2 rounded-lg lg:rounded-2xl border-2 border-slate-100 dark:border-blue-800/50 shadow-sm transition-all hover:scale-105 active:scale-95 group">
              <i className="fas fa-gem text-morocco-blue text-sm lg:text-lg group-hover:rotate-12 transition-transform"></i>
              <span className="font-black text-slate-900 dark:text-blue-300 text-sm lg:text-lg">{(currentUser?.points || 0).toLocaleString()}</span>
            </button>
            <div className="flex items-center gap-2 lg:gap-5 lg:pr-8 lg:border-r-2 border-slate-100 dark:border-slate-800">
              <div className="text-right hidden md:block">
                <p className="text-base font-black text-slate-900 dark:text-white">{currentUser.username}</p>
                <p className={`text-[10px] font-black uppercase tracking-widest -mt-1 ${currentUser.trustScore <= 50 ? 'text-red-500' : 'text-emerald-500'}`}>{currentUser.trustScore}% Secure Trust</p>
              </div>
              <img src={userAvatar} className="w-9 h-9 lg:w-12 lg:h-12 rounded-lg lg:rounded-2xl object-cover border-2 border-white dark:border-slate-700 shadow-xl" alt="avatar" />
            </div>
          </div>
        </header>

        <div className="flex-1 w-full p-4 lg:p-12 transition-theme">
          <div className="max-w-[1400px] mx-auto">
            {activeView === AppView.DASHBOARD && <Dashboard user={currentUser} />}
            {activeView === AppView.EARN && <EarnModule currentUser={currentUser} onEarn={async (pts, id) => {
               // نكتفي بتحديث الحالة المحلية للمستخدم فوراً لتوفير تجربة سريعة
               // السيرفر قام بالفعل بتحديث قاعدة البيانات وإضافة العملية المالية
               const updatedUser = { ...currentUser, points: currentUser.points + pts };
               setCurrentUser(updatedUser);
            }} />}
            {activeView === AppView.PROMOTE && <PromoteModule user={currentUser} onPromote={async (pts) => {
                const updatedUser = { ...currentUser, points: currentUser.points - pts };
                setCurrentUser(updatedUser);
                await dbService.updateUser(updatedUser);
              }} />}
            {activeView === AppView.WALLET && <WalletModule user={currentUser} onPurchase={async (pts) => {
              const updatedUser = { ...currentUser, points: currentUser.points + pts };
              setCurrentUser(updatedUser);
              await dbService.updateUser(updatedUser);
            }} />}
            {activeView === AppView.PROFILE && <SettingsModule user={currentUser} onUpdate={setCurrentUser} />}
            {activeView === AppView.ADMIN && currentUser?.role === 'admin' && <AdminModule />}
          </div>
        </div>
      </main>

      {showDailySpin && <DailySpinModal user={currentUser} onWin={async (amount) => {
        // عند الفوز، نقوم بتحديث النقاط وتصفير درجة الثقة إلى 90% كما طلب المستخدم
        const updatedUser = { 
          ...currentUser, 
          points: (currentUser.points || 0) + amount, 
          trustScore: 90, // العودة إلى 90% بعد استلام المكافأة
          favorableRatingCycle: 0,
          lastSpinDate: 'TRUST_100_CLAIMED' // علامة لمنع تكرار المكافأة فوراً
        };
        setCurrentUser(updatedUser);
        await dbService.updateUser(updatedUser);
        await dbService.addTransaction(currentUser.id, 'trust_reward', amount, `مكافأة النزاهة 100%`);
        
        setTimeout(() => {
          setShowDailySpin(false);
          alert(`🎉 مبروك! حصلت على ${amount} جوهرة كمكافأة لنزاهتك العالية. تم إعادة ضبط درجة ثقتك إلى 90% للبدء من جديد.`);
        }, 1500);
      }} onClose={() => setShowDailySpin(false)} />}
    </div>
  );
};

export default App;
