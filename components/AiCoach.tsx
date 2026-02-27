
import React, { useState } from 'react';
import { getSocialAdvice } from '../services/geminiService';

const AiCoach: React.FC = () => {
  const [platform, setPlatform] = useState('انستقرام');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [advice, setAdvice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleConsult = async () => {
    if (!username || !bio) return;
    setIsLoading(true);
    try {
      const result = await getSocialAdvice(platform, username, bio);
      setAdvice(result || null);
    } catch (e) {
      console.error(e);
      alert("المدرب في استراحة، حاول لاحقاً.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in zoom-in duration-700">
      <div className="text-center">
        <h2 className="text-4xl font-extrabold text-white tracking-tight">عقل الشبكة 🤖</h2>
        <p className="text-gray-400 mt-3 text-lg">تحليل دقيق بذكاء اصطناعي مغربي الهوى.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="glass p-10 rounded-[2.5rem] border border-red-600/10 space-y-8 h-fit shadow-2xl bg-black">
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-black text-gray-500 uppercase mb-3 mr-2 tracking-widest">نوع الحساب</label>
              <select 
                value={platform}
                onChange={e => setPlatform(e.target.value)}
                className="w-full bg-red-950/5 border border-red-900/20 rounded-2xl px-6 py-4 outline-none font-bold text-white appearance-none focus:border-red-600 transition-colors"
              >
                <option value="YouTube">يوتيوب</option>
                <option value="Instagram">انستقرام</option>
                <option value="TikTok">تيك توك</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-gray-500 uppercase mb-3 mr-2 tracking-widest">المعرف</label>
              <input 
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="@pseudo"
                className="w-full bg-red-950/5 border border-red-900/20 rounded-2xl px-6 py-4 outline-none font-bold text-white focus:border-red-600"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-500 uppercase mb-3 mr-2 tracking-widest">وصفك الحالي</label>
              <textarea 
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={4}
                placeholder="أخبرنا عنك..."
                className="w-full bg-red-950/5 border border-red-900/20 rounded-2xl px-6 py-4 outline-none resize-none font-medium text-gray-200 focus:border-red-600"
              />
            </div>
          </div>
          <button 
            onClick={handleConsult}
            disabled={isLoading || !bio}
            className="w-full btn-moroccan py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-4 shadow-xl uppercase"
          >
            {isLoading ? <i className="fas fa-sync fa-spin"></i> : <i className="fas fa-brain"></i>}
            تحليل استراتيجي
          </button>
        </div>

        <div className="glass p-10 rounded-[2.5rem] min-h-[500px] flex flex-col border border-yellow-500/10 relative overflow-hidden bg-black">
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-red-600/5 blur-[100px] rounded-full"></div>
          <h3 className="font-black text-2xl mb-8 text-yellow-500 flex items-center gap-3">
            <i className="fas fa-scroll"></i> وثيقة النجاح
          </h3>
          {advice ? (
            <div className="prose prose-invert prose-md overflow-y-auto max-h-[600px] pr-2 custom-scrollbar text-right">
              <div className="whitespace-pre-wrap leading-loose text-gray-200 font-medium text-lg italic border-r-2 border-red-600 pr-4">
                {advice}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center opacity-30 text-center space-y-6">
              <i className="fas fa-hat-wizard text-8xl text-red-600"></i>
              <p className="text-xl font-bold max-w-xs leading-relaxed text-white">انتظر حكم الحكيم بعد إدخال بياناتك على اليمين.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiCoach;
