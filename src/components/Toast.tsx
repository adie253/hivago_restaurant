import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  duration?: number;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

const Toast = ({ message, duration = 3000, type = 'info', onClose }: ToastProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade-out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getStyles = () => {
    switch (type) {
      case 'error': return 'bg-red-500';
      case 'success': return 'bg-emerald-500';
      case 'info': return 'bg-slate-900';
      default: return 'bg-slate-900';
    }
  };

  return (
    <div
      className={`fixed bottom-8 right-8 z-[200] transform transition-all duration-300 ease-out ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-4 shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-slate-100">
        <div className={`flex h-6 w-6 items-center justify-center rounded-full text-white ${getStyles()}`}>
          {type === 'error' ? (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : type === 'info' ? (
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <p className="text-sm font-bold text-slate-700">{message}</p>
      </div>
    </div>
  );
};

export default Toast;
