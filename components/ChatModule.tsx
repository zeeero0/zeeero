
import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import { chatWithGrounding } from '../services/geminiService';

const ChatModule: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const { text, urls } = await chatWithGrounding(input);
      const modelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text,
        groundingUrls: urls,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, modelMsg]);
    } catch (error) {
      console.error(error);
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "عذراً، حدث خطأ في الاتصال. يرجى التحقق من الإنترنت.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-160px)] flex flex-col animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="flex flex-col gap-2 mb-8 text-center">
        <h2 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">مساعد النمو الذكي 🤖</h2>
        <p className="text-slate-500 font-medium italic">اسأل عن استراتيجيات التصدر، ترندات المغرب، أو كيفية كسب الجواهر.</p>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-6 pb-10 scroll-smooth pr-4 custom-scrollbar"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-20 text-center space-y-4">
            <i className="fas fa-brain text-8xl text-morocco-red"></i>
            <p className="text-xl font-bold italic">Aura AI مستعدة للإجابة على تساؤلاتك.</p>
          </div>
        )}
        
        {messages.map((msg) => (
          <div 
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`
              max-w-[85%] rounded-3xl p-6 shadow-sm
              ${msg.role === 'user' 
                ? 'bg-morocco-red text-white rounded-tr-none' 
                : 'bg-white dark:bg-white/5 text-slate-800 dark:text-slate-200 rounded-tl-none border-r-4 border-morocco-green'}
            `}>
              <p className="whitespace-pre-wrap leading-loose font-medium">{msg.text}</p>
              
              {msg.groundingUrls && msg.groundingUrls.length > 0 && (
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/10">
                  <span className="text-[10px] uppercase tracking-widest text-morocco-green font-black mb-3 block">المصادر الموثقة من Google Search:</span>
                  <div className="flex flex-wrap gap-2">
                    {msg.groundingUrls.map((url, i) => (
                      <a 
                        key={i} 
                        href={url.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[10px] bg-slate-50 dark:bg-white/5 px-3 py-1.5 rounded-xl hover:bg-morocco-red hover:text-white transition-all flex items-center gap-2 border border-slate-100 dark:border-white/5"
                      >
                        <i className="fas fa-external-link-alt text-[8px]"></i>
                        {url.title || 'رابط خارجي'}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-white/5 p-6 rounded-3xl rounded-tl-none flex gap-2 border border-slate-100 dark:border-white/5 shadow-sm">
              <div className="w-2 h-2 bg-morocco-green rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-morocco-green rounded-full animate-bounce delay-75"></div>
              <div className="w-2 h-2 bg-morocco-green rounded-full animate-bounce delay-150"></div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/5 p-4 rounded-[2.5rem] shadow-2xl">
        <div className="flex gap-4">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="اكتب استفسارك هنا..."
            className="flex-1 bg-transparent px-6 py-4 focus:outline-none transition-all font-bold text-slate-800 dark:text-white"
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="w-14 h-14 bg-morocco-red text-white rounded-2xl hover:scale-105 disabled:opacity-30 disabled:scale-100 transition-all shadow-lg shadow-red-500/20 flex items-center justify-center"
          >
            <i className="fas fa-paper-plane -rotate-45"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatModule;
