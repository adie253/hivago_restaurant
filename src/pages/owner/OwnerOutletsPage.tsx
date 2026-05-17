import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useOutlets, useToggleOutlet, useToggleAllOutlets } from '../../hooks/useOutlets';
import { StatCardSkeleton } from '../../components/Skeletons';
import Toggle from '../../components/Toggle';
import { useToast } from '../../context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import TimeOffModal from '../../components/TimeOffModal';
import ToggleOfflineModal from '../../components/ToggleOfflineModal';
import { useTimeOffs, useCancelTimeOff } from '../../hooks/useTimeOff';

const TimeOffStatus = ({ activeTimeOff, onReopen }: { activeTimeOff?: any; onReopen: () => void }) => {
  if (!activeTimeOff) return null;

  return (
    <div className="mt-2 flex items-center justify-between px-2 py-1 bg-amber-50 rounded-lg border border-amber-100 animate-in fade-in slide-in-from-top-1">
      <div className="flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        <span className="text-[10px] font-bold text-amber-700 uppercase tracking-tight">On Break</span>
      </div>
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onReopen();
        }}
        className="text-[9px] font-bold text-amber-600 hover:text-emerald-600 uppercase tracking-widest transition-colors"
      >
        Reopen
      </button>
    </div>
  );
};

