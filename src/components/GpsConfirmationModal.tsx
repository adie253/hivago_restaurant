import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GpsConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentLat: number | null;
  currentLng: number | null;
  newLat: number;
  newLng: number;
}

const GpsConfirmationModal: React.FC<GpsConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentLat,
  currentLng,
  newLat,
  newLng
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-[480px] overflow-hidden rounded-[32px] bg-white shadow-2xl border border-slate-100 flex flex-col"
          >
            {/* Header */}
            <div className="px-8 pt-8 pb-4 flex items-center justify-between border-b border-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-50 text-[#AD221F] flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">Confirm GPS Location</h2>
                  <p className="text-xs font-medium text-slate-400">New coordinates detected</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-8 space-y-6">
              <p className="text-sm font-bold text-slate-600 leading-relaxed">
                GPS coordinates have been detected. Do you want to update your restaurant location with these new coordinates?
              </p>

              <div className="space-y-4">
                {/* New Detected Coordinates */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Detected Coordinates</span>
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full">GPS Signal</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm font-bold text-slate-800">
                    <div className="bg-white p-3 rounded-xl border border-slate-100">
                      <p className="text-[11px] text-slate-400 font-semibold mb-1">Latitude</p>
                      <p className="font-mono text-slate-900 truncate" title={String(newLat)}>
                        {typeof newLat === 'number' ? Number(newLat.toFixed(6)) : newLat}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-100">
                      <p className="text-[11px] text-slate-400 font-semibold mb-1">Longitude</p>
                      <p className="font-mono text-slate-900 truncate" title={String(newLng)}>
                        {typeof newLng === 'number' ? Number(newLng.toFixed(6)) : newLng}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Current Coordinates if existing */}
                {(currentLat !== null || currentLng !== null) && (
                  <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between text-xs font-medium text-slate-500">
                    <span className="font-bold text-slate-400">Current Values:</span>
                    <span className="font-mono font-bold text-slate-700">
                      {currentLat != null ? Number(currentLat.toFixed(6)) : 'N/A'}, {currentLng != null ? Number(currentLng.toFixed(6)) : 'N/A'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="px-8 py-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="rounded-xl bg-[#AD221F] text-white px-6 py-2.5 text-sm font-bold shadow-md hover:bg-red-800 transition-all active:scale-95 flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                Confirm & Update
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default GpsConfirmationModal;
