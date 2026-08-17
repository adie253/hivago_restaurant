import { useState } from 'react';
import { useNotifications } from '../context/NotificationContext';

export const NotificationBanner = () => {
  const { permissionStatus, requestBrowserPermission } = useNotifications();
  const [dismissed, setDismissed] = useState(false);
  const [requesting, setRequesting] = useState(false);

  if (dismissed || permissionStatus === 'granted' || permissionStatus === 'unsupported') {
    return null;
  }

  const handleEnable = async () => {
    setRequesting(true);
    try {
      await requestBrowserPermission();
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="mb-6 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 p-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 text-xl font-bold">
            {permissionStatus === 'denied' ? '⚠️' : '🔔'}
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              {permissionStatus === 'denied'
                ? 'Desktop Notifications Blocked in Browser'
                : 'Enable Browser Notifications for Minimized Alerts'}
            </h4>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              {permissionStatus === 'denied'
                ? 'Your browser is blocking notifications. Click the lock icon (🔒) near your address bar and set Notifications to Allow so you never miss an order when minimized.'
                : 'Receive instant desktop popups & loud sound alerts for incoming orders even when your window is minimized or out of focus.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
          {permissionStatus === 'default' && (
            <button
              onClick={handleEnable}
              disabled={requesting}
              className="rounded-xl bg-[#AD221F] px-4 py-2 text-xs font-bold text-white shadow-md shadow-red-100 transition-all hover:bg-red-800 active:scale-95 disabled:opacity-50"
            >
              {requesting ? 'Requesting...' : 'Enable Desktop Alerts'}
            </button>
          )}

          <button
            onClick={() => setDismissed(true)}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-200/50 hover:text-slate-600 transition-colors"
            title="Dismiss notification message"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
