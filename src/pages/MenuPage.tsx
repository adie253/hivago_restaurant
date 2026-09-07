import { useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MenuCategory, MenuItem } from '../types';
import { fetchFullMenu, toggleItemAvailability, deleteMenuCategory, createMenuCategory, deleteAllMenu } from '../api/dashboardApi';
import CategorySidebar from '../components/CategorySidebar';
import MenuItemCard from '../components/MenuItemCard';
import { MenuPageSkeleton } from '../components/Skeletons';
import { useToast } from '../context/ToastContext';
import AddItemModal from '../components/AddItemModal';
import BulkUploadModal from '../components/BulkUploadModal';

const MenuPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const isAddItemModalOpen = searchParams.get('add-item') === 'true' || searchParams.has('edit-item');
  const editItemId = searchParams.get('edit-item');

  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);

  const [isDeleteWholeMenuOpen, setIsDeleteWholeMenuOpen] = useState(false);
  const [isDeletingWholeMenu, setIsDeletingWholeMenu] = useState(false);

  const loadMenuData = useCallback(async (isInitial = false) => {
    if (!user?.id) return;
    if (isInitial) {
      setLoading(true);
    }
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
  }, [user?.id]);

  useEffect(() => {
    loadMenuData(true);
  }, [user?.id, loadMenuData]);


  const handleToggleAvailability = async (itemId: string, isAvailable: boolean) => {
    // Optimistic UI update
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, isAvailable } : item))
    );

    const targetItem = items.find(i => i.id === itemId);
    if (targetItem) {
      showToast(`${targetItem.name} is now ${isAvailable ? 'available' : 'unavailable'}`, 'info');
    }

    try {
      await toggleItemAvailability(itemId, isAvailable);
    } catch (err) {
      // Revert if API fails
      setItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, isAvailable: !isAvailable } : item))
      );
      console.error('Failed to update availability', err);
    }
  };

  const handleEditItem = (item: MenuItem) => {
    setSearchParams(prev => {
      prev.set('edit-item', item.id);
      prev.delete('add-item');
      return prev;
    });
  };

  const handleAddNewItem = () => {
    setSearchParams(prev => {
      prev.set('add-item', 'true');
      prev.delete('edit-item');
      return prev;
    });
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;

    setIsDeletingCategory(true);
    try {
      await deleteMenuCategory(categoryToDelete);
      showToast('Category deleted successfully', 'success');
      if (activeCategoryId === categoryToDelete) {
        setActiveCategoryId('all');
      }
      await loadMenuData();
    } catch (err: any) {
      console.error('Failed to delete category', err);
      setError(err.message || 'Failed to delete category. Please make sure it has no items.');
    } finally {
      setIsDeletingCategory(false);
      setCategoryToDelete(null);
    }
  };

  const confirmDeleteWholeMenu = async () => {
    setIsDeletingWholeMenu(true);
    try {
      await deleteAllMenu(user?.id);
      showToast('Entire menu deleted successfully', 'success');
      setActiveCategoryId('all');
      setItems([]);
      setCategories([]);
      await loadMenuData();
    } catch (err: any) {
      console.error('Failed to delete whole menu', err);
      showToast(err.message || 'Failed to delete menu. Please try again.', 'error');
    } finally {
      setIsDeletingWholeMenu(false);
      setIsDeleteWholeMenuOpen(false);
    }
  };

  const handleCreateCategory = async (name: string) => {
    try {
      const newCat = await createMenuCategory(name);
      showToast(`Category "${name}" created successfully!`, 'success');
      if (newCat?.id) {
        setActiveCategoryId(newCat.id);
      }
      await loadMenuData();
    } catch (err: any) {
      console.error('Failed to create category', err);
      setError(err.message || 'Failed to create category');
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

  if (loading) return <MenuPageSkeleton />;

  return (
    <div className="grid gap-10 lg:grid-cols-[220px_1fr] items-start">
      {/* Categories Sidebar */}
      <aside className="hidden lg:block sticky top-0 self-start">
        <CategorySidebar
          categories={categories}
          activeCategoryId={activeCategoryId}
          onSelectCategory={setActiveCategoryId}
          onDeleteCategory={setCategoryToDelete}
          onCreateCategory={handleCreateCategory}
        />
      </aside>

      {/* Main Content */}
      <div className="space-y-5">
        {/* Header Section */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Menu Management</h1>
            <p className="mt-1.5 text-base font-bold text-slate-400">
              {items.length} items in All Items
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(items.length > 0 || categories.length > 0) && (
              <button
                onClick={() => setIsDeleteWholeMenuOpen(true)}
                className="flex items-center justify-center gap-2 rounded-2xl bg-red-50 border border-red-200 px-4 py-2 text-sm font-bold text-red-600 shadow-sm transition-all hover:bg-red-100 hover:border-red-300 active:scale-95"
              >
                <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Whole Menu
              </button>
            )}
            <button
              onClick={() => setIsBulkUploadOpen(true)}
              className="flex items-center justify-center gap-2 rounded-2xl bg-white border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 shadow-md shadow-slate-100/50 transition-all hover:bg-slate-50 hover:shadow-lg hover:border-slate-300 active:scale-95"
            >
              <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Bulk Upload
            </button>
            <button
              onClick={handleAddNewItem}
              className="flex items-center justify-center gap-2 rounded-2xl bg-brand-600 px-4 py-2 text-sm font-bold text-white shadow-xl shadow-red-100 transition-all hover:bg-brand-700 hover:shadow-2xl active:scale-95"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
              </svg>
              Add New Item
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-slate-400 group-focus-within:text-brand-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-[24px] bg-white border border-transparent px-16 py-3 text-base font-semibold text-slate-950 shadow-[0_8px_30px_rgb(0,0,0,0.04)] outline-none transition-all focus:border-brand-600/10 focus:shadow-[0_8px_30px_rgb(173,34,31,0.05)] placeholder:text-slate-400"
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
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredItems.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                onToggle={handleToggleAvailability}
                onEdit={handleEditItem}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete Category Confirmation Modal */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] w-full max-w-[340px] p-8 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-[#AD221F] mb-5">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>

            <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Category?</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-8">
              Are you sure you want to delete this category? This will remove the category from your menu.
            </p>

            <div className="flex flex-col w-full gap-3">
              <button
                onClick={confirmDeleteCategory}
                disabled={isDeletingCategory}
                className="w-full bg-[#AD221F] text-white font-bold py-4 rounded-2xl hover:bg-red-800 transition-all shadow-lg shadow-red-100 active:scale-[0.98] disabled:opacity-50"
              >
                {isDeletingCategory ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button
                onClick={() => setCategoryToDelete(null)}
                disabled={isDeletingCategory}
                className="w-full bg-slate-50 text-slate-500 font-bold py-4 rounded-2xl hover:bg-slate-100 transition-all active:scale-[0.98]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Whole Menu Confirmation Modal */}
      {isDeleteWholeMenuOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] w-full max-w-[400px] p-8 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-[#AD221F] mb-5">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Entire Menu?</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              Are you sure you want to delete <span className="font-bold text-slate-800">ALL {items.length} items</span> and categories? This action <span className="font-bold text-red-600">cannot be undone</span>.
            </p>

            <div className="flex flex-col w-full gap-3">
              <button
                onClick={confirmDeleteWholeMenu}
                disabled={isDeletingWholeMenu}
                className="w-full bg-[#AD221F] text-white font-bold py-4 rounded-2xl hover:bg-red-800 transition-all shadow-lg shadow-red-100 active:scale-[0.98] disabled:opacity-50"
              >
                {isDeletingWholeMenu ? 'Deleting Whole Menu...' : 'Yes, Delete Entire Menu'}
              </button>
              <button
                onClick={() => setIsDeleteWholeMenuOpen(false)}
                disabled={isDeletingWholeMenu}
                className="w-full bg-slate-50 text-slate-500 font-bold py-4 rounded-2xl hover:bg-slate-100 transition-all active:scale-[0.98]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <AddItemModal
        isOpen={isAddItemModalOpen}
        onClose={() => {
          setSearchParams(prev => {
            prev.delete('add-item');
            prev.delete('edit-item');
            return prev;
          });
        }}
        categories={categories}
        editItemId={editItemId}
        onItemAdded={() => {
          loadMenuData();
        }}
        onCategoryCreated={loadMenuData}
      />

      <BulkUploadModal
        isOpen={isBulkUploadOpen}
        onClose={() => setIsBulkUploadOpen(false)}
        categories={categories}
        existingItems={items}
        onUploadSuccess={loadMenuData}
      />
    </div>
  );
};

export default MenuPage;
