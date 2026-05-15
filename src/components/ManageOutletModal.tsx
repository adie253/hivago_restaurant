import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { updateRestaurantAvailability } from '../api/dashboardApi';
import { getOwnerOutlets, switchOutlet, updateOutletAvailability } from '../api/ownerApi';
import { useAuth } from '../context/AuthContext';


interface Outlet {
  id: string;
  name: string;
  area: string;
  initials: string;
  color: string;
  status: 'Online' | 'Offline';
}

type FlowStep = 'list' | 'reason' | 'duration' | 'success';

const COLORS = ['bg-teal-600', 'bg-[#AD221F]', 'bg-blue-600', 'bg-rose-500', 'bg-indigo-600', 'bg-orange-600'];

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

const to12h = (time: string) => {
  if (!time || typeof time !== 'string') return '12:00 PM';
  const parts = time.split(':');
  if (parts.length < 2) return '12:00 PM';
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return '12:00 PM';
  const period = h >= 12 ? 'PM' : 'AM';
  const displayHours = h % 12 || 12;
  return `${displayHours}:${m.toString().padStart(2, '0')} ${period}`;
};

interface ManageOutletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ManageOutletModal = ({ isOpen, onClose }: ManageOutletModalProps) => {
  const [activeTab, setActiveTab] = useState<'manage' | 'schedule'>('manage');
  const [searchQuery, setSearchQuery] = useState('');
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen) {
      const fetchOutlets = async () => {
        setIsLoading(true);
        try {
          const data = await getOwnerOutlets();
          const formattedOutlets: Outlet[] = data.map((d, index) => ({
            id: d.id,
            name: d.name,
            area: d.addressLine || 'Address not provided',
            initials: d.name.substring(0, 2).toUpperCase(),
            color: COLORS[index % COLORS.length],
            status: d.isAcceptingOrders ? 'Online' : 'Offline'
          }));
          setOutlets(formattedOutlets);
        } catch (error) {
          console.error("Failed to fetch outlets:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchOutlets();
    }
  }, [isOpen]);

  const [flowStep, setFlowStep] = useState<FlowStep>('list');
  const [selectedOfflineOutlet, setSelectedOfflineOutlet] = useState<Outlet | null>(null);
  
  const [offlineReason, setOfflineReason] = useState<string>('');
  const [offlineDuration, setOfflineDuration] = useState<string>('');
  
  const [customDate, setCustomDate] = useState<string>('');
  const [customTime, setCustomTime] = useState<string>('');

  // Schedule time-off states
  const [scheduleOutletId, setScheduleOutletId] = useState<string>('');
  const [scheduleStartDate, setScheduleStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [scheduleStartTime, setScheduleStartTime] = useState<string>('00:00');
  const [scheduleEndDate, setScheduleEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [scheduleEndTime, setScheduleEndTime] = useState<string>('23:59');

  const formatScheduleAlert = () => {
    if (!scheduleStartDate || !scheduleStartTime || !scheduleEndDate || !scheduleEndTime) {
      return "Please select a valid date and time range";
    }

    try {
      const start = new Date(`${scheduleStartDate}T${scheduleStartTime}`);
      const end = new Date(`${scheduleEndDate}T${scheduleEndTime}`);
      
      const options: Intl.DateTimeFormatOptions = { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      };

      return (
        <>
          Your restaurant will be closed from <span className="font-bold text-[#c2410c]">{start.toLocaleString('en-US', options)}</span> to <span className="font-bold text-[#c2410c]">{end.toLocaleString('en-US', options)}</span>
        </>
      );
    } catch (e) {
      return "Invalid date or time range selected";
    }
  };



  if (!isOpen) return null;

  const handleToggle = async (outlet: Outlet) => {
    const isAcceptingOrders = outlet.status !== 'Online';

    try {
      setIsLoading(true);
      await updateOutletAvailability(outlet.id, isAcceptingOrders);
      setOutlets(prev => prev.map(o => o.id === outlet.id ? { ...o, status: isAcceptingOrders ? 'Online' : 'Offline' } : o));
      showToast(`${outlet.name} is now ${isAcceptingOrders ? 'online' : 'offline'}`, 'success');
    } catch (error) {
      showToast(`Failed to update status for ${outlet.name}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueFromReason = () => {
    setFlowStep('duration');
  };

  const handleConfirmOffline = async () => {
    if (selectedOfflineOutlet) {
      try {
        setIsLoading(true);
        await updateOutletAvailability(selectedOfflineOutlet.id, false);
        setOutlets(prev => prev.map(o => o.id === selectedOfflineOutlet.id ? { ...o, status: 'Offline' } : o));
        
        const durationStr = offlineDuration === 'Specific date & time' ? `${customDate} ${customTime}` : offlineDuration;
        showToast(`Offline: ${offlineReason}. Return: ${durationStr}`, 'info');
        
        setFlowStep('success');
      } catch (error) {
        showToast(`Failed to set ${selectedOfflineOutlet.name} offline`, 'error');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleCloseModal = () => {
    setFlowStep('list');
    setSelectedOfflineOutlet(null);
    onClose();
  };

  const isDurationValid = () => {
    if (!offlineDuration) return false;
    if (offlineDuration === 'Specific date & time') {
      return customDate !== '' && customTime !== '';
    }
    return true;
  };

  const filteredOutlets = outlets.filter(o => 
    o.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    o.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderManageViewContent = () => (
    <>
      <div className="px-8 py-5">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by outlet name, area or ID"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 focus:border-slate-300 focus:bg-white rounded-2xl px-5 py-3.5 text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="flex items-center justify-between px-8 pb-3">
        <span className="text-xs font-bold text-slate-500">Outlet Info</span>
        <span className="text-xs font-bold text-slate-500">Delivery and Takeaway</span>
      </div>

      <div className="px-8 pb-8 overflow-y-auto space-y-3 custom-scrollbar flex-1">
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#008940]"></div>
          </div>
        ) : filteredOutlets.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-sm font-semibold">No outlets found.</div>
        ) : (
          filteredOutlets.map((outlet) => (
            <div key={outlet.id} className="flex items-center justify-between p-4 rounded-3xl border border-slate-100 bg-white shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-all hover:border-slate-200">
            
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-base shadow-sm ${outlet.color}`}>
                {outlet.initials}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">{outlet.name}</h3>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">{outlet.area}</p>
              </div>
            </div>

            <div className="flex items-center gap-5">
              {outlet.status === 'Online' ? (
                <span className="px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wide">
                  Online
                </span>
              ) : (
                <span className="px-3.5 py-1.5 rounded-full bg-rose-50 text-rose-500 text-[10px] font-bold uppercase tracking-wide">
                  Offline
                </span>
              )}

              <button
                onClick={() => handleToggle(outlet)}
                className={`relative inline-flex h-6 w-11 flex-none items-center rounded-full transition-colors duration-200 focus:outline-none ${
                  outlet.status === 'Online' ? 'bg-[#008940]' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-sm ${
                    outlet.status === 'Online' ? 'translate-x-[22px]' : 'translate-x-[2px]'
                  }`}
                />
              </button>
            </div>

          </div>
        )))}
      </div>
    </>
  );

  const renderScheduleViewContent = () => (
    <div className="px-8 pb-8 flex-1 overflow-y-auto custom-scrollbar flex flex-col">
      <div className="bg-[#fff7ed] border border-[#ffedd5] rounded-[20px] p-5 mt-5 mb-6 shadow-sm">
        <div className="flex gap-3">
          <div className="mt-0.5">
            <svg className="w-5 h-5 text-[#f97316]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-[13px] font-semibold text-[#c2410c] leading-relaxed">
            {formatScheduleAlert()}
          </p>
        </div>
      </div>

      <div className="space-y-6 flex-1">
        <div className="space-y-2">
          <label className="text-[13px] font-bold text-slate-700 ml-1">Select a restaurant</label>
          <div className="relative group">
            <select 
              value={scheduleOutletId}
              onChange={(e) => setScheduleOutletId(e.target.value)}
              className="w-full bg-[#f8fafc] border border-slate-100 group-hover:border-slate-200 focus:border-[#008940] focus:bg-white rounded-[18px] pl-11 pr-10 py-4 text-sm font-bold text-slate-700 outline-none appearance-none transition-all shadow-sm"
            >
              <option value="">Select a restaurant</option>
              {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-6">
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-slate-700 ml-1">Start date</label>
            <input 
              type="date" 
              value={scheduleStartDate}
              onChange={(e) => setScheduleStartDate(e.target.value)}
              className="w-full bg-[#f8fafc] border border-slate-100 hover:border-slate-200 focus:border-[#008940] focus:bg-white rounded-[18px] px-4 py-4 text-sm font-bold text-slate-700 outline-none transition-all shadow-sm" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-slate-700 ml-1">Start time</label>
            <div 
              className="relative group cursor-pointer"
              onClick={(e) => {
                const input = e.currentTarget.querySelector('input') as HTMLInputElement;
                if (input) input.showPicker ? input.showPicker() : input.click();
              }}
            >
              <input 
                type="time" 
                value={scheduleStartTime}
                onChange={(e) => setScheduleStartTime(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-[0.01] cursor-pointer z-20" 
              />
              <div className="w-full bg-[#f8fafc] border border-slate-100 group-hover:border-slate-200 focus-within:border-[#008940] rounded-[18px] px-4 py-4 text-sm font-bold text-slate-700 flex items-center justify-between shadow-sm">
                <span>{to12h(scheduleStartTime)}</span>
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-slate-700 ml-1">End date</label>
            <input 
              type="date" 
              value={scheduleEndDate}
              onChange={(e) => setScheduleEndDate(e.target.value)}
              className="w-full bg-[#f8fafc] border border-slate-100 hover:border-slate-200 focus:border-[#008940] focus:bg-white rounded-[18px] px-4 py-4 text-sm font-bold text-slate-700 outline-none transition-all shadow-sm" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-slate-700 ml-1">End time</label>
            <div 
              className="relative group cursor-pointer"
              onClick={(e) => {
                const input = e.currentTarget.querySelector('input') as HTMLInputElement;
                if (input) input.showPicker ? input.showPicker() : input.click();
              }}
            >
              <input 
                type="time" 
                value={scheduleEndTime}
                onChange={(e) => setScheduleEndTime(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-[0.01] cursor-pointer z-20" 
              />
              <div className="w-full bg-[#f8fafc] border border-slate-100 group-hover:border-slate-200 focus-within:border-[#008940] rounded-[18px] px-4 py-4 text-sm font-bold text-slate-700 flex items-center justify-between shadow-sm">
                <span>{to12h(scheduleEndTime)}</span>
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button 
        onClick={async () => {
          if (!scheduleOutletId) {
            showToast('Please select a restaurant', 'info');
            return;
          }
          
          setIsLoading(true);
          try {
            const start = new Date(`${scheduleStartDate}T${scheduleStartTime}`);
            const end = new Date(`${scheduleEndDate}T${scheduleEndTime}`);

            // Use the new Time-Off API
            const { useScheduleTimeOff } = await import('../hooks/useTimeOff');
            // We can't use the hook here easily because it's inside a handler, 
            // so we'll use a direct API call or just tell them to use the new modal.
            // Actually, I'll just import the client and call it directly.
            const client = (await import('../api/client')).default;
            
            await client.post(`/owners/me/outlets/${scheduleOutletId}/time-off`, {
              startsAtUtc: start.toISOString(),
              endsAtUtc: end.toISOString(),
              reason: 'Scheduled via dashboard'
            });
            
            showToast('Schedule updated successfully', 'success');
            handleCloseModal();
          } catch (error: any) {
            console.error('Schedule update failed:', error);
            showToast(error.response?.data?.message || 'Failed to update outlet schedule', 'error');
          } finally {
            setIsLoading(false);
          }
        }}
        disabled={isLoading}
        className="w-full mt-8 bg-[#008940] hover:bg-[#007033] text-white font-bold py-4 rounded-[20px] transition-all shadow-lg shadow-green-100 hover:shadow-xl active:scale-[0.98] shrink-0 disabled:opacity-50"
      >
        {isLoading ? 'Updating...' : 'Update Schedule'}
      </button>
    </div>
  );

  const renderMainView = () => (
    <div className="flex flex-col h-full max-h-[85vh]">
      <div className="px-8 pt-8 pb-4 flex items-center justify-between shrink-0">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Manage Outlet</h2>
        <button 
          onClick={handleCloseModal}
          className="text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 hover:bg-slate-100 rounded-full p-1.5"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex px-8 border-b border-slate-100 shrink-0">
        <button
          onClick={() => setActiveTab('manage')}
          className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-all font-bold text-sm ${
            activeTab === 'manage' 
              ? 'border-[#008940] text-[#008940] bg-[#eafceb] bg-opacity-40' 
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          Manage Outlet
        </button>
        <button
          onClick={() => setActiveTab('schedule')}
          className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-all font-bold text-sm ${
            activeTab === 'schedule' 
              ? 'border-[#008940] text-[#008940] bg-[#eafceb] bg-opacity-40' 
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Schedule time-off
        </button>
      </div>

      {activeTab === 'manage' ? renderManageViewContent() : renderScheduleViewContent()}
    </div>
  );

  const renderOfflineReasonView = () => (
    <>
      <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              setFlowStep('list');
              setSelectedOfflineOutlet(null);
            }}
            className="text-slate-600 hover:text-slate-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h2 className="text-[17px] font-bold text-slate-900 tracking-tight">Select reason for going offline</h2>
        </div>
        <button 
          onClick={handleCloseModal}
          className="text-slate-400 hover:text-slate-600 transition-colors bg-white rounded-full p-1"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="px-6 py-5 flex-1 overflow-y-auto custom-scrollbar">
        <p className="text-sm mb-5">
          <span className="text-slate-500 font-medium">Outlet: </span>
          <span className="font-bold text-slate-800">{selectedOfflineOutlet?.name}</span>
        </p>

        <div className="space-y-2.5">
          {OFFLINE_REASONS.map((reason) => {
            const isSelected = offlineReason === reason;
            return (
              <label 
                key={reason}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-[14px] border-[1.5px] transition-all cursor-pointer ${
                  isSelected 
                    ? 'border-[#008940] bg-[#eafceb] bg-opacity-70 text-[#00843d]' 
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-800'
                }`}
              >
                <div className={`flex items-center justify-center w-[18px] h-[18px] rounded-full border-[1.5px] ${
                  isSelected ? 'border-[#008940]' : 'border-slate-300 bg-white'
                }`}>
                  {isSelected && <div className="w-[8px] h-[8px] rounded-full bg-[#008940]"></div>}
                </div>
                <span className={`text-[13px] font-semibold ${isSelected ? 'text-[#008940]' : 'text-slate-700'}`}>
                  {reason}
                </span>
                <input 
                  type="radio" 
                  name="offlineReason" 
                  value={reason} 
                  checked={isSelected}
                  onChange={() => setOfflineReason(reason)}
                  className="hidden"
                />
              </label>
            );
          })}
        </div>
      </div>

      <div className="p-6 border-t border-slate-100">
        <button
          onClick={handleContinueFromReason}
          disabled={!offlineReason}
          className="w-full bg-[#008940] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#007033] text-white font-semibold py-3.5 rounded-2xl transition-all shadow-lg shadow-green-100/50 hover:shadow-xl active:scale-[0.98]"
        >
          Continue
        </button>
      </div>
    </>
  );

  const renderDurationView = () => (
    <>
      <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setFlowStep('reason')}
            className="text-slate-600 hover:text-slate-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h2 className="text-[17px] font-bold text-slate-900 tracking-tight">When will you come back?</h2>
        </div>
        <button 
          onClick={handleCloseModal}
          className="text-slate-400 hover:text-slate-600 transition-colors bg-white rounded-full p-1"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="px-6 py-5 flex-1 overflow-y-auto custom-scrollbar">
        <div className="space-y-2.5">
          {OFFLINE_DURATIONS.map((duration) => {
            const isSelected = offlineDuration === duration;
            const isSpecificDate = duration === 'Specific date & time';
            
            return (
              <label 
                key={duration}
                className={`flex flex-col gap-3 px-4 py-3.5 rounded-[14px] border-[1.5px] transition-all cursor-pointer ${
                  isSelected 
                    ? 'border-[#008940] bg-[#eafceb] bg-opacity-20 text-[#00843d]' 
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex items-center justify-center w-[18px] h-[18px] rounded-full border-[1.5px] shrink-0 ${
                    isSelected ? 'border-[#008940]' : 'border-slate-300 bg-white'
                  }`}>
                    {isSelected && <div className="w-[8px] h-[8px] rounded-full bg-[#008940]"></div>}
                  </div>
                  <span className={`text-[13px] font-semibold ${isSelected ? 'text-[slate-900]' : 'text-slate-700'}`}>
                    {duration}
                  </span>
                  <input 
                    type="radio" 
                    name="offlineDuration" 
                    value={duration} 
                    checked={isSelected}
                    onChange={() => setOfflineDuration(duration)}
                    className="hidden"
                  />
                </div>
                
                {isSelected && isSpecificDate && (
                  <div className="ml-7 mt-2 grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-slate-500 font-bold text-[10px] uppercase">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Select date
                      </div>
                      <input 
                        type="date" 
                        value={customDate}
                        onChange={e => setCustomDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-[#008940] transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-slate-500 font-bold text-[10px] uppercase">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Select time
                      </div>
                      <input 
                        type="time" 
                        value={customTime}
                        onChange={e => setCustomTime(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-[#008940] transition-colors" 
                      />
                    </div>
                  </div>
                )}
              </label>
            );
          })}
        </div>
      </div>

      <div className="p-6 border-t border-slate-100">
        <button
          onClick={handleConfirmOffline}
          disabled={!isDurationValid()}
          className="w-full bg-[#008940] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#007033] text-white font-semibold py-3.5 rounded-2xl transition-all shadow-lg shadow-green-100/50 hover:shadow-xl active:scale-[0.98]"
        >
          Confirm
        </button>
      </div>
    </>
  );

  const renderSuccessView = () => (
    <div className="px-6 pt-6 pb-12 flex flex-col items-center relative h-[380px] justify-center">
      <button 
        onClick={handleCloseModal}
        className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors bg-white rounded-full p-1"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="flex flex-col items-center">
        {/* The checkmark icon from the screenshot */}
        <div className="relative mb-6">
          <div className="w-[88px] h-[88px] rounded-full border-4 border-[#00d050]/20 flex items-center justify-center">
            <div className="w-[70px] h-[70px] rounded-full bg-[#00d050] flex items-center justify-center shadow-lg shadow-[#00d050]/30">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>
        
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Outlet is offline</h2>
        <p className="text-[13px] font-semibold text-slate-500 mt-3 text-center max-w-[260px] leading-relaxed">
          Kindly go online once you are operational and ready to receive orders
        </p>
      </div>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
        <div className="bg-white rounded-[24px] w-full max-w-[460px] shadow-2xl flex flex-col max-h-[90vh]">
          {flowStep === 'list' && renderMainView()}
          {flowStep === 'reason' && renderOfflineReasonView()}
          {flowStep === 'duration' && renderDurationView()}
          {flowStep === 'success' && renderSuccessView()}
        </div>
      </div>
      

    </>
  );
};

export default ManageOutletModal;
