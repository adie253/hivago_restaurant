import { useState } from 'react';
import { DeliverySettings } from '../types';

interface DeliverySettingsFormProps {
  settings: DeliverySettings;
  onSave: (settings: DeliverySettings) => void;
  saving?: boolean;
}

const DeliverySettingsForm = ({ settings: initialSettings, onSave, saving }: DeliverySettingsFormProps) => {
  const [settings, setSettings] = useState<DeliverySettings>(initialSettings || { deliveryMode: 'Hivago', acceptsPickup: false });


  return (
    <div className="space-y-10">
      <h2 className="text-xl font-bold tracking-tight text-slate-900 px-2">Delivery Settings</h2>

      <div className="space-y-8 max-w-2xl bg-white p-6 rounded-3xl border border-slate-50">
        <div className="space-y-4">
          <label className="text-sm font-bold text-slate-900">Fulfillment Mode</label>
          <div className="flex flex-col gap-4">
            <label className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${settings.deliveryMode === 'Hivago' ? 'border-[#AD221F] bg-red-50/30' : 'border-slate-100'}`}>
              <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-slate-300">
                {settings.deliveryMode === 'Hivago' && <div className="h-2.5 w-2.5 rounded-full bg-[#AD221F]" />}
              </div>
              <input 
                type="radio" 
                name="deliveryMode" 
                value="Hivago"
                checked={settings.deliveryMode === 'Hivago'}
                onChange={() => setSettings(prev => ({ ...prev, deliveryMode: 'Hivago' }))} 
                className="hidden" 
              />
              <div>
                <p className="text-sm font-bold text-slate-900">Hivago Delivery (Recommended)</p>
                <p className="text-xs font-bold text-slate-400">Let Hivago's fleet handle the delivery</p>
              </div>
            </label>

            <label className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${settings.deliveryMode === 'SelfDelivery' ? 'border-[#AD221F] bg-red-50/30' : 'border-slate-100'}`}>
              <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-slate-300">
                {settings.deliveryMode === 'SelfDelivery' && <div className="h-2.5 w-2.5 rounded-full bg-[#AD221F]" />}
              </div>
              <input 
                type="radio" 
                name="deliveryMode" 
                value="SelfDelivery"
                checked={settings.deliveryMode === 'SelfDelivery'}
                onChange={() => setSettings(prev => ({ ...prev, deliveryMode: 'SelfDelivery' }))} 
                className="hidden" 
              />
              <div>
                <p className="text-sm font-bold text-slate-900">Self Delivery</p>
                <p className="text-xs font-bold text-slate-400">Manage deliveries with your own staff</p>
              </div>
            </label>
          </div>
        </div>
        
        <div className="pt-8 border-t border-slate-50 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-900">Pickup orders</p>
            <p className="text-xs font-bold text-slate-400">Contact Hivago support to change this setting.</p>
          </div>
          <div className={`px-5 py-2.5 rounded-2xl text-sm font-black transition-all ${settings.acceptsPickup ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
            {settings.acceptsPickup ? 'ENABLED' : 'DISABLED'}
          </div>
        </div>


        <button
          onClick={() => onSave(settings)}
          disabled={saving}
          className="rounded-2xl bg-[#AD221F] px-8 py-4 text-base font-bold text-white shadow-xl shadow-red-100 transition-all hover:bg-red-800 hover:shadow-2xl active:scale-95 disabled:opacity-50 disabled:active:scale-100 w-full md:w-auto"
        >
          {saving ? 'Saving...' : 'Save Delivery Settings'}
        </button>
      </div>
    </div>
  );
};

export default DeliverySettingsForm;
