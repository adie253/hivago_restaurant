import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { SettingsPageSkeleton } from '../components/Skeletons';
import { useToast } from '../context/ToastContext';
import BusinessHoursForm from '../components/BusinessHoursForm';
import DeliverySettingsForm from '../components/DeliverySettingsForm';
import AccountSettingsForm from '../components/AccountSettingsForm';
import RestaurantLogoForm from '../components/RestaurantLogoForm';
import { RestaurantSettings } from '../types';
import MapPickerModal from '../components/MapPickerModal';
import GpsConfirmationModal from '../components/GpsConfirmationModal';
import { 
  fetchRestaurantSettings, 
  updateProfile, 
  updateDietary, 
  updateOperations, 
  updateHours, 
  updateDelivery, 
  updateNotifications, 
  changePassword, 
  uploadRestaurantLogo,
  updateRestaurantAvailability
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
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [detectedCoords, setDetectedCoords] = useState<{ lat: number; lng: number } | null>(null);

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

  const handleLocationChange = (name: 'latitude' | 'longitude', value: string) => {
    const parsed = value === '' ? null : Number(value);
    setSettings(prev => prev ? {
      ...prev,
      profile: { ...prev.profile, [name]: Number.isNaN(parsed) ? null : parsed }
    } : null);
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.', 'error');
      return;
    }
    setIsDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsDetectingGps(false);
        setDetectedCoords({
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6))
        });
      },
      (error) => {
        setIsDetectingGps(false);
        console.error('Error getting location', error);
        showToast('Unable to retrieve location. Please grant permission or enter manually.', 'error');
      }
    );
  };

  const fetchAddressFromCoords = async (lat: number, lng: number): Promise<string | null> => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, {
        headers: {
          'Accept-Language': 'en-US,en'
        }
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data?.display_name || null;
    } catch (err) {
      console.error('Failed to reverse geocode address:', err);
      return null;
    }
  };

  const handleConfirmGps = async () => {
    if (!detectedCoords) return;
    const lat = detectedCoords.lat;
    const lng = detectedCoords.lng;

    setSettings(prev => prev ? {
      ...prev,
      profile: {
        ...prev.profile,
        latitude: lat,
        longitude: lng
      }
    } : null);

    setDetectedCoords(null);
    showToast('GPS coordinates updated successfully!', 'success');

    const address = await fetchAddressFromCoords(lat, lng);
    if (address) {
      setSettings(prev => prev ? {
        ...prev,
        profile: {
          ...prev.profile,
          addressLine: address
        }
      } : null);
      showToast('Address updated automatically based on GPS location!', 'info');
    }
  };

  const handleLocationBlur = async () => {
    if (settings?.profile.latitude && settings?.profile.longitude) {
      const address = await fetchAddressFromCoords(settings.profile.latitude, settings.profile.longitude);
      if (address) {
        setSettings(prev => prev ? {
          ...prev,
          profile: {
            ...prev.profile,
            addressLine: address
          }
        } : null);
        showToast('Address updated based on coordinates!', 'info');
      }
    }
  };

  const handleDietaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => {
      if (!prev) return null;
      const newDietary = { ...prev.dietary, [name]: type === 'checkbox' ? checked : value };
      
      // Auto sync isPureVeg when dietaryType changes
      if (name === 'dietaryType') {
        newDietary.isPureVeg = value === 'PureVeg';
      }
      // Auto sync dietaryType when isPureVeg changes
      if (name === 'isPureVeg') {
        if (checked) {
          newDietary.dietaryType = 'PureVeg';
        } else if (newDietary.dietaryType === 'PureVeg') {
          newDietary.dietaryType = 'Both';
        }
      }
      
      return { ...prev, dietary: newDietary };
    });
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

                  <div className="space-y-2.5">
                    <label className="text-sm font-bold text-slate-900">Latitude</label>
                    <input
                      type="text"
                      name="latitude"
                      inputMode="decimal"
                      placeholder="e.g. 18.58278"
                      value={settings.profile.latitude ?? ''}
                      onBlur={handleLocationBlur}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.-]/g, '');
                        const parts = val.split('.');
                        let clean = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : val;
                        if (clean.lastIndexOf('-') > 0) {
                          clean = clean.charAt(0) === '-' ? '-' + clean.replace(/-/g, '') : clean.replace(/-/g, '');
                        }
                        handleLocationChange('latitude', clean);
                      }}
                      className="w-full rounded-xl bg-white border border-transparent px-5 py-4 text-base font-bold text-slate-900 outline-none transition-all focus:border-slate-200 focus:shadow-sm"
                    />
                  </div>

                  <div className="space-y-2.5">
                    <label className="text-sm font-bold text-slate-900">Longitude</label>
                    <input
                      type="text"
                      name="longitude"
                      inputMode="decimal"
                      placeholder="e.g. 73.98157"
                      value={settings.profile.longitude ?? ''}
                      onBlur={handleLocationBlur}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.-]/g, '');
                        const parts = val.split('.');
                        let clean = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : val;
                        if (clean.lastIndexOf('-') > 0) {
                          clean = clean.charAt(0) === '-' ? '-' + clean.replace(/-/g, '') : clean.replace(/-/g, '');
                        }
                        handleLocationChange('longitude', clean);
                      }}
                      className="w-full rounded-xl bg-white border border-transparent px-5 py-4 text-base font-bold text-slate-900 outline-none transition-all focus:border-slate-200 focus:shadow-sm"
                    />
                  </div>

                  <div className="md:col-span-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-900">Set Map Location</p>
                      <p className="text-xs font-bold text-slate-400">Pinpoint your exact restaurant coordinates on the map or detect via GPS</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={detectLocation}
                        disabled={isDetectingGps}
                        className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        {isDetectingGps ? (
                          <div className="w-4 h-4 border-2 border-slate-400 border-t-[#AD221F] rounded-full animate-spin"></div>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                          </svg>
                        )}
                        {isDetectingGps ? 'Detecting...' : 'Use GPS'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setMapModalOpen(true)}
                        className="rounded-xl bg-[#AD221F] text-white px-5 py-2.5 text-sm font-bold shadow-md hover:bg-red-800 transition-colors flex items-center gap-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.446 1.202-.601a2.25 2.25 0 0 1 2.013 0l1.203.601c.751.375 1.604-.216 1.57-.104L21 6.75a2.25 2.25 0 0 0-2.404-2.24l-1.393.14a2.24 2.24 0 0 1-1.37-.36L14.503 3.04a2.25 2.25 0 0 0-2.01 0L10.366 4.14a2.24 2.24 0 0 1-1.37.36L7.14 4.34a2.25 2.25 0 0 0-2.404 2.24l-.173 11.75c-.03.112.82.703 1.57.328l1.202-.601a2.25 2.25 0 0 1 2.013 0l1.202.601c.751.375 1.604-.216 1.57-.104Z" />
                        </svg>
                        Select on Map
                      </button>
                    </div>
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
                          name="isPureVeg"
                          checked={settings.dietary.isPureVeg}
                          onChange={handleDietaryChange}
                          className="hidden"
                        />
                        <div className={`w-11 h-6 rounded-full transition-all duration-200 relative ${settings.dietary.isPureVeg ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                          <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all duration-200 ${settings.dietary.isPureVeg ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                        <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900">Is Pure Veg</span>
                      </label>

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

                  <div className="space-y-4 pt-6 border-t border-slate-200/50">
                    <label className="text-sm font-bold text-slate-900">Cuisine Types</label>
                    
                    {/* Current Cuisine Tags */}
                    <div className="flex flex-wrap gap-2">
                      {(!settings.dietary.cuisineTypes || settings.dietary.cuisineTypes.length === 0) ? (
                        <p className="text-xs font-semibold text-slate-400">No cuisines selected yet. Add some below!</p>
                      ) : (
                        settings.dietary.cuisineTypes.map((cuisine) => (
                          <span 
                            key={cuisine}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-sm font-bold text-slate-700"
                          >
                            {cuisine}
                            <button
                              type="button"
                              onClick={() => {
                                setSettings(prev => prev ? {
                                  ...prev,
                                  dietary: {
                                    ...prev.dietary,
                                    cuisineTypes: (prev.dietary.cuisineTypes || []).filter(c => c !== cuisine)
                                  }
                                } : null);
                              }}
                              className="w-4 h-4 rounded-full flex items-center justify-center bg-slate-200 text-slate-500 hover:bg-slate-300 hover:text-slate-800 transition-colors text-xs font-black"
                            >
                              ×
                            </button>
                          </span>
                        ))
                      )}
                    </div>

                    {/* Cuisine Input */}
                    <div className="flex gap-2 max-w-md">
                      <input
                        type="text"
                        placeholder="Add a custom cuisine (e.g. Italian, Thai)..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = e.currentTarget.value.trim();
                            const currentCuisines = settings.dietary.cuisineTypes || [];
                            if (val && !currentCuisines.includes(val)) {
                              setSettings(prev => prev ? {
                                ...prev,
                                dietary: {
                                  ...prev.dietary,
                                  cuisineTypes: [...(prev.dietary.cuisineTypes || []), val]
                                }
                              } : null);
                              e.currentTarget.value = '';
                            }
                          }
                        }}
                        className="flex-1 rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-slate-300"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          const inputEl = e.currentTarget.previousElementSibling as HTMLInputElement;
                          const val = inputEl.value.trim();
                          const currentCuisines = settings.dietary.cuisineTypes || [];
                          if (val && !currentCuisines.includes(val)) {
                            setSettings(prev => prev ? {
                              ...prev,
                              dietary: {
                                ...prev.dietary,
                                cuisineTypes: [...(prev.dietary.cuisineTypes || []), val]
                              }
                            } : null);
                            inputEl.value = '';
                          }
                        }}
                        className="px-4 py-2.5 bg-slate-800 text-white text-sm font-bold rounded-xl hover:bg-slate-900 transition-colors"
                      >
                        Add
                      </button>
                    </div>

                    {/* Popular Cuisines Recommendations */}
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Popular Cuisines</p>
                      <div className="flex flex-wrap gap-2">
                        {['North Indian', 'South Indian', 'Chinese', 'Biryani', 'Pizza', 'Fast Food', 'Burgers', 'Mughlai', 'Desserts', 'Beverages'].map((cuisine) => {
                          const currentCuisines = settings.dietary.cuisineTypes || [];
                          const isSelected = currentCuisines.includes(cuisine);
                          return (
                            <button
                              key={cuisine}
                              type="button"
                              onClick={() => {
                                setSettings(prev => {
                                  if (!prev) return null;
                                  const list = prev.dietary.cuisineTypes || [];
                                  const newList = isSelected ? list.filter(c => c !== cuisine) : [...list, cuisine];
                                  return {
                                    ...prev,
                                    dietary: { ...prev.dietary, cuisineTypes: newList }
                                  };
                                });
                              }}
                              className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                                isSelected 
                                  ? 'bg-[#AD221F]/10 border-[#AD221F] text-[#AD221F]' 
                                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                              }`}
                            >
                              {isSelected ? `✓ ${cuisine}` : `+ ${cuisine}`}
                            </button>
                          );
                        })}
                      </div>
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
                        type="text"
                        name="avgPrepTimeMins"
                        inputMode="numeric"
                        value={settings.operations.avgPrepTimeMins}
                        onChange={e => {
                          e.target.value = e.target.value.replace(/\D/g, '');
                          handleOperationsChange(e);
                        }}
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
                        type="text"
                        name="minOrderAmount"
                        inputMode="decimal"
                        value={settings.operations.minOrderAmount}
                        onChange={e => {
                          const val = e.target.value.replace(/[^0-9.]/g, '');
                          const parts = val.split('.');
                          e.target.value = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : val;
                          handleOperationsChange(e);
                        }}
                        className="w-full rounded-xl bg-white border border-transparent pl-9 pr-5 py-4 text-base font-bold text-slate-900 outline-none transition-all focus:border-slate-200 focus:shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Commission Flat Fee and Commission Percentage hidden for now */}
                  {/*
                  <div className="space-y-2.5">
                    <label className="text-sm font-bold text-slate-900">Commission Flat Fee</label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₹</span>
                      <input
                        type="text"
                        name="commissionFlatFee"
                        inputMode="decimal"
                        value={settings.operations.commissionFlatFee ?? ''}
                        onChange={e => {
                          const val = e.target.value.replace(/[^0-9.]/g, '');
                          const parts = val.split('.');
                          e.target.value = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : val;
                          handleOperationsChange(e);
                        }}
                        className="w-full rounded-xl bg-white border border-transparent pl-9 pr-5 py-4 text-base font-bold text-slate-900 outline-none transition-all focus:border-slate-200 focus:shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <label className="text-sm font-bold text-slate-900">Commission Percentage</label>
                    <div className="relative">
                      <input
                        type="text"
                        name="commissionPercentage"
                        inputMode="decimal"
                        value={settings.operations.commissionPercentage ?? ''}
                        onChange={e => {
                          const val = e.target.value.replace(/[^0-9.]/g, '');
                          const parts = val.split('.');
                          e.target.value = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : val;
                          handleOperationsChange(e);
                        }}
                        className="w-full rounded-xl bg-white border border-transparent px-5 py-4 text-base font-bold text-slate-900 outline-none transition-all focus:border-slate-200 focus:shadow-sm"
                      />
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">%</span>
                    </div>
                  </div>
                  */}

                  <div className="flex items-center justify-between p-5 rounded-2xl bg-white border border-transparent shadow-sm">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-900">Restaurant Active Status</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">On/Off platform visibility</p>
                    </div>
                    <label className="relative inline-flex h-7 w-12 flex-none items-center rounded-full transition-colors cursor-pointer" style={{ backgroundColor: settings.operations.isActive ? '#10B981' : '#CBD5E1' }}>
                      <input type="checkbox" name="isActive" checked={settings.operations.isActive} onChange={handleOperationsChange} className="hidden" />
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${settings.operations.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-5 rounded-2xl bg-white border border-transparent shadow-sm">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-900">Availability</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Main restaurant status (Accepting Orders)</p>
                    </div>
                    <label className="relative inline-flex h-7 w-12 flex-none items-center rounded-full transition-colors cursor-pointer" style={{ backgroundColor: settings.operations.isAcceptingOrders ? '#10B981' : '#CBD5E1' }}>
                      <input
                        type="checkbox"
                        name="isAcceptingOrders"
                        checked={settings.operations.isAcceptingOrders}
                        onChange={async (e) => {
                          const checked = e.target.checked;
                          handleOperationsChange(e);
                          try {
                            await updateRestaurantAvailability(checked);
                            showToast(`Restaurant availability updated: ${checked ? 'Online' : 'Offline'}`, 'info');
                          } catch (err: any) {
                            console.error('Failed to update availability:', err);
                            showToast(err?.response?.data?.message || 'Failed to update availability', 'error');
                          }
                        }}
                        className="hidden"
                      />
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
                      onClick={() => saveSection('operations', async () => {
                        await updateOperations(settings.operations);
                        await updateRestaurantAvailability(settings.operations.isAcceptingOrders);
                        return 'Operations settings saved!';
                      }, 'Operations updated!')}
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
                    
                    const responseAny = response as any;
                    const logoUrl = typeof responseAny === 'string' ? responseAny : (responseAny.logoUrl || responseAny.url || Object.values(responseAny)[0]);
                    
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

      {settings && (
        <>
          <MapPickerModal
            isOpen={mapModalOpen}
            onClose={() => setMapModalOpen(false)}
            initialLat={settings.profile.latitude}
            initialLng={settings.profile.longitude}
            onConfirm={async (lat, lng) => {
              const roundedLat = Number(lat.toFixed(6));
              const roundedLng = Number(lng.toFixed(6));

              setSettings(prev => prev ? {
                ...prev,
                profile: {
                  ...prev.profile,
                  latitude: roundedLat,
                  longitude: roundedLng
                }
              } : null);

              showToast('Map location updated!', 'success');

              const address = await fetchAddressFromCoords(roundedLat, roundedLng);
              if (address) {
                setSettings(prev => prev ? {
                  ...prev,
                  profile: {
                    ...prev.profile,
                    addressLine: address
                  }
                } : null);
                showToast('Address updated automatically from map pin!', 'info');
              }
            }}
          />
          <GpsConfirmationModal
            isOpen={!!detectedCoords}
            onClose={() => setDetectedCoords(null)}
            onConfirm={handleConfirmGps}
            currentLat={settings.profile.latitude}
            currentLng={settings.profile.longitude}
            newLat={detectedCoords?.lat ?? 0}
            newLng={detectedCoords?.lng ?? 0}
          />
        </>
      )}
    </div>
  );
};

export default SettingsPage;
