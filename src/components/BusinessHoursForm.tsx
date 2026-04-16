import { useEffect, useState } from 'react';
import { OpeningHours, DayHours, TimeSlot } from '../types';

interface BusinessHoursFormProps {
  hours: OpeningHours;
  onSave: (hours: OpeningHours) => void;
}

const daysOfWeek = [
  { id: 'monday', label: 'Monday' },
  { id: 'tuesday', label: 'Tuesday' },
  { id: 'wednesday', label: 'Wednesday' },
  { id: 'thursday', label: 'Thursday' },
  { id: 'friday', label: 'Friday' },
  { id: 'saturday', label: 'Saturday' },
  { id: 'sunday', label: 'Sunday' }
] as const;

// Helper to convert 24h string to 12h display string for input placeholder/look
const to12h = (time: string) => {
  if (!time) return '10:00 AM';
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hours = h % 12 || 12;
  return `${hours}:${m.toString().padStart(2, '0')} ${period}`;
};

const BusinessHoursForm = ({ hours: initialHours, onSave }: BusinessHoursFormProps) => {
  const [hours, setHours] = useState<OpeningHours>(initialHours);

  // Sync state if props change (e.g. after a refresh or parent update)
  useEffect(() => {
    setHours(initialHours);
  }, [initialHours]);

  const handleToggleDay = (day: keyof OpeningHours) => {
    setHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        isClosed: !prev[day].isClosed,
        slots: (!prev[day].isClosed || prev[day].slots.length > 0) 
                ? prev[day].slots 
                : [{ from: '10:00', to: '22:00' }]
      }
    }));
  };

  const handleSlotChange = (day: keyof OpeningHours, index: number, field: keyof TimeSlot, value: string) => {
    setHours((prev) => {
      const newSlots = [...prev[day].slots];
      newSlots[index] = { ...newSlots[index], [field]: value };
      return {
        ...prev,
        [day]: { ...prev[day], slots: newSlots }
      };
    });
  };

  const handleAddSlot = (day: keyof OpeningHours) => {
    setHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: [...prev[day].slots, { from: '11:00', to: '16:00' }]
      }
    }));
  };

  const handleRemoveSlot = (day: keyof OpeningHours, index: number) => {
    setHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.filter((_, i) => i !== index)
      }
    }));
  };

  const handleApplyToAll = (sourceDay: keyof OpeningHours) => {
    const sourceHours = hours[sourceDay];
    setHours((prev) => {
      const next: any = { ...prev };
      daysOfWeek.forEach((d) => {
        next[d.id] = { ...sourceHours };
      });
      return next as OpeningHours;
    });
  };

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">Business Hours</h2>
        <p className="text-sm font-bold text-slate-400">Configure your weekly operating schedule</p>
      </div>

      <div className="space-y-4">
        {daysOfWeek.map(({ id, label }) => {
          const dayHours = hours[id];
          return (
            <div key={id} className={`rounded-3xl border transition-all duration-300 ${
              dayHours.isClosed 
                ? 'border-slate-50 bg-slate-50/20 opacity-70' 
                : 'border-slate-100 bg-white shadow-[0_4px_25px_rgba(0,0,0,0.02)]'
            } p-6`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <h3 className="text-base font-bold text-slate-900">{label}</h3>
                  {!dayHours.isClosed && (
                    <button
                      onClick={() => handleApplyToAll(id)}
                      className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter bg-emerald-50 px-2 py-1 rounded-lg hover:bg-emerald-500 hover:text-white transition-all"
                    >
                      Apply to all days
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-400">
                    {dayHours.isClosed ? 'Closed' : 'Open'}
                  </span>
                  <button
                    onClick={() => handleToggleDay(id)}
                    className={`relative inline-flex h-6 w-11 flex-none items-center rounded-full transition-colors duration-200 focus:outline-none ${
                        !dayHours.isClosed ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                        !dayHours.isClosed ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {!dayHours.isClosed && (
                <div className="space-y-4">
                  {dayHours.slots.map((slot, index) => {
                    const isInvalid = slot.from && slot.to && slot.from >= slot.to;
                    return (
                      <div key={index} className="flex flex-wrap items-center gap-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="relative group">
                            <input
                              type="time"
                              value={slot.from}
                              onChange={(e) => handleSlotChange(id, index, 'from', e.target.value)}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className={`min-w-[130px] rounded-2xl px-5 py-3.5 text-sm font-bold border-2 transition-all text-center
                              ${isInvalid ? 'bg-red-50 border-red-100 text-red-500' : 'bg-slate-50 border-transparent text-slate-900 group-hover:border-slate-200 group-hover:bg-white'}
                            `}>
                              {to12h(slot.from)}
                            </div>
                          </div>

                          <span className="text-[10px] font-black text-slate-300 uppercase letter-spacing-widest">to</span>

                          <div className="relative group">
                            <input
                              type="time"
                              value={slot.to}
                              onChange={(e) => handleSlotChange(id, index, 'to', e.target.value)}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className={`min-w-[130px] rounded-2xl px-5 py-3.5 text-sm font-bold border-2 transition-all text-center
                              ${isInvalid ? 'bg-red-50 border-red-100 text-red-500' : 'bg-slate-50 border-transparent text-slate-900 group-hover:border-slate-200 group-hover:bg-white'}
                            `}>
                              {to12h(slot.to)}
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
                            onClick={() => handleRemoveSlot(id, index)}
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
                  
                  <button
                    onClick={() => handleAddSlot(id)}
                    className="flex items-center gap-3 group mt-2 pl-2"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-xl border-2 border-[#AD221F] text-[#AD221F] group-hover:bg-[#AD221F] group-hover:text-white transition-all">
                      <span className="text-xs font-bold">＋</span>
                    </div>
                    <span className="text-[11px] font-black text-[#AD221F] uppercase tracking-wider">Add custom slot</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="pt-6 border-t border-slate-50">
        <button
          onClick={() => onSave(hours)}
          className="w-full rounded-[24px] bg-[#AD221F] py-5 text-base font-bold text-white shadow-2xl shadow-red-100 transition-all hover:bg-red-800 hover:shadow-red-200 active:scale-[0.98]"
        >
          Save Weekly Schedule
        </button>
      </div>
    </div>
  );
};

export default BusinessHoursForm;
