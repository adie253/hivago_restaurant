import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  duration?: number;
  type?: 'success' | 'error';
  onClose: () => void;
}

const Toast = ({ message, duration = 3000, type = 'success', onClose }: ToastProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade-out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      className={`fixed bottom-8 right-8 z-[200] transform transition-all duration-300 ease-out ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-4 shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-slate-100">
        <div className={`flex h-6 w-6 items-center justify-center rounded-full text-white ${type === 'error' ? 'bg-red-500' : 'bg-slate-900'}`}>
          {type === 'error' ? (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
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
