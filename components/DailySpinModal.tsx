
import React, { useState, useEffect } from 'react';
import { User } from '../types';

interface DailySpinProps {
  user: User;
  onWin: (amount: number) => void;
  onClose: () => void;
}

const DailySpinModal: React.FC<DailySpinProps> = ({ user, onWin, onClose }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<number | null>(null);

  // تحديث الجوائز لتكون بين 0 و 500 كما طلب المستخدم
  const rewards = [20, 50, 100, 200, 50, 500, 150, 300];
  const segmentAngle = 360 / rewards.length;

  const handleSpin = () => {
    if (isSpinning) return;

    setIsSpinning(true);
    const spins = 5 + Math.floor(Math.random() * 5);
    const extraAngle = Math.floor(Math.random() * 360);
    const totalRotation = spins * 360 + extraAngle;
    
    setRotation(totalRotation);

    setTimeout(() => {
      setIsSpinning(false);
      const finalAngle = extraAngle % 360;
      const index = Math.floor(((360 - finalAngle + (segmentAngle/2)) % 360) / segmentAngle);
      const wonAmount = rewards[index];
      setResult(wonAmount);
      
      setTimeout(() => {
        onWin(wonAmount);
      }, 1500);
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-500">
      <div className="relative w-full max-w-lg bg-[#0a0a0a] rounded-[3.5rem] border border-white/10 p-10 shadow-2xl overflow-hidden text-center">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-red-600/20 blur-[100px] rounded-full"></div>
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-yellow-500/10 blur-[100px] rounded-full"></div>

        <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">هدية اليوم الموثقة 🎁</h2>
        <p className="text-gray-500 text-xs font-bold mb-10 uppercase tracking-widest">دور العجلة واربح جواهر مجانية 🇲🇦</p>

        <div className="relative mx-auto w-72 h-72 mb-12">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 w-8 h-10 bg-white clip-path-triangle shadow-xl">
             <div className="w-full h-full bg-red-600 rounded-b-full"></div>
          </div>

          <div 
            className="w-full h-full rounded-full border-8 border-white/10 relative transition-transform duration-[4000ms] cubic-bezier(0.15, 0, 0.15, 1) overflow-hidden shadow-[0_0_50px_rgba(255,0,0,0.1)]"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            {rewards.map((reward, i) => (
              <div 
                key={i}
                className="absolute top-0 left-1/2 w-1/2 h-full origin-left flex items-center justify-end pr-6"
                style={{ 
                  transform: `rotate(${i * segmentAngle}deg)`,
                  backgroundColor: i % 2 === 0 ? '#111' : '#050505'
                }}
              >
                <div className="flex flex-col items-center -rotate-90 translate-x-4">
                  <span className={`font-black text-lg ${reward >= 500 ? 'text-yellow-500 animate-pulse' : 'text-white'}`}>{reward}</span>
                  <span className="text-[8px] text-gray-600 font-bold uppercase">GEM</span>
                </div>
              </div>
            ))}
            {rewards.map((_, i) => (
              <div 
                key={`line-${i}`}
                className="absolute top-0 left-1/2 w-0.5 h-1/2 bg-white/5 origin-bottom"
                style={{ transform: `rotate(${i * segmentAngle}deg)` }}
              ></div>
            ))}
          </div>

          <button 
            onClick={handleSpin}
            disabled={isSpinning || result !== null}
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full z-30 font-black text-xs uppercase shadow-2xl transition-all border-4 border-[#0a0a0a] ${isSpinning ? 'bg-gray-800 text-gray-500' : result ? 'bg-green-600 text-white' : 'bg-red-600 text-white hover:scale-110 active:scale-95'}`}
          >
            {isSpinning ? 'جاري...' : result ? 'مبروك!' : 'إبدأ'}
          </button>
        </div>

        {result ? (
          <div className="animate-in zoom-in duration-500">
            <p className="text-4xl font-black text-yellow-500 mb-2">+{result} 💎</p>
            <p className="text-gray-400 font-bold text-sm">تمت إضافة الجواهر إلى محفظتك بنجاح.</p>
          </div>
        ) : (
          <p className="text-gray-500 font-medium italic">حظاً موفقاً، قد تربح حتى 500 جوهرة!</p>
        )}

        {result && (
          <button 
            onClick={onClose}
            className="mt-8 px-10 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-white font-black text-xs uppercase tracking-widest transition-all"
          >
            استلام وإغلاق
          </button>
        )}
      </div>

      <style>{`
        .clip-path-triangle {
          clip-path: polygon(50% 100%, 0 0, 100% 0);
        }
        .cubic-bezier {
            transition-timing-function: cubic-bezier(0.15, 0, 0.15, 1);
        }
      `}</style>
    </div>
  );
};

export default DailySpinModal;
