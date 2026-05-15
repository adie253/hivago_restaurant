import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const OFFLINE_REASONS = [
  "High order rush / Kitchen is Full",
  "Kitchen staff not available",
  "Nearing closing time",
  "Outlet timings are not correct",
  "Temporarily closed",
  "Issues with menu",
  "Closed due to LPG shortage",
  "Others"
];

const OFFLINE_DURATIONS = [
  "In 30 minutes",
  "In 1 hour",
  "In 2 hours",
  "In 4 hours",
  "Tomorrow, opening time",
  "Specific date & time",
  "I will turn it on myself"
];

interface ToggleOfflineModalProps {
  isOpen: boolean;
  outletName: string;
  onClose: () => void;
  onConfirm: (reason: string, duration: string) => void;
  isLoading: boolean;
}

const ToggleOfflineModal: React.FC<ToggleOfflineModalProps> = ({ 
  isOpen, 
  outletName, 
  onClose, 
  onConfirm,
  isLoading 
}) => {
  const [step, setStep] = useState<'reason' | 'duration'>('reason');
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState('');
  const [customDate, setCustomDate] = useState('');
  const [customTime, setCustomTime] = useState('');

  if (!isOpen) return null;

  const handleNext = () => setStep('duration');
  const handleBack = () => setStep('reason');

  const handleConfirm = () => {
    const finalDuration = duration === 'Specific date & time' ? `${customDate} ${customTime}` : duration;
    onConfirm(reason, finalDuration);
  };

  const isDurationValid = () => {
    if (!duration) return false;
    if (duration === 'Specific date & time') return customDate && customTime;
    return true;
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[32px] w-full max-w-[460px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-4 flex items-center justify-between border-b border-slate-50">
          <div className="flex items-center gap-3">
            {step === 'duration' && (
              <button onClick={handleBack} className="p-1 hover:bg-slate-50 rounded-lg text-slate-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
              </button>
            )}
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              {step === 'reason' ? 'Select reason' : 'Set return time'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full text-slate-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
            Going offline for: <span className="text-emerald-600">{outletName}</span>
          </p>

          <div className="space-y-3">
            {step === 'reason' ? (
              OFFLINE_REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className={`w-full text-left px-5 py-4 rounded-2xl border-2 transition-all font-bold text-sm ${
                    reason === r ? 'border-emerald-500 bg-emerald-50/30 text-emerald-700' : 'border-slate-50 bg-slate-50/30 text-slate-600 hover:border-slate-100'
                  }`}
                >
                  {r}
                </button>
              ))
            ) : (
              OFFLINE_DURATIONS.map((d) => (
                <div key={d}>
                  <button
                    onClick={() => setDuration(d)}
                    className={`w-full text-left px-5 py-4 rounded-2xl border-2 transition-all font-bold text-sm ${
                      duration === d ? 'border-emerald-500 bg-emerald-50/30 text-emerald-700' : 'border-slate-50 bg-slate-50/30 text-slate-600 hover:border-slate-100'
                    }`}
                  >
                    {d}
                  </button>
                  {duration === d && d === 'Specific date & time' && (
                    <div className="mt-4 grid grid-cols-2 gap-3 px-1 animate-in fade-in slide-in-from-top-2">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 ml-1">DATE</label>
                        <input type="date" value={customDate} onChange={e => setCustomDate(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 ml-1">TIME</label>
                        <input type="time" value={customTime} onChange={e => setCustomTime(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none" />
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-8 pt-0">
          {step === 'reason' ? (
            <button
              onClick={handleNext}
              disabled={!reason}
              className="w-full bg-slate-900 hover:bg-emerald-600 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-slate-100 active:scale-[0.98] disabled:opacity-50"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleConfirm}
              disabled={!isDurationValid() || isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-emerald-100 active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? 'Updating...' : 'Confirm Offline'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ToggleOfflineModal;
