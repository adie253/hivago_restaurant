import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { getOwnerOutlets } from '../api/ownerApi';
import { updateRestaurantAvailability } from '../api/dashboardApi';
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



  if (!isOpen) return null;

  const handleToggle = async (outlet: Outlet) => {
    // Restriction: Since we only have /me/availability, we can only toggle the CURRENT outlet
    // This also prevents owners from calling it with an owner token (which causes 403)
    if (user?.role !== 'restaurant' || user.id !== outlet.id) {
        showToast(`Please switch to ${outlet.name} first to manage its availability`, 'info');
        return;
    }

    if (outlet.status === 'Online') {
      setSelectedOfflineOutlet(outlet);
      setOfflineReason('');
      setOfflineDuration('');
      setFlowStep('reason');
    } else {
      try {
        await updateRestaurantAvailability(true);
        setOutlets(prev => prev.map(o => o.id === outlet.id ? { ...o, status: 'Online' } : o));
        showToast(`${outlet.name} is now online`, 'success');
      } catch (error) {
        showToast(`Failed to update status for ${outlet.name}`, 'error');
      }
    }
  };

  const handleContinueFromReason = () => {
    setFlowStep('duration');
  };

  const handleConfirmOffline = async () => {
    if (selectedOfflineOutlet) {
      try {
        await updateRestaurantAvailability(false);
        setOutlets(prev => prev.map(o => o.id === selectedOfflineOutlet.id ? { ...o, status: 'Offline' } : o));
        
        const durationStr = offlineDuration === 'Specific date & time' ? `${customDate} ${customTime}` : offlineDuration;
        showToast(`Offline: ${offlineReason}. Return: ${durationStr}`, 'info');
        
        setFlowStep('success');
      } catch (error) {
        showToast(`Failed to set ${selectedOfflineOutlet.name} offline`, 'error');
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
    <div className="px-8 pb-8 flex-1 overflow-y-auto custom-scrollbar">
      <div className="bg-[#fff7ed] border border-[#ffedd5] rounded-[16px] p-4 mt-5 mb-6">
        <p className="text-[12px] font-semibold text-[#c2410c] leading-relaxed">
          Your restaurant will be closed from <span className="font-bold">X undefined ()</span> to <span className="font-bold">Y undefined ()</span>
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-[13px] font-semibold text-slate-700">Select a restaurant</label>
          <div className="relative">
            <select className="w-full bg-[#f8fafc] border border-slate-100 focus:border-[#008940] rounded-xl pl-11 pr-10 py-3.5 text-[13px] font-semibold text-slate-700 outline-none appearance-none transition-colors">
              <option value="">Select a restaurant</option>
              {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[13px] font-semibold text-slate-700">Start date</label>
            <input type="date" className="w-full bg-[#f8fafc] border border-slate-100 rounded-xl px-4 py-3.5 text-[13px] font-semibold text-slate-700 outline-none focus:border-[#008940] transition-colors" />
          </div>
          <div className="space-y-2">
            <label className="text-[13px] font-semibold text-slate-700">Start time</label>
            <input type="time" className="w-full bg-[#f8fafc] border border-slate-100 rounded-xl px-4 py-3.5 text-[13px] font-semibold text-slate-700 outline-none focus:border-[#008940] transition-colors" />
          </div>
          <div className="space-y-2">
            <label className="text-[13px] font-semibold text-slate-700">End date</label>
            <input type="date" className="w-full bg-[#f8fafc] border border-slate-100 rounded-xl px-4 py-3.5 text-[13px] font-semibold text-slate-700 outline-none focus:border-[#008940] transition-colors" />
          </div>
          <div className="space-y-2">
            <label className="text-[13px] font-semibold text-slate-700">End time</label>
            <input type="time" className="w-full bg-[#f8fafc] border border-slate-100 rounded-xl px-4 py-3.5 text-[13px] font-semibold text-slate-700 outline-none focus:border-[#008940] transition-colors" />
          </div>
        </div>
      </div>

      <button className="w-full mt-8 bg-[#008940] hover:bg-[#007033] text-white font-semibold py-3.5 rounded-2xl transition-all shadow-lg shadow-green-100/50 hover:shadow-xl active:scale-[0.98]">
        Update
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
