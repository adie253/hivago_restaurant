import { MenuCategory } from '../types';

interface CategorySidebarProps {
  categories: MenuCategory[];
  activeCategoryId: string;
  onSelectCategory: (id: string) => void;
}

const CategorySidebar = ({ categories, activeCategoryId, onSelectCategory }: CategorySidebarProps) => {
  return (
    <div className="rounded-[32px] bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <h3 className="text-xl font-black tracking-tight text-slate-900 px-2 pb-6">Categories</h3>
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
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            className={`w-full rounded-2xl px-5 py-4 text-left text-sm font-bold transition-all duration-200 ${
              activeCategoryId === category.id
                ? 'bg-brand-50 text-brand-600 shadow-sm'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategorySidebar;
