import { useState } from 'react';
import { RestaurantProfile } from '../types';

interface DeliverySettingsFormProps {
  settings: Partial<RestaurantProfile>;
  onSave: (settings: Partial<RestaurantProfile>) => void;
  saving?: boolean;
}

const DeliverySettingsForm = ({ settings: initialSettings, onSave, saving }: DeliverySettingsFormProps) => {
  const [settings, setSettings] = useState(initialSettings);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setSettings((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
    }));
  };

  const toggleRows = [
    {
      id: 'isAcceptingOrders',
      label: 'Accepting New Orders',
      description: 'Toggle to stop accepting new orders temporarily'
    },
    {
      id: 'isAutoAcceptEnabled',
      label: 'Auto Accept Orders',
      description: 'Toggle to automatically accept new orders'
    },
    {
      id: 'isAutoWorkingHoursEnabled',
      label: 'Auto Working Hours',
      description: 'Toggle to automatically set working hours'
    },
    {
      id: 'isPickupEnabled',
      label: 'Enable Pickup',
      description: 'Toggle to enable pickup orders'
    },
    {
      id: 'isDeliveryEnabled',
      label: 'Enable Delivery',
      description: 'Toggle to enable delivery orders'
    }
  ];

  return (
    <div className="space-y-10">
      <h2 className="text-xl font-bold tracking-tight text-slate-900 px-2">Delivery Settings</h2>

      <div className="space-y-8 max-w-2xl">
        {/* Numeric Settings */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2.5">
            <label className="text-sm font-bold text-slate-900">Default Preparation Time (minutes)</label>
            <input
              type="number"
              name="defaultPrepTime"
              value={settings.defaultPrepTime || ''}
              onChange={handleInputChange}
              className="w-full rounded-2xl bg-slate-50 border border-transparent px-5 py-4 text-base font-bold text-slate-900 outline-none transition-all focus:border-slate-100 focus:bg-white focus:shadow-sm"
              placeholder="e.g. 25"
            />
          </div>

          <div className="space-y-2.5">
            <label className="text-sm font-bold text-slate-900">Minimum Order Amount (₹)</label>
            <input
              type="number"
              name="minOrderAmount"
              value={settings.minOrderAmount || ''}
              onChange={handleInputChange}
              className="w-full rounded-2xl bg-slate-50 border border-transparent px-5 py-4 text-base font-bold text-slate-900 outline-none transition-all focus:border-slate-100 focus:bg-white focus:shadow-sm"
              placeholder="e.g. 100"
            />
          </div>
        </div>

        {/* Dropdown Setting */}
        <div className="space-y-2.5">
          <label className="text-sm font-bold text-slate-900">Default Delivery Partner</label>
          <div className="relative">
            <select
              name="defaultDeliveryPartner"
              value={settings.defaultDeliveryPartner || 'Hivago Delivery'}
              onChange={handleInputChange}
              className="w-full appearance-none rounded-2xl bg-slate-50 border border-transparent px-5 py-4 text-base font-bold text-slate-900 outline-none transition-all focus:border-slate-100 focus:bg-white focus:shadow-sm pr-12 cursor-pointer"
            >
              <option value="Hivago Delivery">Hivago Delivery</option>
              <option value="Self Delivery">Self Delivery</option>
              <option value="Dunzo">Dunzo</option>
              <option value="Shadowfax">Shadowfax</option>
            </select>
            <div className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-slate-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <p className="text-xs font-bold text-slate-400 pl-1">Choose the default delivery partner for new orders</p>
        </div>

        {/* Toggle List */}
        <div className="space-y-1 divide-y divide-slate-50">
          {toggleRows.map((row) => {
            const isChecked = !!(settings as any)[row.id];
            return (
              <div key={row.id} className="flex items-center justify-between py-5 first:pt-0 last:pb-0">
                <div className="space-y-1 pr-4">
                  <h4 className="text-base font-bold text-slate-900">{row.label}</h4>
                  <p className="text-xs font-bold text-slate-400">{row.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings(prev => ({ ...prev, [row.id]: !isChecked }))}
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
          onClick={() => onSave(settings)}
          disabled={saving}
          className="rounded-2xl bg-[#AD221F] px-8 py-4 text-base font-bold text-white shadow-xl shadow-red-100 transition-all hover:bg-red-800 hover:shadow-2xl active:scale-95 disabled:opacity-50 disabled:active:scale-100"
        >
          {saving ? 'Saving...' : 'Save Delivery Settings'}
        </button>
      </div>
    </div>
  );
};

export default DeliverySettingsForm;
