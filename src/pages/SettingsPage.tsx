import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
// import { RestaurantProfile } from '../types';
import { fetchRestaurantProfile, updateRestaurantProfile } from '../api/dashboardApi';
import LoadingState from '../components/LoadingState';
import Toast from '../components/Toast';
import BusinessHoursForm from '../components/BusinessHoursForm';
import DeliverySettingsForm from '../components/DeliverySettingsForm';
import AccountSettingsForm from '../components/AccountSettingsForm';
import RestaurantLogoForm from '../components/RestaurantLogoForm';
import { OpeningHours, RestaurantProfile } from '../types';
import { changePassword, updateAccountSettings, uploadRestaurantLogo } from '../api/dashboardApi';

const tabs = [
  { id: 'business', label: 'Business Information' },
  { id: 'hours', label: 'Business Hours' },
  { id: 'delivery', label: 'Delivery Settings' },
  { id: 'logo', label: 'Restaurant Logo' },
  { id: 'account', label: 'Account Settings' }
];

const SettingsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('business');
  const [profile, setProfile] = useState<RestaurantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const loadProfile = async () => {
      setLoading(true);
      try {
        const data = await fetchRestaurantProfile(user.id);
        setProfile(data);
      } catch (err) {
        console.error('Failed to load profile', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user?.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setProfile((prev) => {
      if (!prev) return null;
      
      let newValue: any = value;
      if (type === 'checkbox') newValue = checked;
      if (name === 'minOrderAmount') newValue = Number(value);
      
      return { ...prev, [name]: newValue };
    });
  };


  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user?.id || !profile) return;

    setSaving(true);
    try {
      await updateRestaurantProfile(user.id, profile);
      setToastMessage('Business Information saved successfully!');
    } catch (err) {
      console.error('Failed to save profile', err);
      setToastMessage('Error saving information. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveHours = async (newHours: OpeningHours) => {
    if (!user?.id || !profile) return;

    setSaving(true);
    try {
      await updateRestaurantProfile(user.id, { openingHours: newHours });
      setProfile({ ...profile, openingHours: newHours });
      setToastMessage('Business Hours saved successfully!');
    } catch (err) {
      console.error('Failed to save hours', err);
      setToastMessage('Error saving hours. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAccount = async (data: any) => {
    if (!user?.id) return;

    setSaving(true);
    try {
      if (data.type === 'PASSWORD_CHANGE') {
        await changePassword(data.currentPassword, data.newPassword);
        setToastMessage('Password updated successfully!');
      } else {
        await updateAccountSettings(data);
        setToastMessage('Account settings saved successfully!');
      }
    } catch (err) {
      console.error('Failed to save account settings', err);
      setToastMessage('Error saving account settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    if (!user?.id) return;

    setSaving(true);
    try {
      const { logoUrl } = await uploadRestaurantLogo(user.id, file);
      setProfile((prev) => (prev ? { ...prev, logoUrl } : null));
      setToastMessage('Logo uploaded successfully!');
    } catch (err) {
      console.error('Failed to upload logo', err);
      setToastMessage('Error uploading logo. Please try again.');
    } finally {
      setSaving(false);
    }
  };



  if (loading) return <LoadingState />;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h1>

      {/* Tabs Navigation */}
      <div className="inline-flex rounded-2xl bg-white p-1.5 shadow-sm">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-xl px-6 py-2.5 text-sm font-bold transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-[#FEF2F2] text-[#AD221F]'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="rounded-[32px] bg-white p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        {activeTab === 'business' ? (
          <form onSubmit={handleSave} className="space-y-10">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Business Information</h2>

            <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
              {/* Restaurant Name */}
              <div className="space-y-2.5">
                <label className="text-sm font-bold text-slate-900">Restaurant Name</label>
                <input
                  type="text"
                  name="name"
                  value={profile?.name || ''}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl bg-slate-50 border border-transparent px-5 py-4 text-base font-bold text-slate-900 outline-none transition-all focus:border-slate-100 focus:bg-white focus:shadow-sm placeholder:text-slate-300"
                  placeholder="Enter restaurant name"
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-2.5">
                <label className="text-sm font-bold text-slate-900">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={profile?.phone || ''}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl bg-slate-50 border border-transparent px-5 py-4 text-base font-bold text-slate-900 outline-none transition-all focus:border-slate-100 focus:bg-white focus:shadow-sm placeholder:text-slate-300"
                  placeholder="+91-0000000000"
                />
              </div>

              {/* Email */}
              <div className="space-y-2.5">
                <label className="text-sm font-bold text-slate-900">Email</label>
                <input
                  type="email"
                  name="email"
                  value={profile?.email || ''}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl bg-slate-50 border border-transparent px-5 py-4 text-base font-bold text-slate-900 outline-none transition-all focus:border-slate-100 focus:bg-white focus:shadow-sm placeholder:text-slate-300"
                  placeholder="contact@restaurant.com"
                />
              </div>

              {/* FSSAI Number */}
              <div className="space-y-2.5">
                <label className="text-sm font-bold text-slate-900">FSSAI Number</label>
                <input
                  type="text"
                  name="fssaiNumber"
                  value={profile?.fssaiNumber || ''}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl bg-slate-50 border border-transparent px-5 py-4 text-base font-bold text-slate-900 outline-none transition-all focus:border-slate-100 focus:bg-white focus:shadow-sm placeholder:text-slate-300"
                  placeholder="12345678901234"
                />
              </div>

              {/* Address */}
              <div className="md:col-span-2 space-y-2.5">
                <label className="text-sm font-bold text-slate-900">Address</label>
                <input
                  type="text"
                  name="address"
                  value={profile?.address || ''}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl bg-slate-50 border border-transparent px-5 py-4 text-base font-bold text-slate-900 outline-none transition-all focus:border-slate-100 focus:bg-white focus:shadow-sm placeholder:text-slate-300"
                  placeholder="Enter full business address"
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2 space-y-2.5">
                <label className="text-sm font-bold text-slate-900">Description</label>
                <textarea
                  name="description"
                  rows={4}
                  value={profile?.description || ''}
                  onChange={handleInputChange}
                  className="w-full resize-none rounded-2xl bg-slate-50 border border-transparent px-5 py-4 text-base font-bold text-slate-900 outline-none transition-all focus:border-slate-100 focus:bg-white focus:shadow-sm placeholder:text-slate-300"
                  placeholder="Write a brief description about your restaurant..."
                />
              </div>

              {/* Operational Flags */}
              <div className="md:col-span-2 grid gap-6 md:grid-cols-2 pt-4 border-t border-slate-50">
                <div className="space-y-2.5">
                  <label className="text-sm font-bold text-slate-900">Minimum Order Amount</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      name="minOrderAmount"
                      value={profile?.minOrderAmount || ''}
                      onChange={handleInputChange}
                      className="w-full rounded-2xl bg-slate-50 border border-transparent pl-10 pr-5 py-4 text-base font-bold text-slate-900 outline-none transition-all focus:border-slate-100 focus:bg-white focus:shadow-sm"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-6 items-end pb-2">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      name="isPureVeg"
                      checked={profile?.isPureVeg || false}
                      onChange={handleInputChange}
                      className="hidden"
                    />
                    <div className={`w-12 h-6 rounded-full transition-all duration-200 relative ${profile?.isPureVeg ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                      <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all duration-200 ${profile?.isPureVeg ? 'translate-x-6' : 'translate-x-0'}`} />
                    </div>
                    <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900">Pure Veg</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      name="isVeganFriendly"
                      checked={profile?.isVeganFriendly || false}
                      onChange={handleInputChange}
                      className="hidden"
                    />
                    <div className={`w-12 h-6 rounded-full transition-all duration-200 relative ${profile?.isVeganFriendly ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                      <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all duration-200 ${profile?.isVeganFriendly ? 'translate-x-6' : 'translate-x-0'}`} />
                    </div>
                    <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900">Vegan Friendly</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      name="hasJainOptions"
                      checked={profile?.hasJainOptions || false}
                      onChange={handleInputChange}
                      className="hidden"
                    />
                    <div className={`w-12 h-6 rounded-full transition-all duration-200 relative ${profile?.hasJainOptions ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                      <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all duration-200 ${profile?.hasJainOptions ? 'translate-x-6' : 'translate-x-0'}`} />
                    </div>
                    <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900">Jain Options</span>
                  </label>
                </div>
              </div>

              {/* Status & Automation */}
              <div className="md:col-span-2 space-y-8 pt-8 border-t border-slate-50">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-900">Status & Automation</h3>
                    <p className="text-sm font-medium text-slate-400">Control how your restaurant operates in real-time</p>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="flex items-center justify-between p-6 rounded-3xl bg-slate-50 border border-slate-50 transition-all hover:bg-white hover:border-slate-100 hover:shadow-sm">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-900">Accepting Orders</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Main restaurant status</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setProfile(prev => prev ? { ...prev, isAcceptingOrders: !prev.isAcceptingOrders } : null)}
                      className={`relative inline-flex h-7 w-12 flex-none items-center rounded-full transition-colors focus:outline-none ${
                        profile?.isAcceptingOrders ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${profile?.isAcceptingOrders ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-6 rounded-3xl bg-slate-50 border border-slate-50 transition-all hover:bg-white hover:border-slate-100 hover:shadow-sm">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-900">Auto Working Hours</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Syncs status to schedule</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setProfile(prev => prev ? { ...prev, isAutoWorkingHoursEnabled: !prev.isAutoWorkingHoursEnabled } : null)}
                      className={`relative inline-flex h-7 w-12 flex-none items-center rounded-full transition-colors focus:outline-none ${
                        profile?.isAutoWorkingHoursEnabled ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${profile?.isAutoWorkingHoursEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-6 rounded-3xl bg-slate-50 border border-slate-50 transition-all hover:bg-white hover:border-slate-100 hover:shadow-sm">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-900">Auto Accept Orders</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Zero manual effort</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setProfile(prev => prev ? { ...prev, isAutoAcceptEnabled: !prev.isAutoAcceptEnabled } : null)}
                      className={`relative inline-flex h-7 w-12 flex-none items-center rounded-full transition-colors focus:outline-none ${
                        profile?.isAutoAcceptEnabled ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${profile?.isAutoAcceptEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  <div className="space-y-2 px-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Default Prep Time</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        name="defaultPrepTime"
                        value={profile?.defaultPrepTime || 25}
                        onChange={handleInputChange}
                        className="w-24 rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-100 border-none"
                      />
                      <span className="text-sm font-bold text-slate-400">minutes</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-[24px] bg-[#AD221F] py-5 text-base font-bold text-white shadow-2xl shadow-red-100 transition-all hover:bg-red-800 hover:shadow-red-200 active:scale-[0.98] disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Update Business Profile'}
            </button>
          </form>
        ) : activeTab === 'hours' && profile?.openingHours ? (
          <BusinessHoursForm 
            hours={profile.openingHours} 
            onSave={handleSaveHours} 
          />
        ) : activeTab === 'delivery' && profile ? (
          <DeliverySettingsForm 
            settings={profile} 
            saving={saving}
            onSave={(newSettings) => {
              setProfile((prev) => (prev ? { ...prev, ...newSettings } : null));
              handleSave(); // Trigger the general save profile as well
              setToastMessage('Delivery Settings saved successfully!');
            }} 
          />
        ) : activeTab === 'account' ? (
          <AccountSettingsForm 
            onSave={handleSaveAccount}
            saving={saving}
          />
        ) : activeTab === 'logo' && profile ? (
          <RestaurantLogoForm 
            currentLogoUrl={profile.logoUrl || ''}
            onUpload={handleLogoUpload}
            uploading={saving}
          />
        ) : (
          <div className="flex h-64 items-center justify-center rounded-[32px] border-2 border-dashed border-slate-100">
            <p className="text-lg font-bold text-slate-400">
              {tabs.find(t => t.id === activeTab)?.label} panel coming soon.
            </p>
          </div>
        )}
      </div>

      {toastMessage && (
        <Toast 
          message={toastMessage} 
          onClose={() => setToastMessage(null)} 
        />
      )}
    </div>
  );
};

export default SettingsPage;
