import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { SettingsPageSkeleton } from '../components/Skeletons';
import { useToast } from '../context/ToastContext';
import BusinessHoursForm from '../components/BusinessHoursForm';
import DeliverySettingsForm from '../components/DeliverySettingsForm';
import AccountSettingsForm from '../components/AccountSettingsForm';
import RestaurantLogoForm from '../components/RestaurantLogoForm';
import { RestaurantSettings } from '../types';
import { 
  fetchRestaurantSettings, 
  updateProfile, 
  updateDietary, 
  updateOperations, 
  updateHours, 
  updateDelivery, 
  updateNotifications, 
  changePassword, 
  uploadRestaurantLogo 
} from '../api/dashboardApi';

const tabs = [
  { id: 'business', label: 'Business Information' },
  { id: 'hours', label: 'Business Hours' },
  { id: 'delivery', label: 'Delivery Settings' },
  { id: 'logo', label: 'Restaurant Logo' },
  { id: 'account', label: 'Account Settings' }
];

const SettingsPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('business');
  
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [savingSections, setSavingSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        const data = await fetchRestaurantSettings();
        setSettings(data);
      } catch (err) {
        console.error('Failed to load settings', err);
        showToast('Error loading settings from server.', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, [showToast]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings(prev => prev ? { ...prev, profile: { ...prev.profile, [name]: value } } : null);
  };

  const handleDietaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => prev ? { 
      ...prev, 
      dietary: { ...prev.dietary, [name]: type === 'checkbox' ? checked : value } 
    } : null);
  };

  const handleOperationsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => prev ? { 
      ...prev, 
      operations: { ...prev.operations, [name]: type === 'checkbox' ? checked : Number(value) } 
    } : null);
  };

  const saveSection = async (section: string, action: () => Promise<string>, fallbackMsg: string) => {
    setSavingSections(prev => ({ ...prev, [section]: true }));
    try {
      const msg = await action();
      showToast(msg || fallbackMsg, 'success');
    } catch (err: any) {
      console.error(`Failed to save ${section}`, err);
      const errMsg = err?.message || err?.response?.data?.message || `Error saving ${section.replace(/([A-Z])/g, ' $1').toLowerCase()}.`;
      showToast(errMsg, 'error');
    } finally {
      setSavingSections(prev => ({ ...prev, [section]: false }));
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h1>

      <div className="inline-flex overflow-x-auto max-w-full rounded-2xl bg-white p-1.5 shadow-sm scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-xl px-6 py-2.5 text-sm font-bold whitespace-nowrap transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-[#FEF2F2] text-[#AD221F]'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <SettingsPageSkeleton />
      ) : settings ? (
        <div className="rounded-[32px] bg-white p-6 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-50">
          
          {activeTab === 'business' && (
            <div className="space-y-12">
              {/* Profile Settings */}
              <section className="space-y-6">
                <div className="flex items-center justify-between min-w-[200px]">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-slate-900">Basic Information</h2>
                    <p className="text-sm font-medium text-slate-400 mt-1">Publicly visible details about your restaurant</p>
                  </div>
                </div>
                
                <div className="grid gap-x-8 gap-y-6 md:grid-cols-2 bg-slate-50 p-6 sm:p-8 rounded-[24px]">
                  <div className="space-y-2.5">
                    <label className="text-sm font-bold text-slate-900">Restaurant Name</label>
                    <input
                      type="text"
                      name="name"
                      value={settings.profile.name || ''}
                      onChange={handleProfileChange}
                      className="w-full rounded-xl bg-white border border-transparent px-5 py-4 text-base font-bold text-slate-900 outline-none transition-all focus:border-slate-200 focus:shadow-sm"
                    />
                  </div>
                  
                  <div className="space-y-2.5">
                    <label className="text-sm font-bold text-slate-900">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={settings.profile.phone || ''}
                      onChange={handleProfileChange}
                      className="w-full rounded-xl bg-white border border-transparent px-5 py-4 text-base font-bold text-slate-900 outline-none transition-all focus:border-slate-200 focus:shadow-sm"
                    />
                  </div>

                  <div className="space-y-2.5">
                    <label className="text-sm font-bold text-slate-900">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={settings.profile.email || ''}
                      onChange={handleProfileChange}
                      className="w-full rounded-xl bg-white border border-transparent px-5 py-4 text-base font-bold text-slate-900 outline-none transition-all focus:border-slate-200 focus:shadow-sm"
                    />
                  </div>

                  <div className="space-y-2.5">
                    <label className="text-sm font-bold text-slate-900">FSSAI Number</label>
                    <input
                      type="text"
                      name="fssaiNumber"
                      value={settings.profile.fssaiNumber || ''}
                      onChange={handleProfileChange}
                      className="w-full rounded-xl bg-white border border-transparent px-5 py-4 text-base font-bold text-slate-900 outline-none transition-all focus:border-slate-200 focus:shadow-sm"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2.5">
                    <label className="text-sm font-bold text-slate-900">Full Address</label>
                    <input
                      type="text"
                      name="addressLine"
                      value={settings.profile.addressLine || ''}
                      onChange={handleProfileChange}
                      className="w-full rounded-xl bg-white border border-transparent px-5 py-4 text-base font-bold text-slate-900 outline-none transition-all focus:border-slate-200 focus:shadow-sm"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2.5">
                    <label className="text-sm font-bold text-slate-900">Restaurant Description</label>
                    <textarea
                      name="description"
                      rows={3}
                      value={settings.profile.description || ''}
                      onChange={handleProfileChange}
                      className="w-full resize-none rounded-xl bg-white border border-transparent px-5 py-4 text-base font-medium text-slate-900 outline-none transition-all focus:border-slate-200 focus:shadow-sm"
                    />
                  </div>

                  <div className="md:col-span-2 pt-2">
                    <button
                      onClick={() => saveSection('profile', () => updateProfile(settings.profile), 'Basic Information saved!')}
                      disabled={savingSections['profile']}
                      className="rounded-2xl bg-[#AD221F] px-8 py-3 text-sm font-bold text-white shadow-lg shadow-red-100 transition-all hover:bg-red-800 hover:shadow-xl active:scale-95 disabled:opacity-50"
                    >
                      {savingSections['profile'] ? 'Saving...' : 'Save Profile'}
                    </button>
                  </div>
                </div>
              </section>

              {/* Dietary Settings */}
              <section className="space-y-6">
                <div className="flex items-center justify-between min-w-[200px]">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-slate-900">Dietary Profile</h2>
                    <p className="text-sm font-medium text-slate-400 mt-1">Classify your restaurant's dietary offerings</p>
                  </div>
                </div>
                
                <div className="bg-slate-50 p-6 sm:p-8 rounded-[24px] space-y-8">
                  <div className="space-y-4">
                    <label className="text-sm font-bold text-slate-900">Restaurant Type (Radio)</label>
                    <div className="flex flex-wrap gap-4">
                      {['PureVeg', 'PureNonVeg', 'Both'].map(type => (
                        <label key={type} className={`flex items-center gap-3 px-5 py-3 rounded-xl border-2 transition-all cursor-pointer ${settings.dietary.dietaryType === type ? 'border-[#AD221F] bg-red-50/20' : 'border-transparent bg-white shadow-sm hover:border-slate-200'}`}>
                          <input
                            type="radio"
                            name="dietaryType"
                            value={type}
                            checked={settings.dietary.dietaryType === type}
                            onChange={handleDietaryChange}
                            className="hidden"
                          />
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${settings.dietary.dietaryType === type ? 'border-[#AD221F]' : 'border-slate-300'}`}>
                            {settings.dietary.dietaryType === type && <div className="w-2 h-2 rounded-full bg-[#AD221F]" />}
                          </div>
                          <span className="text-sm font-bold text-slate-900">
                            {type === 'PureVeg' ? 'Pure Veg' : type === 'PureNonVeg' ? 'Pure Non-Veg' : 'Both (Mixed)'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-slate-200/50">
                    <label className="text-sm font-bold text-slate-900">Additional Labels (Checkboxes)</label>
                    <div className="flex flex-wrap gap-6">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          name="isVeganFriendly"
                          checked={settings.dietary.isVeganFriendly}
                          onChange={handleDietaryChange}
                          className="hidden"
                        />
                        <div className={`w-11 h-6 rounded-full transition-all duration-200 relative ${settings.dietary.isVeganFriendly ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                          <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all duration-200 ${settings.dietary.isVeganFriendly ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                        <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900">Vegan Friendly</span>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          name="hasJainOptions"
                          checked={settings.dietary.hasJainOptions}
                          onChange={handleDietaryChange}
                          className="hidden"
                        />
                        <div className={`w-11 h-6 rounded-full transition-all duration-200 relative ${settings.dietary.hasJainOptions ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                          <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all duration-200 ${settings.dietary.hasJainOptions ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                        <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900">Has Jain Options</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <button
                      onClick={() => saveSection('dietary', () => updateDietary(settings.dietary), 'Dietary settings saved!')}
                      disabled={savingSections['dietary']}
                      className="rounded-2xl bg-[#AD221F] px-8 py-3 text-sm font-bold text-white shadow-lg shadow-red-100 transition-all hover:bg-red-800 hover:shadow-xl active:scale-95 disabled:opacity-50"
                    >
                      {savingSections['dietary'] ? 'Saving...' : 'Save Dietary Settings'}
                    </button>
                  </div>
                </div>
              </section>

              {/* Operations Settings */}
              <section className="space-y-6">
                <div className="flex items-center justify-between min-w-[200px]">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-slate-900">Operations</h2>
                    <p className="text-sm font-medium text-slate-400 mt-1">Control order flow and automation</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-6 sm:p-8 rounded-[24px] grid gap-6 md:grid-cols-2">
                  <div className="space-y-2.5">
                    <label className="text-sm font-bold text-slate-900">Average Preparation Time</label>
                    <div className="relative">
                      <input
                        type="number"
                        name="avgPrepTimeMins"
                        value={settings.operations.avgPrepTimeMins}
                        onChange={handleOperationsChange}
                        className="w-full rounded-xl bg-white border border-transparent px-5 py-4 text-base font-bold text-slate-900 outline-none transition-all focus:border-slate-200 focus:shadow-sm"
                      />
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">min</span>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <label className="text-sm font-bold text-slate-900">Min Order Amount</label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₹</span>
                      <input
                        type="number"
                        name="minOrderAmount"
                        value={settings.operations.minOrderAmount}
                        onChange={handleOperationsChange}
                        className="w-full rounded-xl bg-white border border-transparent pl-9 pr-5 py-4 text-base font-bold text-slate-900 outline-none transition-all focus:border-slate-200 focus:shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-5 rounded-2xl bg-white border border-transparent shadow-sm">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-900">Accepting Orders</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Main restaurant status</p>
                    </div>
                    <label className="relative inline-flex h-7 w-12 flex-none items-center rounded-full transition-colors cursor-pointer" style={{ backgroundColor: settings.operations.isAcceptingOrders ? '#10B981' : '#CBD5E1' }}>
                      <input type="checkbox" name="isAcceptingOrders" checked={settings.operations.isAcceptingOrders} onChange={handleOperationsChange} className="hidden" />
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${settings.operations.isAcceptingOrders ? 'translate-x-6' : 'translate-x-1'}`} />
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-5 rounded-2xl bg-white border border-transparent shadow-sm">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-900">Auto Accept Orders</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Zero manual effort</p>
                    </div>
                    <label className="relative inline-flex h-7 w-12 flex-none items-center rounded-full transition-colors cursor-pointer" style={{ backgroundColor: settings.operations.autoAcceptOrders ? '#10B981' : '#CBD5E1' }}>
                      <input type="checkbox" name="autoAcceptOrders" checked={settings.operations.autoAcceptOrders} onChange={handleOperationsChange} className="hidden" />
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${settings.operations.autoAcceptOrders ? 'translate-x-6' : 'translate-x-1'}`} />
                    </label>
                  </div>

                  <div className="md:col-span-2 pt-4">
                    <button
                      onClick={() => saveSection('operations', () => updateOperations(settings.operations), 'Operations updated!')}
                      disabled={savingSections['operations']}
                      className="rounded-2xl bg-[#AD221F] px-8 py-3 text-sm font-bold text-white shadow-lg shadow-red-100 transition-all hover:bg-red-800 hover:shadow-xl active:scale-95 disabled:opacity-50"
                    >
                      {savingSections['operations'] ? 'Saving...' : 'Save Operations Settings'}
                    </button>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'hours' && (
            <BusinessHoursForm 
              hours={settings.hours} 
              onSave={async (newHours) => {
                setSettings({ ...settings, hours: newHours });
                await saveSection('hours', () => updateHours(newHours), 'Business hours saved!');
              }} 
              saving={savingSections['hours']}
            />
          )}

          {activeTab === 'delivery' && (
            <DeliverySettingsForm 
              settings={settings.delivery}
              saving={savingSections['delivery']}
              onSave={async (newSettings) => {
                setSettings({ ...settings, delivery: newSettings });
                await saveSection('delivery', () => updateDelivery(newSettings), 'Delivery settings saved!');
              }} 
            />
          )}

          {activeTab === 'account' && (
            <AccountSettingsForm 
              notifications={settings.notifications}
              onSavePassword={async (current, newPass) => {
                const msg = await changePassword(current, newPass);
                showToast(msg || 'Password changed successfully', 'success');
              }}
              onSaveNotifications={async (newNotifs) => {
                setSettings({ ...settings, notifications: newNotifs });
                await saveSection('notifications', () => updateNotifications(newNotifs), 'Notification preferences saved!');
              }}
              saving={savingSections['notifications']}
            />
          )}

          {activeTab === 'logo' && (
            <RestaurantLogoForm 
              currentLogoUrl={settings.profile.logoUrl || ''}
              onUpload={async (file) => {
                if (!user?.id) return;
                setSavingSections(prev => ({ ...prev, logo: true }));
                try {
                    const response = await uploadRestaurantLogo(user.id, file);
                    console.log('Upload response:', response);
                    
                    // The backend might return the URL as a string or an object with a different key
                    const logoUrl = typeof response === 'string' ? response : (response.logoUrl || response.url || Object.values(response)[0]);
                    
                    if (logoUrl && typeof logoUrl === 'string') {
                        setSettings(prev => prev ? { ...prev, profile: { ...prev.profile, logoUrl } } : null);
                        showToast('Logo updated successfully!', 'success');
                    } else {
                        console.error('Could not find logoUrl in response:', response);
                        showToast('Logo uploaded, but failed to refresh UI.', 'success');
                    }
                } catch (err) {
                    console.error('Logo upload failed:', err);
                    showToast('Failed to upload logo. Please try again.', 'error');
                } finally {
                    setSavingSections(prev => ({ ...prev, logo: false }));
                }
              }}
              uploading={savingSections['logo'] || false}
            />
          )}
        </div>
      ) : (
        <div className="flex h-[400px] items-center justify-center rounded-[32px] border-2 border-dashed border-slate-100 bg-white">
          <p className="text-lg font-bold text-slate-400">Unable to load settings data.</p>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
