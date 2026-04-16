import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { MenuCategory, MenuItem } from '../types';
import { fetchFullMenu, toggleItemAvailability } from '../api/dashboardApi';
import CategorySidebar from '../components/CategorySidebar';
import MenuItemCard from '../components/MenuItemCard';
import LoadingState from '../components/LoadingState';
import Toast from '../components/Toast';

const MenuPage = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const loadMenuData = async () => {
      setLoading(true);
      setError(null);
      try {
        const { categories, items } = await fetchFullMenu(user.id);
        setCategories(categories);
        setItems(items);
      } catch (err) {
        setError('Failed to load menu data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadMenuData();
  }, [user?.id]);


  const handleToggleAvailability = async (itemId: string, isAvailable: boolean) => {
    // Optimistic UI update
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, isAvailable } : item))
    );

    const targetItem = items.find(i => i.id === itemId);
    if (targetItem) {
      setToastMessage(`${targetItem.name} is now ${isAvailable ? 'available' : 'unavailable'}`);
    }

    try {
      await toggleItemAvailability(itemId);
    } catch (err) {
      // Revert if API fails
      setItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, isAvailable: !isAvailable } : item))
      );
      console.error('Failed to update availability', err);
    }
  };

  const filteredItems = useMemo(() => {
    let result = items;

    if (activeCategoryId !== 'all') {
      // Match by category name or menuId
      const activeCat = categories.find(c => c.id === activeCategoryId);
      const catName = activeCat?.name.toLowerCase() || '';
      result = result.filter(item => 
        item.menuId === activeCategoryId || 
        item.category.toLowerCase() === catName
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.name.toLowerCase().includes(q) || 
        item.description?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [items, activeCategoryId, searchQuery, categories]);

  if (loading) return <LoadingState />;

  return (
    <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
      {/* Categories Sidebar */}
      <aside className="hidden lg:block">
        <CategorySidebar
          categories={categories}
          activeCategoryId={activeCategoryId}
          onSelectCategory={setActiveCategoryId}
        />
      </aside>

      {/* Main Content */}
      <div className="space-y-10">
        {/* Header Section */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Menu Management</h1>
            <p className="mt-1.5 text-base font-bold text-slate-400">
              {items.length} items in All Items
            </p>
          </div>
          <button className="flex items-center justify-center gap-2 rounded-2xl bg-[#AD221F] px-6 py-3.5 text-sm font-black text-white shadow-xl shadow-red-100 transition-all hover:bg-red-800 hover:shadow-2xl active:scale-95">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
            Add New Item
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-slate-400 group-focus-within:text-[#AD221F] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-[24px] bg-white border border-transparent px-16 py-5 text-base font-bold text-slate-950 shadow-[0_8px_30px_rgb(0,0,0,0.04)] outline-none transition-all focus:border-[#AD221F]/10 focus:shadow-[0_8px_30px_rgb(173,34,31,0.05)] placeholder:text-slate-400"
          />
        </div>

        {/* Menu Items Grid */}
        {error ? (
          <div className="rounded-[32px] border border-slate-200 bg-white p-20 text-center font-bold text-slate-400">
            {error}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-[32px] border border-dashed border-slate-200 bg-white p-32 text-center shadow-sm">
            <p className="text-xl font-bold text-slate-400">No items found matching your criteria</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredItems.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                onToggle={handleToggleAvailability}
              />
            ))}
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

export default MenuPage;
