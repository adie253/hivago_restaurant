import { useState, useEffect } from 'react';
import { NotificationSettings } from '../types';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useChangePassword } from '../hooks/useChangePassword';

interface AccountSettingsFormProps {
  notifications: NotificationSettings;
  onSaveNotifications: (settings: NotificationSettings) => Promise<void>;
  saving?: boolean;
}

const AccountSettingsForm = ({ notifications: initialNotifications, onSaveNotifications, saving }: AccountSettingsFormProps) => {
  const { user } = useAuth();
  const { requestBrowserPermission } = useNotifications();
  const role = user?.role || 'restaurant';
  const isOwner = role === 'owner' || user?.originalRole === 'owner';
  const changePasswordMutation = useChangePassword(role);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(initialNotifications || {
    emailAlerts: true,
    browserNotifications: true,
    orderSound: true,
  });

  useEffect(() => {
    if (initialNotifications) {
      setNotificationSettings(initialNotifications);
    }
  }, [initialNotifications]);

  const [fieldErrors, setFieldErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    setFieldErrors(prev => ({ ...prev, [name]: undefined }));
    setGeneralError(null);
  };

  const toggleNotification = (key: keyof NotificationSettings) => {
    const nextVal = !notificationSettings[key];
    setNotificationSettings(prev => ({ ...prev, [key]: nextVal }));
    if (key === 'browserNotifications' && nextVal) {
      requestBrowserPermission();
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setGeneralError(null);

    // Client-side validations
    let hasError = false;
    const newErrors: typeof fieldErrors = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
      hasError = true;
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required';
      hasError = true;
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters long';
      hasError = true;
    } else if (passwordData.newPassword.length > 128) {
      newErrors.newPassword = 'Password cannot exceed 128 characters';
      hasError = true;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      hasError = true;
    }

    if (hasError) {
      setFieldErrors(newErrors);
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    }, {
      onSuccess: () => {
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      },
      onError: (err) => {
        if (err.fieldErrors) {
          const mappedErrors: typeof fieldErrors = {};
          Object.entries(err.fieldErrors).forEach(([key, messages]) => {
            const lowerKey = key.toLowerCase();
            const message = messages.join(' ');
            if (lowerKey.includes('currentpassword')) {
              mappedErrors.currentPassword = message;
            } else if (lowerKey.includes('newpassword')) {
              mappedErrors.newPassword = message;
            } else {
              setGeneralError(message);
            }
          });
          setFieldErrors(mappedErrors);
        } else {
          setGeneralError(err.message || 'Failed to change password. Please check your current password.');
        }
      }
    });
  };

  const handleNotificationSubmit = async () => {
    await onSaveNotifications(notificationSettings);
  };

  const notificationToggles = [
    { id: 'emailAlerts', label: 'Email Alerts', description: 'Receive daily reports and important account updates via email', comingSoon: false },
    { id: 'orderSound', label: 'Order Sound', description: 'Play a sound when a new order arrives on the dashboard', comingSoon: false },
    { id: 'browserNotifications', label: 'Browser Notifications', description: 'Receive desktop alerts even when the tab is hidden', comingSoon: false },
  ] as const;

  return (
    <div className="space-y-12">
      {/* Change Password */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 px-2">Change Password</h2>
        <form onSubmit={handlePasswordSubmit} className="space-y-6 max-w-2xl bg-white p-8 rounded-[32px] border border-slate-50 shadow-[0_4px_25px_rgba(0,0,0,0.02)]">
          <div className="space-y-6">
            <div className="space-y-2.5">
              <label className="text-sm font-bold text-slate-900">Current Password</label>
              <input
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                required
                className="w-full rounded-2xl bg-slate-50 border border-transparent px-5 py-4 text-base font-bold text-slate-900 outline-none transition-all focus:border-slate-100 focus:bg-white focus:shadow-sm"
                placeholder="••••••••"
              />
              {fieldErrors.currentPassword && (
                <p className="text-xs font-bold text-rose-600 mt-1 px-2">{fieldErrors.currentPassword}</p>
              )}
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2.5">
                <label className="text-sm font-bold text-slate-900">New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                  className="w-full rounded-2xl bg-slate-50 border border-transparent px-5 py-4 text-base font-bold text-slate-900 outline-none transition-all focus:border-slate-100 focus:bg-white focus:shadow-sm"
                  placeholder="••••••••"
                />
                {fieldErrors.newPassword && (
                  <p className="text-xs font-bold text-rose-600 mt-1 px-2">{fieldErrors.newPassword}</p>
                )}
              </div>
              <div className="space-y-2.5">
                <label className="text-sm font-bold text-slate-900">Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                  className="w-full rounded-2xl bg-slate-50 border border-transparent px-5 py-4 text-base font-bold text-slate-900 outline-none transition-all focus:border-slate-100 focus:bg-white focus:shadow-sm"
                  placeholder="••••••••"
                />
                {fieldErrors.confirmPassword && (
                  <p className="text-xs font-bold text-rose-600 mt-1 px-2">{fieldErrors.confirmPassword}</p>
                )}
              </div>
            </div>
          </div>

          {generalError && (
            <p className="text-sm font-bold text-rose-600 px-2">{generalError}</p>
          )}

          <button
            type="submit"
            disabled={saving || changePasswordMutation.isPending}
            className="rounded-2xl bg-[#AD221F] px-8 py-3 text-sm font-bold text-white shadow-xl shadow-red-100 transition-all hover:bg-red-800 hover:shadow-2xl active:scale-95 disabled:opacity-50"
          >
            {changePasswordMutation.isPending ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>
      </section>

      {/* Notification Preferences */}
      <section className="space-y-6 pt-10 border-t border-slate-50">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 px-2">Notification Preferences</h2>
        <div className="space-y-1 divide-y divide-slate-50 max-w-2xl bg-white p-6 rounded-[32px] border border-slate-50 shadow-[0_4px_25px_rgba(0,0,0,0.02)]">
          {notificationToggles.map((row) => {
            const isChecked = !row.comingSoon && notificationSettings[row.id];
            return (
              <div key={row.id} className="flex items-center justify-between py-5 first:pt-0 last:pb-4">
                <div className="space-y-1 pr-4">
                  <div className="flex items-center gap-2.5">
                    <h4 className="text-base font-bold text-slate-900">{row.label}</h4>
                    {row.comingSoon && (
                      <span className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-600 px-2.5 py-0.5 rounded-full border border-amber-200/60">
                        Coming Soon
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-slate-400">{row.description}</p>
                </div>
                <button
                  type="button"
                  disabled={row.comingSoon}
                  onClick={() => !row.comingSoon && toggleNotification(row.id as any)}
                  className={`relative inline-flex h-6 w-11 flex-none items-center rounded-full transition-colors duration-200 focus:outline-none ${
                    row.comingSoon
                      ? 'bg-slate-200 cursor-not-allowed opacity-60'
                      : isChecked
                      ? 'bg-emerald-500'
                      : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                      isChecked ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            );
          })}
          
          <div className="pt-4 mt-2">
            <button
              onClick={handleNotificationSubmit}
              disabled={saving}
              className="rounded-2xl bg-[#AD221F] px-8 py-3 text-sm font-bold text-white shadow-xl shadow-red-100 transition-all hover:bg-red-800 hover:shadow-2xl active:scale-95 disabled:opacity-50 w-full md:w-auto"
            >
              Save Notification Preferences
            </button>
          </div>
        </div>
      </section>


    </div>
  );
};

export default AccountSettingsForm;
