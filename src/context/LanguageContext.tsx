import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

export type Language = 'en' | 'hi';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const translations: Record<Language, Record<string, string>> = {
  en: {
    dashboard: 'Dashboard',
    menu: 'Menu',
    payouts: 'Payouts',
    settings: 'Settings',
    outlets: 'Outlets',
    bankDetails: 'Bank Details',
    pending: 'Pending',
    preparing: 'Preparing',
    ready: 'Ready',
    orderHistory: 'Order History',
    newOrder: '1 new order',
    acceptOrder: 'Accept Order',
    reject: 'Reject',
    prepTime: 'Set food preparation time',
    deliveryPartner: 'Select delivery partner',
    totalBill: 'Total Bill',
    online: 'ONLINE',
    offline: 'OFFLINE',
    switchOutlet: 'Switch Outlet',
    manageOutlets: 'Manage Outlets',
    logout: 'Logout',
    chooseLanguage: 'Choose Your Language',
    selectLanguageDesc: 'Please select your preferred language to proceed.',
    save: 'Save',
    activeOrders: 'Live Orders',
    revenue: 'Revenue',
    averageOrderValue: 'Avg Order Value',
    todaysOrders: 'Today\'s Orders',
    todaysRevenue: 'Today\'s Revenue'
  },
  hi: {
    dashboard: 'डैशबोर्ड',
    menu: 'मेनू',
    payouts: 'भुगतान (पेआउट)',
    settings: 'सेटिंग्स',
    outlets: 'आउटलेट्स',
    bankDetails: 'बैंक विवरण',
    pending: 'लंबित',
    preparing: 'तैयार हो रहा है',
    ready: 'तैयार',
    orderHistory: 'ऑर्डर इतिहास',
    newOrder: '1 नया ऑर्डर',
    acceptOrder: 'ऑर्डर स्वीकार करें',
    reject: 'अस्वीकार करें',
    prepTime: 'भोजन तैयार करने का समय निर्धारित करें',
    deliveryPartner: 'डिलिवरी पार्टनर चुनें',
    totalBill: 'कुल बिल',
    online: 'ऑनलाइन',
    offline: 'ऑफ़लाइन',
    switchOutlet: 'आउटलेट बदलें',
    manageOutlets: 'आउटलेट प्रबंधित करें',
    logout: 'लॉगआउट',
    chooseLanguage: 'अपनी भाषा चुनें',
    selectLanguageDesc: 'कृपया आगे बढ़ने के लिए अपनी पसंदीदा भाषा चुनें।',
    save: 'सहेजें',
    activeOrders: 'सक्रिय ऑर्डर',
    revenue: 'कुल कमाई',
    averageOrderValue: 'औसत ऑर्डर मूल्य',
    todaysOrders: 'आज के ऑर्डर',
    todaysRevenue: 'आज की कमाई'
  }
};

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('hivago_language') as Language) || 'en';
  });
  const [showSelector, setShowSelector] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      const savedLang = localStorage.getItem('hivago_language');
      if (!savedLang) {
        setShowSelector(true);
      } else {
        setLanguageState(savedLang as Language);
      }
    } else {
      setShowSelector(false);
    }
  }, [isAuthenticated]);

  const setLanguage = (lang: Language) => {
    localStorage.setItem('hivago_language', lang);
    setLanguageState(lang);
    setShowSelector(false);
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
      {showSelector && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[24px] w-full max-w-[420px] shadow-2xl p-8 text-center animate-in fade-in zoom-in duration-300">
            <div className="mx-auto w-16 h-16 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mb-6 shadow-inner text-2xl font-bold">
              🌐
            </div>
            
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Choose Your Language</h2>
            <h3 className="text-xl font-bold text-slate-700 mb-2">अपनी भाषा चुनें</h3>
            <p className="text-sm text-slate-400 mb-8 leading-relaxed">
              Please select your preferred language to proceed / आगे बढ़ने के लिए कृपया अपनी पसंदीदा भाषा चुनें।
            </p>
            
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => setLanguage('en')}
                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold py-4 px-6 rounded-2xl border border-slate-200 transition-all text-left flex items-center justify-between shadow-sm hover:shadow active:scale-95"
              >
                <div className="flex flex-col">
                  <span className="text-base font-bold">English</span>
                  <span className="text-xs text-slate-400 font-medium mt-0.5">Use app in English</span>
                </div>
                <span className="text-xl">🇬🇧</span>
              </button>
              <button 
                onClick={() => setLanguage('hi')}
                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold py-4 px-6 rounded-2xl border border-slate-200 transition-all text-left flex items-center justify-between shadow-sm hover:shadow active:scale-95"
              >
                <div className="flex flex-col">
                  <span className="text-base font-bold">हिन्दी (Hindi)</span>
                  <span className="text-xs text-slate-400 font-medium mt-0.5">ऐप को हिन्दी में उपयोग करें</span>
                </div>
                <span className="text-xl">🇮🇳</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
