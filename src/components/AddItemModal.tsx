import React, { useState, useRef } from 'react';
import { useToast } from '../context/ToastContext';
import { MenuCategory, CreateMenuItemPayload, MenuItemOption, MenuItemOptionGroup } from '../types';

import { 
  createMenuItem, 
  uploadMenuItemImage, 
  createMenuCategory, 
  fetchMenuItemDetails, 
  updateMenuItem, 
  createOptionGroup, 
  updateOptionGroup, 
  deleteOptionGroup, 
  createOption, 
  updateOption, 
  deleteOption 
} from '../api/dashboardApi';
import axios from 'axios';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: MenuCategory[];
  onItemAdded: () => void;
  editItemId?: string | null;
}

const AddItemModal: React.FC<AddItemModalProps> = ({ isOpen, onClose, categories, onItemAdded, editItemId }) => {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const { showToast } = useToast();

  const [localCategories, setLocalCategories] = useState<MenuCategory[]>(categories);
  const [menuId, setMenuId] = useState(categories[0]?.id || '');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState<string>('');
  const [displayOrder, setDisplayOrder] = useState<string>('0');
  const [isVegetarian, setIsVegetarian] = useState(true);
  const [preparationTimeMinutes, setPreparationTimeMinutes] = useState<string>('');
  
  const [tagsInput, setTagsInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [options, setOptions] = useState<MenuItemOption[]>([]);
  const [optionGroups, setOptionGroups] = useState<MenuItemOptionGroup[]>([]);
  
  const [deletedGroupIds, setDeletedGroupIds] = useState<string[]>([]);
  const [deletedOptionIds, setDeletedOptionIds] = useState<string[]>([]);
  const [standaloneGroupId, setStandaloneGroupId] = useState<string | null>(null);

  React.useEffect(() => {
    setLocalCategories(categories);
    if (!menuId && categories.length > 0) {
        setMenuId(categories[0].id);
    }
  }, [categories]);

  React.useEffect(() => {
    if (isOpen && editItemId) {
      const loadItem = async () => {
        setInitialLoading(true);
        try {
          const data = await fetchMenuItemDetails(editItemId);
          setMenuId(data.menuId || categories[0]?.id || '');
          setName(data.name || '');
          setDescription(data.description || '');
          setBasePrice(data.price ? String(data.price) : '');
          setDisplayOrder(String(data.displayOrder || 0));
          setIsVegetarian(data.isVegetarian ?? true);
          setPreparationTimeMinutes(data.preparationTimeMinutes ? String(data.preparationTimeMinutes) : '');
          setTagsInput((data.tags || []).join(', '));
          setImagePreview((data.imageUrl || null) as any);
          
          const allGroups = data.optionGroups || [];
          const standaloneGroupIndex = allGroups.findIndex((g: any) => g.groupName === 'Addons');
          
          if (standaloneGroupIndex !== -1) {
            setOptions(allGroups[standaloneGroupIndex].options || []);
            setStandaloneGroupId(allGroups[standaloneGroupIndex].id || null);
            setOptionGroups(allGroups.filter((_: any, i: number) => i !== standaloneGroupIndex));
          } else {
            setOptions(data.options || []);
            setStandaloneGroupId(null);
            setOptionGroups(allGroups);
          }
          
          setDeletedGroupIds([]);
          setDeletedOptionIds([]);
        } catch (err: any) {
          console.error(err);
          showToast(err?.response?.data?.message || err.message || 'Failed to load item details', 'error');
        } finally {

          setInitialLoading(false);
        }
      };
      loadItem();
    } else if (isOpen && !editItemId) {
      setMenuId(categories[0]?.id || '');
      setName('');
      setDescription('');
      setBasePrice('');
      setDisplayOrder('0');
      setIsVegetarian(true);
      setPreparationTimeMinutes('');
      setTagsInput('');
      setOptions([]);
      setOptionGroups([]);
      setStandaloneGroupId(null);
      setDeletedGroupIds([]);
      setDeletedOptionIds([]);
      setSelectedFile(null);
      setImagePreview(null);
    }

  }, [isOpen, editItemId, categories]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    setLoading(true);
    try {
      const newCat = await createMenuCategory(newCategoryName);
      setLocalCategories([...localCategories, newCat]);
      setMenuId(newCat.id);
      setIsAddingCategory(false);
      setNewCategoryName('');
    } catch (err: any) {
      console.error(err);
      showToast(err?.response?.data?.message || err.message || 'Failed to create category', 'error');
    } finally {
      setLoading(false);
    }
  };

  const addOption = () => {
    setOptions([...options, { name: '', type: 'AddOn', additionalPrice: 0, isDefault: false }]);
  };
  
  const handleUpdateOption = (index: number, field: keyof MenuItemOption, value: any) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setOptions(newOptions);
  };
  
  const removeOption = (index: number) => {
    const opt = options[index];
    if (opt.id) {
      setDeletedOptionIds([...deletedOptionIds, opt.id]);
    }
    setOptions(options.filter((_, i) => i !== index));
  };

  // Option Group Helpers
  const addOptionGroup = () => {
    setOptionGroups([
      ...optionGroups,
      { groupName: '', isRequired: false, minSelections: 0, maxSelections: 1, displayOrder: optionGroups.length, options: [] }
    ]);
  };

  const handleUpdateOptionGroup = (gIndex: number, field: keyof MenuItemOptionGroup, value: any) => {
    const newGroups = [...optionGroups];
    newGroups[gIndex] = { ...newGroups[gIndex], [field]: value };
    setOptionGroups(newGroups);
  };

  const removeOptionGroup = (gIndex: number) => {
    const grp = optionGroups[gIndex];
    if (grp.id) {
      setDeletedGroupIds([...deletedGroupIds, grp.id]);
    }
    setOptionGroups(optionGroups.filter((_, i) => i !== gIndex));
  };

  const addGroupOption = (gIndex: number) => {
    const newGroups = [...optionGroups];
    newGroups[gIndex].options.push({ name: '', type: 'Choice', additionalPrice: 0, isDefault: false });
    setOptionGroups(newGroups);
  };

  const updateGroupOption = (gIndex: number, oIndex: number, field: keyof MenuItemOption, value: any) => {
    const newGroups = [...optionGroups];
    newGroups[gIndex].options[oIndex] = { ...newGroups[gIndex].options[oIndex], [field]: value };
    setOptionGroups(newGroups);
  };

  const removeGroupOption = (gIndex: number, oIndex: number) => {
    const newGroups = [...optionGroups];
    const opt = newGroups[gIndex].options[oIndex];
    if (opt.id) {
      setDeletedOptionIds(prev => [...prev, opt.id as string]);
    }
    newGroups[gIndex].options = newGroups[gIndex].options.filter((_, i) => i !== oIndex);
    setOptionGroups(newGroups);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuId) {
      showToast('Please select a menu category', 'error');
      return;
    }
    
    setLoading(true);

    try {
      const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t.length > 0);
      
      // Strip IDs for strict swagger match
      const sanitizedOptions = options.map(({ id, ...rest }) => rest);
      const sanitizedGroups = optionGroups.map(({ id, options: groupOpts, ...rest }) => ({
        ...rest,
        options: groupOpts.map(({ id: optId, ...optRest }) => optRest)
      }));

      let itemId = editItemId;
      
      if (editItemId) {
        // STRICT payload for PUT /items/{itemId} based on backend developer's Swagger
        const updatePayload = {
          name,
          description,
          basePrice: Number(basePrice) || 0,
          imageUrl: (imagePreview && !imagePreview.startsWith('data:')) ? imagePreview : "", 
          displayOrder: Number(displayOrder) || 0,
          isVegetarian,
          preparationTimeMinutes: Number(preparationTimeMinutes) || 0,
          options: sanitizedOptions,
          optionGroups: sanitizedGroups,
          tags
        };
        await updateMenuItem(editItemId, updatePayload as any);
      } else {
        const createPayload: CreateMenuItemPayload = {
          menuId,
          name,
          description,
          basePrice: Number(basePrice) || 0,
          imageUrl: (imagePreview && !imagePreview.startsWith('data:')) ? imagePreview : undefined, 
          displayOrder: Number(displayOrder) || 0,
          isVegetarian,
          preparationTimeMinutes: Number(preparationTimeMinutes) || 0,
          options,
          optionGroups,
          tags
        };
        const createdItem = await createMenuItem(createPayload);
        
        // Handle various backend response formats (e.g. returning just the ID string, or an object)
        if (typeof createdItem === 'string') {
          itemId = createdItem;
        } else if (createdItem && typeof createdItem === 'object') {
          itemId = createdItem.id || (createdItem as any).itemId || Object.values(createdItem)[0] as string;
        }
      }

      if (!itemId) throw new Error("Item ID is missing");
      
      // Handle Image Upload if selected
      if (selectedFile && itemId) {
        await uploadMenuItemImage(itemId, selectedFile);
      }
      
      showToast(`Item ${editItemId ? 'updated' : 'added'} successfully`, 'success');
      onItemAdded();
      onClose();
    } catch (err: any) {
      console.error(err);
      showToast(err?.response?.data?.message || err.message || 'Failed to save item', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-4xl overflow-hidden rounded-[32px] bg-white shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-10 duration-300 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">{editItemId ? 'Edit Item' : 'Add New Item'}</h2>
            <p className="text-xs font-semibold text-slate-400">{editItemId ? 'Update your menu item details' : 'Add a fresh dish to your digital menu'}</p>
          </div>
          <button 
            onClick={onClose}
            className="group flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition-all hover:bg-red-50 hover:text-red-500"
          >
            <span className="text-lg font-bold transition-transform group-hover:rotate-90">✕</span>
          </button>
        </div>

        {initialLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
             <div className="h-8 w-8 animate-spin rounded-full border-3 border-slate-200 border-t-brand-600" />
             <p className="text-sm font-semibold text-slate-400">Loading item details...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-6 custom-scrollbar">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Left Column: Basic Info */}
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">Category</label>
                  {isAddingCategory ? (
                    <div className="flex items-center gap-2">
                      <input
                        autoFocus
                        type="text"
                        placeholder="New Category Name"
                        value={newCategoryName}
                        onChange={e => setNewCategoryName(e.target.value)}
                        className="flex-1 rounded-xl border-2 border-slate-50 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-brand-500/10 focus:bg-white focus:ring-4 focus:ring-brand-500/5"
                      />
                      <button 
                        type="button" 
                        onClick={handleCreateCategory}
                        className="rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white"
                      >
                        ADD
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setIsAddingCategory(false)}
                        className="rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-500"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <select
                        required
                        value={menuId}
                        onChange={e => setMenuId(e.target.value)}
                        className="flex-1 appearance-none rounded-xl border-2 border-slate-50 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-brand-500/10 focus:bg-white focus:ring-4 focus:ring-brand-500/5"
                      >
                        <option value="" disabled>Select a category</option>
                        {localCategories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                      <button 
                        type="button" 
                        onClick={() => setIsAddingCategory(true)}
                        className="rounded-xl bg-slate-100 px-3 py-2.5 text-[10px] font-bold text-slate-500 hover:bg-slate-200 transition-colors"
                      >
                        + NEW
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">Item Name</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Paneer Butter Masala"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full rounded-xl border-2 border-slate-50 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-brand-500/10 focus:bg-white focus:ring-4 focus:ring-brand-500/5"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">Base Price (₹)</label>
                    <input
                      required
                      type="text"
                      inputMode="decimal"
                      placeholder="250"
                      value={basePrice}
                      onChange={e => {
                        const val = e.target.value.replace(/[^0-9.]/g, '');
                        const parts = val.split('.');
                        const cleaned = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : val;
                        setBasePrice(cleaned);
                      }}
                      className="w-full rounded-xl border-2 border-slate-50 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-brand-500/10 focus:bg-white focus:ring-4 focus:ring-brand-500/5"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">Type</label>
                    <div className="flex rounded-xl bg-slate-50 p-1 border-2 border-slate-50">
                      <button
                        type="button"
                        onClick={() => setIsVegetarian(true)}
                        className={`flex-1 rounded-lg py-2 text-[10px] font-bold transition-all ${isVegetarian ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        VEG
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsVegetarian(false)}
                        className={`flex-1 rounded-lg py-2 text-[10px] font-bold transition-all ${!isVegetarian ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        NON-VEG
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">Prep Time (mins)</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            placeholder="15"
                            value={preparationTimeMinutes}
                            onChange={e => setPreparationTimeMinutes(e.target.value.replace(/\D/g, ''))}
                            className="w-full rounded-xl border-2 border-slate-50 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-brand-500/10 focus:bg-white focus:ring-4 focus:ring-brand-500/5"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">Display Order</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            placeholder="0"
                            value={displayOrder}
                            onChange={e => setDisplayOrder(e.target.value.replace(/\D/g, ''))}
                            className="w-full rounded-xl border-2 border-slate-50 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-brand-500/10 focus:bg-white focus:ring-4 focus:ring-brand-500/5"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">Item Image</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="group relative flex aspect-video cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[20px] border-2 border-dashed border-slate-200 bg-slate-50 transition-all hover:border-brand-500/20 hover:bg-brand-50/30"
                  >
                    {imagePreview ? (
                      <div className="relative h-full w-full">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop';
                          }}
                          className="h-full w-full object-cover" 
                        />
                        <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-black/40 backdrop-blur-sm p-2">
                           <button 
                             type="button"
                             onClick={(e) => {
                               e.stopPropagation();
                               fileInputRef.current?.click();
                             }}
                             className="flex-1 rounded-lg bg-white/20 px-3 py-1.5 text-[10px] font-bold text-white backdrop-blur-md transition-colors hover:bg-white/30"
                           >
                             CHANGE
                           </button>
                           <button 
                             type="button"
                             onClick={(e) => {
                               e.stopPropagation();
                               setSelectedFile(null);
                               setImagePreview(null);
                               if (fileInputRef.current) fileInputRef.current.value = '';
                             }}
                             className="flex-1 rounded-lg bg-red-500/80 px-3 py-1.5 text-[10px] font-bold text-white backdrop-blur-md transition-colors hover:bg-red-600"
                           >
                             REMOVE
                           </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm transition-transform group-hover:scale-110">
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Click to upload</p>
                      </div>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      className="hidden"
                      accept="image/*"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">Description</label>
                  <textarea
                    rows={2}
                    placeholder="Tell customers what's special about this dish..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full resize-none rounded-xl border-2 border-slate-50 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-brand-500/10 focus:bg-white focus:ring-4 focus:ring-brand-500/5 placeholder:text-slate-300"
                  />
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">Tags (comma separated)</label>
                    <input
                        type="text"
                        placeholder="e.g. Bestseller, Chef's Special"
                        value={tagsInput}
                        onChange={e => setTagsInput(e.target.value)}
                        className="w-full rounded-xl border-2 border-slate-50 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-brand-500/10 focus:bg-white focus:ring-4 focus:ring-brand-500/5"
                    />
                </div>
              </div>

              {/* Right Column: Options & Groups */}
              <div className="space-y-6">
                {/* Option Groups Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Customization Groups</h3>
                    <button 
                        type="button" 
                        onClick={addOptionGroup}
                        className="text-[10px] font-bold text-brand-600 hover:text-brand-700"
                    >
                        + ADD GROUP
                    </button>
                  </div>

                  <div className="space-y-3">
                    {optionGroups.map((group, gIndex) => (
                      <div key={gIndex} className="relative rounded-[20px] border-2 border-slate-50 bg-slate-50/50 p-4 animate-in slide-in-from-right-4">
                        <button 
                            type="button" 
                            onClick={() => removeOptionGroup(gIndex)}
                            className="absolute right-3 top-3 text-slate-300 hover:text-red-500 transition-colors"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div className="grid gap-3">
                            <input
                                type="text"
                                placeholder="Group Name (e.g. Choose Crust)"
                                value={group.groupName}
                                onChange={e => handleUpdateOptionGroup(gIndex, 'groupName', e.target.value)}
                                className="w-full bg-transparent border-b border-slate-200 py-0.5 text-sm font-bold text-slate-900 outline-none focus:border-brand-500/30"
                            />
                            
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-3 w-3" 
                                        checked={group.isRequired}
                                        onChange={e => handleUpdateOptionGroup(gIndex, 'isRequired', e.target.checked)}
                                    />
                                    <span className="text-[10px] font-semibold text-slate-600">Required</span>
                                </label>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase">Min</span>
                                    <input 
                                        type="text" 
                                        inputMode="numeric"
                                        className="w-8 bg-transparent text-[10px] font-bold text-slate-900 outline-none" 
                                        value={group.minSelections}
                                        onChange={e => handleUpdateOptionGroup(gIndex, 'minSelections', Number(e.target.value.replace(/\D/g, '')) || 0)}
                                    />
                                    <span className="text-[9px] font-bold text-slate-400 uppercase">Max</span>
                                    <input 
                                        type="text" 
                                        inputMode="numeric"
                                        className="w-8 bg-transparent text-[10px] font-bold text-slate-900 outline-none" 
                                        value={group.maxSelections}
                                        onChange={e => handleUpdateOptionGroup(gIndex, 'maxSelections', Number(e.target.value.replace(/\D/g, '')) || 0)}
                                    />
                                </div>
                            </div>

                            {/* Group Options */}
                            <div className="mt-2 space-y-2">
                                {group.options.map((option, oIndex) => (
                                    <div key={oIndex} className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            placeholder="Option"
                                            value={option.name}
                                            onChange={e => updateGroupOption(gIndex, oIndex, 'name', e.target.value)}
                                            className="flex-1 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 outline-none"
                                        />
                                        <div className="flex w-14 items-center rounded-lg bg-white px-2 py-1.5">
                                            <span className="text-[9px] font-bold text-slate-300 mr-0.5">₹</span>
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                value={option.additionalPrice}
                                                onChange={e => {
                                                  const val = e.target.value.replace(/[^0-9.]/g, '');
                                                  const parts = val.split('.');
                                                  const cleaned = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : val;
                                                  updateGroupOption(gIndex, oIndex, 'additionalPrice', cleaned === '' ? 0 : Number(cleaned));
                                                }}
                                                className="w-full bg-transparent text-xs font-bold text-slate-900 outline-none"
                                            />
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={() => removeGroupOption(gIndex, oIndex)}
                                            className="text-slate-300 hover:text-red-500"
                                        >
                                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                                <button 
                                    type="button" 
                                    onClick={() => addGroupOption(gIndex)}
                                    className="text-[9px] font-bold text-slate-400 hover:text-brand-600"
                                >
                                    + ADD OPTION
                                </button>
                            </div>
                        </div>
                      </div>
                    ))}
                    {optionGroups.length === 0 && (
                        <div className="rounded-[20px] border-2 border-dashed border-slate-100 py-6 text-center">
                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No groups added</p>
                        </div>
                    )}
                  </div>
                </div>

                {/* Standalone Addons Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Standalone Add-ons</h3>
                    <button 
                        type="button" 
                        onClick={addOption}
                        className="text-[10px] font-bold text-brand-600 hover:text-brand-700"
                    >
                        + ADD OPTION
                    </button>
                  </div>

                  <div className="space-y-2">
                    {options.map((option, index) => (
                      <div key={index} className="flex items-center gap-2 rounded-xl bg-slate-50 p-2 animate-in slide-in-from-right-2">
                        <input
                          type="text"
                          placeholder="Option Name"
                          value={option.name}
                          onChange={e => handleUpdateOption(index, 'name', e.target.value)}
                          className="flex-1 bg-transparent text-xs font-semibold text-slate-900 outline-none px-1"
                        />
                        <select 
                            value={option.type}
                            onChange={e => handleUpdateOption(index, 'type', e.target.value)}
                            className="bg-transparent text-[10px] font-bold text-slate-500 outline-none"
                        >
                            <option value="AddOn">AddOn</option>
                            <option value="Size">Size</option>
                            <option value="Choice">Choice</option>
                        </select>
                        <div className="flex w-16 items-center rounded-lg bg-white px-2 py-1.5">
                          <span className="text-[9px] font-bold text-slate-300 mr-0.5">₹</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={option.additionalPrice}
                            onChange={e => {
                              const val = e.target.value.replace(/[^0-9.]/g, '');
                              const parts = val.split('.');
                              const cleaned = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : val;
                              handleUpdateOption(index, 'additionalPrice', cleaned === '' ? 0 : Number(cleaned));
                            }}
                            className="w-full bg-transparent text-xs font-bold text-slate-900 outline-none"
                          />
                        </div>
                        <button 
                            type="button" 
                            onClick={() => removeOption(index)}
                            className="text-slate-300 hover:text-red-500"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    {options.length === 0 && (
                        <div className="rounded-[20px] border-2 border-dashed border-slate-100 py-6 text-center">
                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No standalone addons</p>
                        </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="mt-8 flex gap-3 sticky bottom-0 bg-white pt-3 pb-1 border-t border-slate-50">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-500 transition-all hover:bg-slate-200"
              >
                CANCEL
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-[2] relative overflow-hidden rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-brand-500/15 transition-all hover:bg-brand-700 hover:shadow-brand-500/20 disabled:opacity-70 active:scale-[0.98]"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      <span>SAVING ITEM...</span>
                  </div>
                ) : (
                  editItemId ? 'UPDATE MENU ITEM' : 'ADD ITEM TO MENU'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AddItemModal;
