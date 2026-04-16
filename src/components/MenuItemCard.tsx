import { MenuItem } from '../types';
import { formatCurrency } from '../utils/format';

interface MenuItemCardProps {
  item: MenuItem;
  onToggle: (id: string, available: boolean) => void;
}

const MenuItemCard = ({ item, onToggle }: MenuItemCardProps) => {
  return (
    <div className={`flex items-center justify-between rounded-[28px] p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] ${
      item.isAvailable ? 'bg-white' : 'bg-slate-50/50 opacity-75'
    }`}>
      <div className="flex items-center gap-4">
        {/* Image Section */}
        <div className="relative h-20 w-20 flex-none overflow-hidden rounded-2xl">
          <img
            src={item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop'}
            alt={item.name}
            className={`h-full w-full object-cover transition-all duration-300 ${!item.isAvailable ? 'grayscale opacity-50' : ''}`}
          />
          {/* Veg/Non-Veg Badge */}
          <div className="absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded-md border border-slate-200 bg-white shadow-sm">
            <div className={`h-2 w-2 rounded-full ${item.isVeg ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} />
          </div>
          
          {/* Unavailable Overlay */}
          {!item.isAvailable && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/5 backdrop-blur-[1px]">
               <span className="bg-slate-900/80 px-2 py-0.5 rounded-lg text-[10px] font-black text-white uppercase tracking-wider backdrop-blur-sm">Sold Out</span>
            </div>
          )}
        </div>

        {/* Details Section */}
        <div>
          <div className="flex items-center gap-2">
            <h4 className={`text-base font-bold leading-tight line-clamp-1 ${item.isAvailable ? 'text-slate-900' : 'text-slate-400'}`}>
              {item.name}
            </h4>
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-400 capitalize">{item.category}</p>
        </div>
      </div>

      {/* Toggle Section */}
      <div className="flex flex-col items-end gap-2">
        <button
          onClick={() => onToggle(item.id, !item.isAvailable)}
          className={`relative inline-flex h-7 w-12 flex-none items-center rounded-full transition-colors duration-200 focus:outline-none ${
            item.isAvailable ? 'bg-emerald-500' : 'bg-slate-300'
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 ${
              item.isAvailable ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
};

export default MenuItemCard;
