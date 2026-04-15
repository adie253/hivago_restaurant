import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface AccountSettingsFormProps {
  onSave: (data: any) => Promise<void>;
  saving?: boolean;
}

const AccountSettingsForm = ({ onSave, saving }: AccountSettingsFormProps) => {
  const { user } = useAuth();
  const [personalInfo, setPersonalInfo] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailAlerts: true,
    smsAlerts: true,
    newOrderSound: true,
    browserNotifications: true,
  });

  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handlePersonalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPersonalInfo(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    if (passwordError) setPasswordError(null);
  };

  const toggleNotification = (key: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }

    try {
      await onSave({ type: 'PASSWORD_CHANGE', ...passwordData });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordError('Failed to change password. Please check your current password.');
    }
  };

  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({ type: 'PROFILE_UPDATE', ...personalInfo });
  };

  const handleNotificationSubmit = async () => {
    await onSave({ type: 'NOTIFICATIONS_UPDATE', notifications: notificationSettings });
  };

  const notificationToggles = [
    { id: 'emailAlerts', label: 'Email Alerts', description: 'Receive daily reports and important account updates' },
    { id: 'smsAlerts', label: 'SMS Alerts', description: 'Get text messages for critical order alerts' },
    { id: 'newOrderSound', label: 'Order Sound', description: 'Play a sound when a new order arrives' },
    { id: 'browserNotifications', label: 'Browser Notifications', description: 'Receive desktop alerts even when the tab is hidden' },
  ];

  return (
    <div className="space-y-12">
      {/* Personal Information */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 px-2">Personal Information</h2>
        <form onSubmit={handleInfoSubmit} className="space-y-6 max-w-2xl">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2.5">
              <label className="text-sm font-bold text-slate-900">Full Name</label>
              <input
                type="text"
                name="name"
                value={personalInfo.name}
                onChange={handlePersonalChange}
                className="w-full rounded-2xl bg-slate-50 border border-transparent px-5 py-4 text-base font-bold text-slate-900 outline-none transition-all focus:border-slate-100 focus:bg-white focus:shadow-sm"
              />
            </div>
            <div className="space-y-2.5">
              <label className="text-sm font-bold text-slate-900">Email Address</label>
              <input
                type="email"
                name="email"
                value={personalInfo.email}
                onChange={handlePersonalChange}
                className="w-full rounded-2xl bg-slate-50 border border-transparent px-5 py-4 text-base font-bold text-slate-900 outline-none transition-all focus:border-slate-100 focus:bg-white focus:shadow-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-2xl bg-[#AD221F] px-8 py-3 text-sm font-bold text-white shadow-xl shadow-red-100 transition-all hover:bg-red-800 hover:shadow-2xl active:scale-95 disabled:opacity-50"
          >
            Update Profile
          </button>
        </form>
      </section>

      {/* Change Password */}
      <section className="space-y-6 pt-10 border-t border-slate-50">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 px-2">Change Password</h2>
        <form onSubmit={handlePasswordSubmit} className="space-y-6 max-w-2xl">
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
              </div>
            </div>
          </div>

          {passwordError && (
            <p className="text-sm font-bold text-rose-600 px-2">{passwordError}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="rounded-2xl bg-[#AD221F] px-8 py-3 text-sm font-bold text-white shadow-xl shadow-red-100 transition-all hover:bg-red-800 hover:shadow-2xl active:scale-95 disabled:opacity-50"
          >
            Update Password
          </button>
        </form>
      </section>

      {/* Notification Preferences */}
      <section className="space-y-6 pt-10 border-t border-slate-50">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 px-2">Notification Preferences</h2>
        <div className="space-y-1 divide-y divide-slate-50 max-w-2xl">
          {notificationToggles.map((row) => {
            const isChecked = (notificationSettings as any)[row.id];
            return (
              <div key={row.id} className="flex items-center justify-between py-5 first:pt-0">
                <div className="space-y-1 pr-4">
                  <h4 className="text-base font-bold text-slate-900">{row.label}</h4>
                  <p className="text-xs font-bold text-slate-400">{row.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleNotification(row.id as any)}
                  className={`relative inline-flex h-6 w-11 flex-none items-center rounded-full transition-colors duration-200 focus:outline-none ${
                    isChecked ? 'bg-emerald-500' : 'bg-slate-200'
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
        </div>
        <button
          onClick={handleNotificationSubmit}
          disabled={saving}
          className="rounded-2xl bg-[#AD221F] px-8 py-3 text-sm font-bold text-white shadow-xl shadow-red-100 transition-all hover:bg-red-800 hover:shadow-2xl active:scale-95 disabled:opacity-50"
        >
          Save Notification Preferences
        </button>
      </section>

      {/* Danger Zone */}
      <section className="space-y-6 pt-10 border-t border-slate-50">
        <h2 className="text-xl font-bold tracking-tight text-rose-600 px-2">Danger Zone</h2>
        <div className="rounded-3xl border border-rose-100 bg-rose-50/50 p-8 max-w-2xl space-y-4">
            <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-900">Deactivate Account</h4>
                <p className="text-sm font-bold text-slate-500 leading-relaxed">
                    Temporarily disable your restaurant's presence on Hivago. You can reactivate it at any time.
                </p>
            </div>
            <button className="rounded-2xl border-2 border-rose-200 bg-white px-6 py-2.5 text-sm font-bold text-rose-600 transition-all hover:bg-rose-600 hover:text-white hover:border-rose-600 active:scale-95">
                Deactivate Account
            </button>
        </div>
      </section>
    </div>
  );
};

export default AccountSettingsForm;
