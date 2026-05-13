import { useState } from 'react';
import { MenuCategory } from '../types';

interface CategorySidebarProps {
  categories: MenuCategory[];
  activeCategoryId: string;
  onSelectCategory: (id: string) => void;
  onDeleteCategory?: (id: string) => void;
  onCreateCategory?: (name: string) => Promise<void>;
}


const CategorySidebar = ({ categories, activeCategoryId, onSelectCategory, onDeleteCategory, onCreateCategory }: CategorySidebarProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim() || !onCreateCategory) return;
    setCreating(true);
    try {
      await onCreateCategory(newName);
      setNewName('');
      setIsAdding(false);
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="rounded-[32px] bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <div className="flex items-center justify-between px-2 pb-6">
        <h3 className="text-xl font-black tracking-tight text-slate-900">Categories</h3>
        {onCreateCategory && !isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="p-2 text-brand-600 hover:bg-brand-50 rounded-xl transition-colors"
            title="Add New Category"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
      </div>

      <div className="space-y-2">
        {isAdding && (
          <div className="mb-4 space-y-2 px-2 animate-in slide-in-from-top-2 duration-200">
            <input 
              autoFocus
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="Category name..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-brand-600/20 focus:bg-white transition-all"
            />
            <div className="flex gap-2">
              <button 
                onClick={handleCreate}
                disabled={creating || !newName.trim()}
                className="flex-1 rounded-xl bg-brand-600 py-2 text-xs font-black text-white disabled:opacity-50"
              >
                {creating ? '...' : 'ADD'}
              </button>
              <button 
                onClick={() => { setIsAdding(false); setNewName(''); }}
                className="flex-1 rounded-xl bg-slate-100 py-2 text-xs font-black text-slate-500"
              >
                CANCEL
              </button>
            </div>
          </div>
        )}

        <button
      <div className="space-y-2">
        <button
          onClick={() => onSelectCategory('all')}
          className={`w-full rounded-2xl px-5 py-4 text-left text-sm font-bold transition-all duration-200 ${
            activeCategoryId === 'all'
              ? 'bg-brand-50 text-brand-600 shadow-sm'
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          All Items
        </button>
        {categories.map((category) => (
          <div key={category.id} className="group relative">
            <button
              onClick={() => onSelectCategory(category.id)}
              className={`w-full rounded-2xl px-5 py-4 text-left text-sm font-bold transition-all duration-200 pr-12 ${
                activeCategoryId === category.id
                  ? 'bg-brand-50 text-brand-600 shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {category.name}
            </button>
            {onDeleteCategory && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteCategory(category.id);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                title="Delete Category"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        ))}

      </div>
    </div>
  );
};

export default CategorySidebar;
