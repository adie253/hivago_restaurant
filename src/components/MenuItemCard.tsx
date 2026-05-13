import { MenuItem } from '../types';
import { formatCurrency } from '../utils/format';

interface MenuItemCardProps {
  item: MenuItem;
  onToggle: (id: string, available: boolean) => void;
  onEdit: (item: MenuItem) => void;
}

const MenuItemCard = ({ item, onToggle, onEdit }: MenuItemCardProps) => {
  return (
    <div className={`group flex items-center justify-between rounded-[28px] p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] ${
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

      {/* Action Section */}
      <div className="flex flex-col items-end gap-3">
        <button
          onClick={() => onToggle(item.id, !item.isAvailable)}
          className={`relative inline-flex h-6 w-11 flex-none items-center rounded-full transition-colors duration-200 focus:outline-none ${
            item.isAvailable ? 'bg-emerald-500' : 'bg-slate-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
              item.isAvailable ? 'translate-x-[22px]' : 'translate-x-[2px]'
            }`}
          />
        </button>
        
        <button 
            onClick={() => onEdit(item)}
            className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 hover:text-brand-600 transition-colors uppercase tracking-widest px-2"
        >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Edit
        </button>
      </div>
    </div>
  );
};

export default MenuItemCard;
