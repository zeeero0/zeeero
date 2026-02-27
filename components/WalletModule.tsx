
import React, { useState, useEffect } from 'react';
import { User, Transaction } from '../types';
import { dbService } from '../services/dbService';

interface WalletProps {
  user: User;
  onPurchase: (points: number) => void;
}

interface Package {
  id: string;
  points: number;
  price: number;
  label: string;
  gumroadUrl: string;
  popular?: boolean;
}

const WalletModule: React.FC<WalletProps> = ({ user, onPurchase }) => {
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [stepStatus, setStepStatus] = useState({ paid: false, notified: false });
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const fetchTransactions = async () => {
    try {
      const all = await dbService.getTransactions(user.id);
      setTransactions(all || []);
    } catch (e) {
      console.error("Error fetching transactions", e);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [user.id]);

  const packages: Package[] = [
    { 
      id: 'pkg_1', 
      points: 1000, 
      price: 50, 
      label: 'باقة المبتدئ (Basic)', 
      gumroadUrl: 'https://mohaumi.gumroad.com/l/socialboostproduct' 
    },
    { 
      id: 'pkg_2', 
      points: 5000, 
      price: 200, 
      label: 'باقة النمو (Growth)', 
      gumroadUrl: 'https://mohaumi.gumroad.com/l/socialboostproduct2', 
      popular: true 
    },
    { 
      id: 'pkg_3', 
      points: 15000, 
      price: 500, 
      label: 'باقة المحترفين (Pro)', 
      gumroadUrl: 'https://mohaumi.gumroad.com/l/socialboostproduct3' 
    },
    { 
      id: 'pkg_4', 
      points: 40000, 
      price: 1000, 
      label: 'الباقة الملكية (Royal)', 
      gumroadUrl: 'https://mohaumi.gumroad.com/l/socialboostproduct4' 
    },
  ];

  const handlePackageSelect = (pkg: Package) => {
    setSelectedPackage(pkg);
    setStepStatus({ paid: false, notified: false });
    setShowConfirmation(true);
  };

  const handlePaymentClick = () => {
    if (!selectedPackage) return;
    window.open(selectedPackage.gumroadUrl, '_blank');
    setStepStatus(prev => ({ ...prev, paid: true }));
  };

  const handleWhatsAppVerification = async () => {
    if (!selectedPackage || isProcessing) return;
    
    setIsProcessing(true);
    try {
      // 1. تسجيل العملية في قاعدة البيانات كـ Pending
      await dbService.addTransaction(
        user.id, 
        'purchase', 
        selectedPackage.points, 
        `شراء ${selectedPackage.label} - مبلغ ${selectedPackage.price} DH`, 
        'pending',
        user.username
      );

      // 2. تحديث القائمة المحلية للمعاملات
      await fetchTransactions();

      // 3. تحضير رسالة الواتساب
      const preciseDate = new Date().toLocaleString('ar-MA', {
          year: 'numeric', month: 'long', day: 'numeric',
          hour: '2-digit', minute: '2-digit'
      });

      const msg = `👑 طلب تفعيل باقة SocialBoost\n--------------------------\n👤 المستخدم: ${user.username}\n📦 الباقة: ${selectedPackage.label}\n💰 المبلغ: ${selectedPackage.price} درهم\n📅 التاريخ: ${preciseDate}\n--------------------------\nلقد أتممت الدفع، يرجى تفعيل الجواهر في حسابي.`;
      
      const phoneNumber = "212613723827";
      window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(msg)}`, '_blank');
      
      setStepStatus(prev => ({ ...prev, notified: true }));
    } catch (error) {
      alert("حدث خطأ أثناء تسجيل طلب الشحن. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseModal = () => {
    setShowConfirmation(false);
    setSelectedPackage(null);
    fetchTransactions(); // تحديث القائمة عند الإغلاق للتأكد من ظهور المعاملة المعلقة
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 lg:space-y-12 animate-in fade-in duration-500 pb-12 lg:pb-20 text-right" dir="rtl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">
        <div className="lg:col-span-2 space-y-6 lg:space-y-10">
          <div className="bg-gradient-to-br from-morocco-red to-[#800000] p-6 lg:p-12 rounded-3xl lg:rounded-[4rem] shadow-2xl relative overflow-hidden text-white border border-white/20">
             <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
             <div className="relative z-10 flex justify-between items-center">
                <div className="space-y-2 lg:space-y-4">
                   <p className="text-red-100 font-black text-[10px] lg:text-xs uppercase tracking-[0.4em] mb-2 lg:mb-4 opacity-80 leading-relaxed">الرصيد المتوفر 👑</p>
                   <h2 className="text-3xl lg:text-7xl font-black leading-tight tracking-tighter">
                     {(user.points || 0).toLocaleString()} <span className="text-sm lg:text-2xl opacity-60 font-bold">جوهرة</span>
                   </h2>
                </div>
                <div className="w-14 h-14 lg:w-24 lg:h-24 bg-white/10 rounded-2xl lg:rounded-3xl flex items-center justify-center backdrop-blur-3xl border border-white/20 shadow-2xl">
                   <i className="fas fa-gem text-xl lg:text-4xl text-morocco-gold"></i>
                </div>
             </div>
          </div>

          <div className="glass-card p-6 lg:p-10 rounded-3xl lg:rounded-[3.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
             <h3 className="text-xl lg:text-2xl font-black mb-6 lg:mb-10 text-slate-800 dark:text-white flex items-center gap-4 lg:gap-5 leading-relaxed">
               <i className="fas fa-history text-morocco-red"></i> سجل العمليات
             </h3>
             <div className="space-y-3 lg:space-y-4 max-h-[450px] overflow-y-auto pr-2 lg:pr-4 custom-scrollbar text-right">
                {transactions.length === 0 ? (
                    <div className="py-16 lg:py-24 text-center space-y-6 opacity-30 italic">لا توجد عمليات مسجلة بعد.</div>
                ) : (
                    transactions.map(t => (
                        <div key={t.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 lg:p-6 bg-white dark:bg-white/5 rounded-2xl lg:rounded-3xl border border-slate-50 dark:border-white/10 group transition-all gap-3 lg:gap-4">
                            <div className="flex items-center gap-4 lg:gap-6">
                                <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-inner shrink-0 ${t.status === 'pending' ? 'bg-yellow-100 text-yellow-600' : t.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                    <i className={`fas ${t.status === 'pending' ? 'fa-clock' : t.status === 'rejected' ? 'fa-times' : 'fa-check'} text-sm lg:text-base`}></i>
                                </div>
                                <div>
                                    <p className="font-black text-slate-800 dark:text-slate-200 text-xs lg:text-base leading-relaxed">{t.description}</p>
                                    <p className="text-[8px] lg:text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">
                                      {new Date(t.date).toLocaleString('ar-MA')}
                                    </p>
                                </div>
                            </div>
                            <span className={`text-lg lg:text-xl font-black shrink-0 ${t.status === 'rejected' ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-white'}`}>
                                {t.type === 'purchase' || t.type === 'earn' ? '+' : '-'}{t.amount.toLocaleString()}
                            </span>
                        </div>
                    ))
                )}
             </div>
          </div>
        </div>

        <div className="space-y-6 lg:space-y-8">
           <div className="glass-card p-6 lg:p-10 rounded-3xl lg:rounded-[3rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <div className="text-center mb-6 lg:mb-10">
                <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-[0.3em] text-[10px] lg:text-[11px] mb-2">اقتناء باقات الجواهر 💎</h3>
              </div>
              <div className="space-y-3 lg:space-y-4">
                 {packages.map(pkg => (
                   <button 
                     key={pkg.id} 
                     onClick={() => handlePackageSelect(pkg)} 
                     className={`w-full p-4 lg:p-6 rounded-2xl lg:rounded-[2rem] border-2 text-right transition-all relative group ${pkg.popular ? 'border-morocco-red bg-red-50 dark:bg-red-900/10' : 'border-slate-50 dark:border-white/5 bg-white dark:bg-white/5 hover:border-morocco-red/20'}`}
                   >
                      <p className="text-slate-400 dark:text-slate-500 text-[8px] lg:text-[10px] font-black mb-1 uppercase tracking-widest">{pkg.label}</p>
                      <div className="flex justify-between items-end">
                        <span className="text-xl lg:text-3xl font-black text-slate-800 dark:text-white">{(pkg.points).toLocaleString()}</span>
                        <span className="text-base lg:text-xl font-black text-morocco-red">{pkg.price} DH</span>
                      </div>
                   </button>
                 ))}
              </div>
           </div>
           
           <div className="glass-card p-6 lg:p-8 rounded-2xl lg:rounded-[2.5rem] bg-morocco-green/5 border-morocco-green/20">
              <button 
                onClick={() => window.open(`https://wa.me/212613723827?text=${encodeURIComponent("مرحباً، لدي استفسار بخصوص شحن المحفظة.")}`, '_blank')} 
                className="w-full flex items-center justify-center gap-3 lg:gap-4 p-4 lg:p-5 bg-morocco-green text-white rounded-xl lg:rounded-2xl font-black shadow-xl hover:scale-105 transition-all"
              >
                <i className="fab fa-whatsapp text-xl lg:text-2xl"></i>
                <span className="text-xs lg:text-sm">الدعم الفني المباشر</span>
              </button>
           </div>
        </div>
      </div>

      {showConfirmation && selectedPackage && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 lg:p-6 bg-black/95 backdrop-blur-2xl animate-in fade-in duration-300">
           <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl lg:rounded-[3.5rem] p-6 lg:p-12 relative shadow-2xl border border-white/10 overflow-hidden text-center">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-morocco-red"></div>
              
              <div className="text-center mb-6 lg:mb-10">
                  <div className="w-16 h-16 lg:w-20 lg:h-20 bg-morocco-red/10 rounded-full flex items-center justify-center mx-auto mb-4 lg:mb-6">
                     <i className="fas fa-shield-check text-2xl lg:text-3xl text-morocco-red"></i>
                  </div>
                  <h2 className="text-xl lg:text-2xl font-black text-slate-800 dark:text-white leading-relaxed">تفعيل اشتراك: {selectedPackage.label}</h2>
                  <p className="text-slate-500 dark:text-slate-400 font-bold text-xs lg:text-sm mt-2">يرجى اتباع الخطوات بالترتيب لضمان التفعيل.</p>
              </div>

              <div className="space-y-4 lg:space-y-6 text-right">
                 {/* الخطوة 1: الدفع */}
                 <div className={`p-4 lg:p-6 rounded-2xl lg:rounded-3xl border-2 transition-all duration-300 ${stepStatus.paid ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-500' : 'bg-slate-50 dark:bg-white/5 border-transparent'}`}>
                    <div className="flex justify-between items-center mb-3 lg:mb-4">
                        <span className={`text-[8px] lg:text-[10px] font-black uppercase tracking-widest ${stepStatus.paid ? 'text-emerald-600' : 'text-slate-400'}`}>الخطوة الأولى: الدفع</span>
                        {stepStatus.paid && <i className="fas fa-check-circle text-emerald-500 text-lg lg:text-xl animate-bounce"></i>}
                    </div>
                    <div className="flex flex-col gap-3 lg:gap-4">
                        <p className={`text-xs lg:text-sm font-bold ${stepStatus.paid ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>إتمام عملية الشراء الآمن عبر بوابة الدفع.</p>
                        {!stepStatus.paid ? (
                            <button 
                                onClick={handlePaymentClick}
                                className="w-full py-3 lg:py-4 bg-morocco-red text-white rounded-xl lg:rounded-2xl font-black text-xs lg:text-sm flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-red-500/20"
                            >
                                <i className="fas fa-credit-card"></i> إتمام الدفع ({selectedPackage.price} DH)
                            </button>
                        ) : (
                            <div className="w-full py-2.5 lg:py-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg lg:rounded-xl text-center text-[10px] lg:text-xs font-black">
                                تم الانتقال لصفحة الدفع ✅
                            </div>
                        )}
                    </div>
                 </div>

                 {/* الخطوة 2: تأكيد الواتساب */}
                 <div className={`p-4 lg:p-6 rounded-2xl lg:rounded-3xl border-2 transition-all duration-300 ${stepStatus.notified ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-500' : 'bg-slate-50 dark:bg-white/5 border-transparent'} ${!stepStatus.paid ? 'opacity-50 grayscale' : ''}`}>
                    <div className="flex justify-between items-center mb-3 lg:mb-4">
                        <span className={`text-[8px] lg:text-[10px] font-black uppercase tracking-widest ${stepStatus.notified ? 'text-emerald-600' : 'text-slate-400'}`}>الخطوة الثانية: التأكيد</span>
                        {stepStatus.notified && <i className="fas fa-check-circle text-emerald-500 text-lg lg:text-xl animate-bounce"></i>}
                    </div>
                    <div className="flex flex-col gap-3 lg:gap-4">
                        <p className={`text-xs lg:text-sm font-bold ${stepStatus.notified ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>إرسال معلومات الطلب للمدير لتفعيل رصيدك يدوياً.</p>
                        {!stepStatus.notified ? (
                            <button 
                                onClick={handleWhatsAppVerification}
                                disabled={!stepStatus.paid || isProcessing}
                                className={`w-full py-3 lg:py-4 bg-morocco-green text-white rounded-xl lg:rounded-2xl font-black text-xs lg:text-sm flex items-center justify-center gap-3 transition-all shadow-xl shadow-green-500/20 ${!stepStatus.paid ? 'cursor-not-allowed opacity-50' : 'hover:scale-[1.02] active:scale-95'}`}
                            >
                                {isProcessing ? <i className="fas fa-spinner fa-spin"></i> : <i className="fab fa-whatsapp text-base lg:text-lg"></i>} تأكيد التفعيل
                            </button>
                        ) : (
                            <div className="w-full py-2.5 lg:py-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg lg:rounded-xl text-center text-[10px] lg:text-xs font-black">
                                تم إرسال طلب التفعيل بنجاح ✅
                            </div>
                        )}
                    </div>
                 </div>
              </div>

              <div className="mt-8 lg:mt-12 flex flex-col gap-3">
                 <button 
                    onClick={handleCloseModal}
                    className="w-full py-4 lg:py-5 bg-slate-900 text-white dark:bg-white dark:text-black rounded-xl lg:rounded-2xl font-black text-base lg:text-lg shadow-xl hover:brightness-110 transition-all"
                 >
                    إغلاق وانتظار التفعيل
                 </button>
                 <p className="text-[8px] lg:text-[10px] text-slate-500 font-bold mt-2 uppercase tracking-widest italic text-center">سيتم تفعيل الجواهر بمجرد تأكيد الأدمن.</p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default WalletModule;