const OutletCard = ({ outlet, onSwitch, onPause }: { outlet: any; onSwitch: (id: string) => void; onPause: (id: string, name: string) => void }) => {
  const { data: timeOffs } = useTimeOffs(outlet.id);
  const cancelTimeOff = useCancelTimeOff(outlet.id);
  const toggleOne = useToggleOutlet();
  const { showToast } = useToast();
  
  const activeTimeOff = timeOffs?.find(t => t.isActive);
  const isDeactivated = !outlet.isActive;
  const isPaused = !!activeTimeOff;
  const isOffline = !outlet.isAcceptingOrders || isPaused;

  const handleReopen = async () => {
    if (!activeTimeOff) return;
    try {
      await cancelTimeOff.mutateAsync(activeTimeOff.id);
      showToast('Restaurant reopened successfully', 'success');
    } catch (err) {
      showToast('Failed to reopen restaurant', 'error');
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.48 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`group bg-white rounded-2xl p-5 border-2 transition-all duration-300 flex flex-col h-full relative overflow-hidden
        ${isDeactivated ? 'border-amber-100 bg-amber-50/20' : isOffline ? 'border-rose-100 bg-rose-50/10 shadow-sm' : 'border-emerald-50 hover:border-emerald-100 shadow-sm'}
      `}
    >
      {/* Slim Status Bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 transition-all duration-300 ${isDeactivated ? 'bg-amber-800' : isOffline ? 'bg-rose-500' : 'bg-emerald-500'}`} />

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-11 h-11 rounded-lg flex items-center justify-center font-bold text-base shrink-0 shadow-sm transition-colors duration-300 ${isDeactivated ? 'bg-amber-100 text-amber-600' : isOffline ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
            {outlet.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <h3 className={`font-bold text-slate-900 text-base transition-colors line-clamp-2 leading-tight tracking-tight ${isDeactivated ? 'group-hover:text-amber-600' : isOffline ? 'group-hover:text-rose-600' : 'group-hover:text-emerald-600'}`}>
              {outlet.name}
            </h3>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[9px] font-bold text-slate-300 uppercase tracking-wider">
                {outlet.rstCode || 'OUTLET'}
              </span>
              <div className="flex items-center gap-0.5 ml-1">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onPause(outlet.id, outlet.name);
                  }}
                  className="p-1 hover:bg-amber-50 rounded-md transition-colors text-slate-400 hover:text-amber-600 group/btn flex items-center gap-1"
                  title="Pause Restaurant"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span className="text-[9px] font-bold uppercase tracking-tighter opacity-0 group-hover/btn:opacity-100 transition-opacity">Pause</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="shrink-0 scale-[0.65] origin-right">
          <Toggle
            checked={!isOffline}
            disabled={isDeactivated || toggleOne.isPending || isPaused}
            onChange={(checked) =>
              toggleOne.mutate({ outletId: outlet.id, isAcceptingOrders: checked })
            }
          />
        </div>
      </div>

      <div className="mb-4 flex-1">
        <p className="text-xs font-semibold text-slate-400 leading-tight line-clamp-2">
          {outlet.addressLine || 'Address missing'}
        </p>

        {isDeactivated && (
          <div className="mt-2 flex items-center gap-1 px-2 py-0.5 bg-amber-50 rounded-md">
            <div className="w-1 h-1 rounded-full bg-amber-500" />
            <span className="text-[8px] font-bold text-amber-700 uppercase">Suspended</span>
          </div>
        )}

        {!isDeactivated && <TimeOffStatus activeTimeOff={activeTimeOff} onReopen={handleReopen} />}
      </div>

      <button
        onClick={() => onSwitch(outlet.id)}
        disabled={isDeactivated}
        className={`w-full font-bold py-2 rounded-lg transition-all duration-200 text-[11px] tracking-wide active:scale-[0.98] disabled:opacity-30
          ${isDeactivated
            ? 'bg-slate-100 text-slate-300'
            : 'bg-slate-900 text-white hover:bg-emerald-600'}
        `}
      >
        Manage
      </button>
    </motion.div>
  );
};

const OwnerOutletsPage = () => {
  const { data: outlets, isLoading, error } = useOutlets();
  const toggleOne = useToggleOutlet();
  const toggleAll = useToggleAllOutlets();
  const { switchOutlet, user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [timeOffModal, setTimeOffModal] = useState<{ isOpen: boolean; id: string; name: string }>({
    isOpen: false,
    id: '',
    name: ''
  });

  const [offlineModal, setOfflineModal] = useState<{ isOpen: boolean; id: string; name: string }>({
    isOpen: false,
    id: '',
    name: ''
  });

  const handleBulk = async (isAcceptingOrders: boolean) => {
    try {
      const result = await toggleAll.mutateAsync(isAcceptingOrders);
      if (result.skippedCount > 0) {
        showToast(`${result.updatedCount} updated, ${result.skippedCount} skipped`, 'info');
      } else {
        showToast(`All outlets set ${isAcceptingOrders ? 'online' : 'offline'}`, 'success');
      }
    } catch (err) {
      showToast('Failed to perform bulk update', 'error');
    }
  };

  const handleSwitch = async (outletId: string) => {
    try {
      await switchOutlet(outletId);
      window.location.href = '/dashboard';
    } catch (err) {
      showToast('Failed to switch outlet', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-[1600px] mx-auto py-8 px-6">
        <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-52 bg-white rounded-2xl animate-pulse border border-slate-100" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto py-8 px-6">
      {/* Compact Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Welcome, <span className="text-emerald-600">{user?.name}</span>
          </h1>
          <p className="text-slate-400 font-semibold text-sm">Managing {outlets?.length || 0} outlets across your network.</p>
        </div>

        <div className="flex items-center gap-3 self-start">
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-100 shadow-sm">
            <button
              onClick={() => handleBulk(true)}
              disabled={toggleAll.isPending}
              className="px-4 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white font-bold text-xs transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              All Online
            </button>
            <button
              onClick={() => handleBulk(false)}
              disabled={toggleAll.isPending}
              className="px-4 py-1.5 rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-900 hover:text-white font-bold text-xs transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              All Offline
            </button>
          </div>

{/* <button
            onClick={() => navigate('/admin/create-restaurant')}
            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-emerald-600 font-bold text-xs shadow-lg shadow-slate-200 flex items-center gap-2 transition-all active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Add Restaurant
          </button> */}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-bold flex items-center gap-3">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.268 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Failed to sync outlets. Please refresh.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence mode="popLayout">
          {outlets?.map((outlet) => (
            <OutletCard 
              key={outlet.id} 
              outlet={outlet} 
              onSwitch={handleSwitch}
              onPause={(id, name) => setTimeOffModal({ isOpen: true, id, name })}
            />
          ))}
        </AnimatePresence>
      </div>

      <TimeOffModal 
        isOpen={timeOffModal.isOpen}
        outletId={timeOffModal.id}
        outletName={timeOffModal.name}
        onClose={() => setTimeOffModal({ ...timeOffModal, isOpen: false })}
      />

      <ToggleOfflineModal 
        isOpen={offlineModal.isOpen}
        outletName={offlineModal.name}
        onClose={() => setOfflineModal({ ...offlineModal, isOpen: false })}
        isLoading={toggleOne.isPending}
        onConfirm={async (reason, duration) => {
          try {
            await toggleOne.mutateAsync({ outletId: offlineModal.id, isAcceptingOrders: false });
            showToast(`${offlineModal.name} is now offline: ${reason}. Return: ${duration}`, 'info');
            setOfflineModal({ ...offlineModal, isOpen: false });
          } catch (err) {
            showToast('Failed to set outlet offline', 'error');
          }
        }}
      />
    </div>
  );
};

export default OwnerOutletsPage;
