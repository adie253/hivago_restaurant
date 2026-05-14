import { useEffect, useState } from 'react';
import { HoursSettings, DaySchedule, DayOfWeek } from '../types';

interface BusinessHoursFormProps {
  hours: HoursSettings;
  onSave: (hours: HoursSettings) => void;
  saving?: boolean;
}

const DAYS_OF_WEEK: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Helper to convert 24h string to 12h display string for input placeholder/look
const to12h = (time: string) => {
  if (!time || typeof time !== 'string') return '10:00 AM';
  const parts = time.split(':');
  if (parts.length < 2) return '10:00 AM';
  
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  
  if (isNaN(h) || isNaN(m)) return '10:00 AM';
  
  const period = h >= 12 ? 'PM' : 'AM';
  const displayHours = h % 12 || 12;
  return `${displayHours}:${m.toString().padStart(2, '0')} ${period}`;
};

// Ensure all 7 days exist in local state
const buildFullSchedule = (provided: DaySchedule[] = []): DaySchedule[] => {
  return DAYS_OF_WEEK.map(day => {
    const existing = provided.find(d => d.dayOfWeek === day);
    return existing ? existing : { dayOfWeek: day, slots: [] };
  });
};

const BusinessHoursForm = ({ hours: initialHours, onSave, saving }: BusinessHoursFormProps) => {
  const [hours, setHours] = useState<HoursSettings>({
    useCustomSchedule: initialHours.useCustomSchedule,
    openingTime: initialHours.openingTime || '09:00:00',
    closingTime: initialHours.closingTime || '22:00:00',
    weeklySchedule: buildFullSchedule(initialHours.weeklySchedule)
  });

  useEffect(() => {
    // Only sync if we're not currently saving (which means a fresh load or successful save)
    if (!saving) {
      setHours({
        useCustomSchedule: initialHours.useCustomSchedule,
        openingTime: initialHours.openingTime || '09:00:00',
        closingTime: initialHours.closingTime || '22:00:00',
        weeklySchedule: buildFullSchedule(initialHours.weeklySchedule)
      });
    }
  }, [initialHours, saving]);

  const handleToggleCustom = () => {
    setHours(prev => {
      const nextMode = !prev.useCustomSchedule;
      
      // If we're enabling custom schedule and all days are empty, pre-populate them with the standard hours
      let nextSchedule = prev.weeklySchedule;
      const isEntirelyEmpty = prev.weeklySchedule.every(day => day.slots.length === 0);
      
      if (nextMode && isEntirelyEmpty) {
        nextSchedule = prev.weeklySchedule.map(day => ({
          ...day,
          slots: [{ opensAt: prev.openingTime, closesAt: prev.closingTime }]
        }));
      }

      return { 
        ...prev, 
        useCustomSchedule: nextMode,
        weeklySchedule: nextSchedule 
      };
    });
  };

  const handleSimpleTimeChange = (field: 'openingTime' | 'closingTime', val: string) => {
    setHours(prev => ({ ...prev, [field]: val + (val.length === 5 ? ':00' : '') }));
  };

  const handleToggleDay = (dayName: DayOfWeek) => {
    setHours(prev => {
      const schedule = prev.weeklySchedule.map(day => {
        if (day.dayOfWeek === dayName) {
          const isClosed = day.slots.length === 0;
          return {
            ...day,
            slots: isClosed ? [{ opensAt: prev.openingTime, closesAt: prev.closingTime }] : []
          };
        }
        return day;
      });
      return { ...prev, weeklySchedule: schedule };
    });
  };

  const handleSlotChange = (dayName: DayOfWeek, index: number, field: 'opensAt' | 'closesAt', value: string) => {
    // Input time type gives "HH:mm". The backend expects valid time string, usually HH:mm:ss. We'll append :00 if missing.
    const strictValue = value.length === 5 ? `${value}:00` : value;

    setHours(prev => {
      const schedule = prev.weeklySchedule.map(day => {
        if (day.dayOfWeek === dayName) {
          const newSlots = [...day.slots];
          newSlots[index] = { ...newSlots[index], [field]: strictValue };
          return { ...day, slots: newSlots };
        }
        return day;
      });
      return { ...prev, weeklySchedule: schedule };
    });
  };

  const handleAddSlot = (dayName: DayOfWeek) => {
    setHours(prev => {
      const schedule = prev.weeklySchedule.map(day => {
        if (day.dayOfWeek === dayName) {
          if (day.slots.length >= 3) return day; // Max 3 slots per day based on spec
          
          // Use the restaurant's closing time or a reasonable evening window for the new slot
          return {
            ...day,
            slots: [...day.slots, { opensAt: '12:00:00', closesAt: prev.closingTime }]
          };
        }
        return day;
      });
      return { ...prev, weeklySchedule: schedule };
    });
  };

  const handleRemoveSlot = (dayName: DayOfWeek, index: number) => {
    setHours(prev => {
      const schedule = prev.weeklySchedule.map(day => {
        if (day.dayOfWeek === dayName) {
          return {
            ...day,
            slots: day.slots.filter((_, i) => i !== index)
          };
        }
        return day;
      });
      return { ...prev, weeklySchedule: schedule };
    });
  };

  const handleApplyToAll = (sourceDayName: DayOfWeek) => {
    setHours(prev => {
      const sourceDay = prev.weeklySchedule.find(d => d.dayOfWeek === sourceDayName);
      if (!sourceDay) return prev;
      
      const nextSchedule = prev.weeklySchedule.map(d => ({
        ...d,
        slots: sourceDay.slots.map(s => ({ ...s })) // deep copy
      }));
      
      return { ...prev, weeklySchedule: nextSchedule };
    });
  };

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">Business Hours</h2>
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm">
          <span className="text-sm font-bold text-slate-700">Custom Daily Schedule</span>
          <button
            type="button"
            onClick={handleToggleCustom}
            className={`relative inline-flex h-6 w-11 flex-none items-center rounded-full transition-colors focus:outline-none ${
              hours.useCustomSchedule ? 'bg-emerald-500' : 'bg-slate-200'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${hours.useCustomSchedule ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>

      {!hours.useCustomSchedule ? (
        <div className="bg-white p-8 rounded-3xl border border-slate-50 shadow-[0_4px_25px_rgba(0,0,0,0.02)] space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">Standard Daily Hours</h3>
            <p className="text-sm text-slate-500">You are open every day during these hours.</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div 
              className="relative group cursor-pointer"
              onClick={(e) => {
                const input = e.currentTarget.querySelector('input') as HTMLInputElement;
                if (input) {
                  if (input.showPicker) {
                    input.showPicker();
                  } else {
                    input.focus();
                    input.click();
                  }
                }
              }}
            >
              <input
                type="time"
                value={hours.openingTime?.substring(0, 5) || '09:00'}
                onChange={(e) => handleSimpleTimeChange('openingTime', e.target.value)}
                className="absolute inset-0 w-full h-full opacity-[0.01] cursor-pointer z-20"
              />
              <div className="min-w-[140px] rounded-2xl px-5 py-4 text-base font-bold bg-slate-50 border-2 border-transparent text-slate-900 group-hover:border-slate-200 group-hover:bg-white transition-all text-center flex items-center justify-center gap-2">
                <span>{to12h(hours.openingTime)}</span>
                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <span className="text-sm font-black text-slate-300 uppercase letter-spacing-widest">to</span>
            <div 
              className="relative group cursor-pointer"
              onClick={(e) => {
                const input = e.currentTarget.querySelector('input') as HTMLInputElement;
                if (input) {
                  if (input.showPicker) {
                    input.showPicker();
                  } else {
                    input.focus();
                    input.click();
                  }
                }
              }}
            >
              <input
                type="time"
                value={hours.closingTime?.substring(0, 5) || '22:00'}
                onChange={(e) => handleSimpleTimeChange('closingTime', e.target.value)}
                className="absolute inset-0 w-full h-full opacity-[0.01] cursor-pointer z-20"
              />
              <div className="min-w-[140px] rounded-2xl px-5 py-4 text-base font-bold bg-slate-50 border-2 border-transparent text-slate-900 group-hover:border-slate-200 group-hover:bg-white transition-all text-center flex items-center justify-center gap-2">
                <span>{to12h(hours.closingTime)}</span>
                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {hours.weeklySchedule.map((dayData) => {
            const dayName = dayData.dayOfWeek as DayOfWeek;
            const isClosed = dayData.slots.length === 0;

            return (
              <div key={dayName} className={`rounded-3xl border transition-all duration-300 ${
                isClosed 
                  ? 'border-slate-50 bg-slate-50/40 opacity-80' 
                  : 'border-slate-100 bg-white shadow-[0_4px_25px_rgba(0,0,0,0.02)]'
              } p-6`}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <h3 className="text-base font-bold text-slate-900">{dayName}</h3>
                    {!isClosed && (
                      <button
                        onClick={() => handleApplyToAll(dayName)}
                        className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter bg-emerald-50 px-2 py-1.5 rounded-lg hover:bg-emerald-500 hover:text-white transition-all"
                      >
                        Apply to all days
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-400">
                      {isClosed ? 'Closed' : 'Open'}
                    </span>
                    <button
                      onClick={() => handleToggleDay(dayName)}
                      className={`relative inline-flex h-6 w-11 flex-none items-center rounded-full transition-colors duration-200 focus:outline-none ${
                        !isClosed ? 'bg-emerald-500' : 'bg-slate-200'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${!isClosed ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>

                {!isClosed && (
                  <div className="space-y-4">
                    {dayData.slots.map((slot, index) => {
                      const isInvalid = slot.opensAt && slot.closesAt && slot.opensAt >= slot.closesAt;
                      return (
                        <div key={index} className="flex flex-wrap items-center gap-4">
                          <div className="flex flex-wrap items-center gap-3">
                            <div 
                              className="relative group cursor-pointer"
                              onClick={(e) => {
                                const input = e.currentTarget.querySelector('input') as HTMLInputElement;
                                if (input) {
                                  if (input.showPicker) {
                                    input.showPicker();
                                  } else {
                                    input.focus();
                                    input.click();
                                  }
                                }
                              }}
                            >
                              <input
                                type="time"
                                value={slot.opensAt.substring(0, 5)}
                                onChange={(e) => handleSlotChange(dayName, index, 'opensAt', e.target.value)}
                                className="absolute inset-0 w-full h-full opacity-[0.01] cursor-pointer z-20"
                              />
                              <div className={`min-w-[130px] rounded-2xl px-5 py-3.5 text-sm font-bold border-2 transition-all text-center flex items-center justify-center gap-2
                                ${isInvalid ? 'bg-red-50 border-red-100 text-red-500' : 'bg-slate-50 border-transparent text-slate-900 group-hover:border-slate-200 group-hover:bg-white'}
                              `}>
                                <span>{to12h(slot.opensAt)}</span>
                                <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                            </div>

                            <span className="text-[10px] font-black text-slate-300 uppercase letter-spacing-widest">to</span>

                            <div 
                              className="relative group cursor-pointer"
                              onClick={(e) => {
                                const input = e.currentTarget.querySelector('input') as HTMLInputElement;
                                if (input) {
                                  if (input.showPicker) {
                                    input.showPicker();
                                  } else {
                                    input.focus();
                                    input.click();
                                  }
                                }
                              }}
                            >
                              <input
                                type="time"
                                value={slot.closesAt.substring(0, 5)}
                                onChange={(e) => handleSlotChange(dayName, index, 'closesAt', e.target.value)}
                                className="absolute inset-0 w-full h-full opacity-[0.01] cursor-pointer z-20"
                              />
                              <div className={`min-w-[130px] rounded-2xl px-5 py-3.5 text-sm font-bold border-2 transition-all text-center flex items-center justify-center gap-2
                                ${isInvalid ? 'bg-red-50 border-red-100 text-red-500' : 'bg-slate-50 border-transparent text-slate-900 group-hover:border-slate-200 group-hover:bg-white'}
                              `}>
                                <span>{to12h(slot.closesAt)}</span>
                                <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            {isInvalid && (
                              <div className="flex h-12 items-center text-[10px] font-bold text-red-400 uppercase tracking-tight">
                                Invalid range
                              </div>
                            )}
                            <button
                              onClick={() => handleRemoveSlot(dayName, index)}
                              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 transition-all hover:bg-red-50 hover:text-red-500"
                            >
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    
                    {dayData.slots.length < 3 && (
                      <button
                        onClick={() => handleAddSlot(dayName)}
                        className="flex items-center gap-3 group mt-2 pl-2"
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-xl border-2 border-[#AD221F] text-[#AD221F] group-hover:bg-[#AD221F] group-hover:text-white transition-all">
                          <span className="text-xs font-bold">＋</span>
                        </div>
                        <span className="text-[11px] font-black text-[#AD221F] uppercase tracking-wider">Add custom slot</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="pt-6 border-t border-slate-50">
        <button
          onClick={() => onSave(hours)}
          disabled={saving}
          className="w-full md:w-auto px-10 rounded-[24px] bg-[#AD221F] py-5 text-base font-bold text-white shadow-2xl shadow-red-100 transition-all hover:bg-red-800 hover:shadow-red-200 active:scale-[0.98] disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Business Hours'}
        </button>
      </div>
    </div>
  );
};

export default BusinessHoursForm;
