import React, { useState, useEffect } from 'react';
import { X, BookOpen, Loader } from 'lucide-react';
import { contentService } from '../../services/content.service';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useBackHandler } from '../../hooks/useBackHandler';

interface GalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GalleryModal: React.FC<GalleryModalProps> = ({ isOpen, onClose }) => {
  useBodyScrollLock(isOpen);
  useBackHandler(isOpen, onClose);
  const [images, setImages] = useState<{imageUrl: string, title: string, description: string, category: string}[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchGallery();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const fetchGallery = async () => {
    setLoading(true);
    try {
      const data = await contentService.getGallery();
      setImages(data);
    } catch (error) {
      console.error('Failed to load Gallery', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/70 backdrop-blur-md flex flex-col" onClick={onClose}>
      <div className="p-4 sm:p-6 flex items-center justify-between bg-white/95 backdrop-blur-md border-b border-slate-200 absolute top-0 w-full z-10 shadow-sm" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-[#0C831F]">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Siliguri's Chai Addaa Story &amp; Gallery</h2>
            <p className="text-xs text-slate-500">Artisan tea crafting &amp; kitchen heritage</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-700 transition-colors border border-slate-200 cursor-pointer">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pt-24 pb-10 px-4 sm:px-6 bg-slate-50" onClick={(e) => e.stopPropagation()}>
        <div className="max-w-4xl mx-auto space-y-10">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto pt-4">
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-xs font-bold uppercase tracking-wider">
              Artisan Tea &amp; Comfort Food
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              Culinary Excellence at Your Table.
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Founded with passion in Sevoke Road, Siliguri's Chai Addaa brings authentic regional tea culture,
              steaming Darjeeling momos, burgers, and comfort food together with effortless digital table-side ordering.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader className="w-8 h-8 animate-spin text-[#0C831F]" /></div>
          ) : (
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 space-y-5">
              {images.map((img, i) => (
                <div key={i} className="break-inside-avoid group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-slate-200 bg-white transition-all">
                  <img src={img.imageUrl} alt={img.title} className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-end p-4 text-center">
                    <span className="text-[#F7D046] font-bold text-base mb-1 drop-shadow">{img.title}</span>
                    <span className="text-xs text-white/90 line-clamp-2">{img.description}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default GalleryModal;
