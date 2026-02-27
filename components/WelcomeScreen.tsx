import React, { useEffect, useState } from 'react';

interface Props {
  username: string;
  onContinue: () => void;
}

const WelcomeScreen: React.FC<Props> = ({ username, onContinue }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

  return (
    <div className={`fixed inset-0 z-[400] bg-[#020617] flex items-center justify-center p-4 md:p-6 transition-opacity duration-1000 ${visible ? 'opacity-100' : 'opacity-0'} font-['Tajawal']`}>
      
      {/* Background Decor - إضاءة خلفية هادئة */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute top-1/4 left-1/4 w-64 md:w-96 h-64 md:h-96 bg-red-600/10 blur-[100px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 md:w-96 h-64 md:h-96 bg-emerald-500/5 blur-[100px] rounded-full animate-pulse delay-700"></div>
      </div>

      <div className="max-w-xl md:max-w-2xl w-full text-center space-y-8 relative z-10 animate-in zoom-in-95 duration-700">
        
        {/* Logo Section - تم تصغيره ليكون متناسقاً */}
        <div className="relative inline-block group">
          <div className="absolute inset-0 bg-red-600/20 rounded-full blur-2xl animate-pulse"></div>
          
          <div className="relative w-24 h-24 md:w-32 md:h-32 bg-gradient-to-tr from-red-600 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl md:text-5xl shadow-xl border-4 border-white/10 transition-transform group-hover:scale-105 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1/2 bg-white/10 -skew-y-12"></div>
            <i className="fas fa-crown text-white drop-shadow-lg"></i>
          </div>
          
          {/* Verified Badge */}
          <div className="absolute -bottom-1 -right-1 w-10 h-10 md:w-12 md:h-12 bg-blue-600 rounded-full flex items-center justify-center text-white text-lg md:text-xl shadow-2xl border-4 border-[#020617] animate-bounce">
            <i className="fas fa-check"></i>
          </div>
        </div>

        {/* Text Section */}
        <div className="space-y-3">
          <h1 className="text-3xl md:text-5xl font-black text-white italic tracking-tighter">
            أهلاً بك <span className="text-red-500 underline decoration-white/20 underline-offset-8">{username}</span>
          </h1>
          <p className="text-lg md:text-xl font-bold text-slate-400 max-w-md mx-auto leading-relaxed">
            مرحباً بك في <span className="text-white italic">Nokhba Hub</span>
            <br />
            <span className="text-sm font-medium opacity-60">مجتمع النخبة الرقمي المتكامل</span>
          </p>
        </div>

        {/* Info Box - تم تحسين الحواف والخط */}
        <div className="p-5 md:p-6 bg-white/[0.03] backdrop-blur-xl border border-white/5 rounded-[2rem] text-right">
          <p className="text-slate-300 font-medium text-sm md:text-base leading-loose">
             <i className="fas fa-info-circle text-red-500 ml-2"></i>
             نحن لسنا مجرد تطبيق، نحن عائلة. لضمان جودة مجتمعنا، نرجو منك ربط حساباتك الرسمية قبل البدء في المقر المركزي.
          </p>
        </div>

        {/* Action Button - حجم متناسق مع الحاسوب */}
        <button 
          onClick={onContinue}
          className="px-10 py-4 md:px-12 md:py-5 bg-red-600 text-white rounded-2xl font-black text-lg md:text-xl shadow-lg shadow-red-900/20 hover:bg-red-500 active:scale-95 transition-all group border border-white/10"
        >
          دخول للمقر المركزي 
          <i className="fas fa-arrow-left mr-3 group-hover:-translate-x-1 transition-transform"></i>
        </button>
      </div>
    </div>
  );
};

export default WelcomeScreen;