import { useRef, useState } from 'react';
import restaurant_logo_placeholder from '../assets/restaurant_logo_placeholder.svg'

interface RestaurantLogoFormProps {
  currentLogoUrl: string;
  onUpload: (file: File) => Promise<void>;
  uploading?: boolean;
}

const RestaurantLogoForm = ({ currentLogoUrl, onUpload, uploading }: RestaurantLogoFormProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create local preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    try {
      await onUpload(file);
    } catch (err) {
      console.error('Upload failed', err);
      // Revert preview on failure
      setPreviewUrl(null);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-10">
      <h2 className="text-xl font-bold tracking-tight text-slate-900 px-2">Restaurant Logo</h2>

      <div className="flex flex-col gap-10 md:flex-row md:items-center">
        {/* Logo Preview */}
        <div className="group relative flex-none h-48 w-48 overflow-hidden rounded-[32px] bg-gradient-to-br from-[#AD221F] to-[#8E1C1A] shadow-xl shadow-red-50">
          {(previewUrl || currentLogoUrl) ? (
            <img
              src={previewUrl || currentLogoUrl}
              alt="Restaurant Logo"
              onError={(e) => {
                (e.target as HTMLImageElement).src = restaurant_logo_placeholder;
              }}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center p-10">
               <img src={restaurant_logo_placeholder} alt="Restaurant Logo Placeholder" className="h-full w-full object-cover opacity-50" />
            </div>
          )}
          
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
            </div>
          )}
        </div>

        {/* Upload Controls */}
        <div className="space-y-5">
          <div className="space-y-1.5">
            <p className="text-base font-bold text-slate-600">
              Upload a square image (recommended: 512×512px)
            </p>
            <p className="text-sm font-medium text-slate-400">
              Accepted formats: JPG, PNG, WEBP. Max size: 2MB.
            </p>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          <button
            onClick={triggerUpload}
            disabled={uploading}
            className="inline-flex items-center gap-2.5 rounded-2xl border-2 border-slate-100 bg-white px-8 py-3.5 text-base font-bold text-slate-900 shadow-sm transition-all hover:border-[#AD221F] hover:text-[#AD221F] hover:shadow-md active:scale-95 disabled:opacity-50"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {uploading ? 'Uploading...' : 'Upload New Logo'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RestaurantLogoForm;
