import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTimeOffs, useScheduleTimeOff, useQuickPause, useCancelTimeOff, TimeOff } from '../hooks/useTimeOff';
import { useToast } from '../context/ToastContext';

// Helper to format date for datetime-local input (yyyy-MM-ddThh:mm)
const toInputFormat = (date: Date) => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// Helper to format date for display (MMM d, h:mm a)
const toDisplayFormat = (dateStr: string) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(new Date(dateStr));
};

interface TimeOffModalProps {
  outletId: string;
  outletName: string;
  isOpen: boolean;
  onClose: () => void;
}

const TimeOffModal: React.FC<TimeOffModalProps> = ({ outletId, outletName, isOpen, onClose }) => {
  const { data: timeOffs, isLoading: isLoadingList } = useTimeOffs(outletId);
  const scheduleMutation = useScheduleTimeOff(outletId);
  const quickPauseMutation = useQuickPause(outletId);
  const cancelMutation = useCancelTimeOff(outletId);
  const { showToast } = useToast();

  const [startDate, setStartDate] = useState(toInputFormat(new Date()));
  const [endDate, setEndDate] = useState(toInputFormat(new Date(Date.now() + 3600000 * 24)));
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleQuickPause = (minutes: number) => {
    quickPauseMutation.mutate(
      { durationMinutes: minutes, reason: reason || `Quick pause (${minutes}m)` },
      {
        onSuccess: () => {
          showToast(`Paused for ${minutes} minutes`, 'success');
          setReason(''); // Clear reason after success
        },
        onError: (err: any) => {
          showToast(err.response?.data?.message || 'Failed to pause outlet', 'error');
        }
      }
    );
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await scheduleMutation.mutateAsync({
        startsAtUtc: new Date(startDate).toISOString(),
        endsAtUtc: new Date(endDate).toISOString(),
        reason: reason || undefined,
      });
      showToast('Time-off scheduled successfully', 'success');
      setReason('');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to schedule time-off', 'error');
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await cancelMutation.mutateAsync(id);
      showToast('Time-off cancelled', 'info');
    } catch (err: any) {
      showToast('Failed to cancel time-off', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[32px] w-full max-w-[500px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-slate-50">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Time-off Management</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <p className="text-sm font-semibold text-slate-400">Set availability for <span className="text-slate-600 font-bold">{outletName}</span></p>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
          
          {/* Pattern B: Quick Pause */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Quick Pause</h3>
            <div className="grid grid-cols-3 gap-3">
              {[30, 60, 120].map((mins) => (
                <button
                  key={mins}
                  onClick={() => handleQuickPause(mins)}
                  disabled={quickPauseMutation.isPending}
                  className="flex flex-col items-center justify-center py-4 px-2 rounded-2xl border-2 border-amber-100 bg-amber-50/30 hover:bg-amber-100 transition-all group active:scale-95 disabled:opacity-50"
                >
                  <span className="text-lg font-bold text-amber-600 mb-0.5">{mins}m</span>
                  <span className="text-[10px] font-bold text-amber-500/70 uppercase tracking-tight">Pause</span>
                </button>
              ))}
            </div>
          </section>

          {/* Pattern A: Schedule Window */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Schedule Custom Window</h3>
            <form onSubmit={handleSchedule} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 ml-1">Starts At</label>
                  <input 
                    type="datetime-local" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 ml-1">Ends At</label>
                  <input 
                    type="datetime-local" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 ml-1">Reason (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g., Staff training, Renovation..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500 focus:bg-white transition-all placeholder:text-slate-300"
                />
              </div>
              <button 
                type="submit"
                disabled={scheduleMutation.isPending}
                className="w-full bg-slate-900 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-slate-200 active:scale-[0.98] disabled:opacity-50"
              >
                {scheduleMutation.isPending ? 'Scheduling...' : 'Schedule Closure'}
              </button>
            </form>
          </section>

          {/* Active Closures List */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Active & Upcoming Breaks</h3>
            <div className="space-y-3">
              {isLoadingList ? (
                <div className="py-4 flex justify-center"><div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
              ) : !timeOffs?.length ? (
                <div className="py-8 text-center rounded-2xl border-2 border-dashed border-slate-100">
                  <p className="text-xs font-bold text-slate-400">No scheduled closures found</p>
                </div>
              ) : (
                timeOffs.map((t) => (
                  <div key={t.id} className={`p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${t.isActive ? 'border-amber-200 bg-amber-50/50' : 'border-slate-50 bg-white'}`}>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {t.isActive && <span className="px-1.5 py-0.5 rounded bg-amber-500 text-white text-[8px] font-bold uppercase tracking-widest animate-pulse">Active Now</span>}
                        <p className="text-[11px] font-bold text-slate-700 truncate">
                          {toDisplayFormat(t.startsAtUtc)} — {toDisplayFormat(t.endsAtUtc)}
                        </p>
                      </div>
                      {t.reason && <p className="text-[10px] font-semibold text-slate-400 line-clamp-1">{t.reason}</p>}
                    </div>
                    <button 
                      onClick={() => handleCancel(t.id)}
                      disabled={cancelMutation.isPending}
                      className="ml-4 p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors disabled:opacity-50"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

        </div>
      </motion.div>
    </div>
  );
};

export default TimeOffModal;
