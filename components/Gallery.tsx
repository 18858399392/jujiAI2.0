
import React from 'react';
import { X, Trash2, ExternalLink } from 'lucide-react';
import { CollectionItem } from '../types';

interface GalleryProps {
  items: CollectionItem[];
  onClose: () => void;
  onRemove: (id: string | number) => void;
  onSelect: (index: number) => void;
}

export const Gallery: React.FC<GalleryProps> = ({ items, onClose, onRemove, onSelect }) => {
  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col animate-in fade-in duration-300">
      <header className="p-6 flex justify-between items-center border-b border-white/10">
        <h2 className="text-white text-2xl font-light tracking-widest flex items-center gap-3">
          <Library size={24} className="text-amber-400" />
          我的收藏
        </h2>
        <button 
          onClick={onClose}
          className="p-2 text-white/60 hover:text-white transition-colors"
        >
          <X size={28} />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-6 md:p-10">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-white/40 space-y-4">
            <Library size={64} strokeWidth={1} />
            <p className="text-lg font-light tracking-widest">还没有收藏任何语录</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item, idx) => (
              <div 
                key={`${item.id}-${idx}`}
                className="group relative bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-white/30 transition-all duration-500"
              >
                <div className="aspect-video relative">
                  <img src={item.imageUrl} alt="" className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-500" />
                  <div className="absolute inset-0 bg-black/40" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => onSelect(idx)}
                      className="p-2 bg-white text-black rounded-full"
                    >
                      <ExternalLink size={20} />
                    </button>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <p className="text-white/80 text-sm line-clamp-2 leading-relaxed">{item.text}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-white/40 text-xs italic">@{item.author}</span>
                    <button 
                      onClick={() => onRemove(item.id)}
                      className="text-white/30 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

// Internal icon for gallery header consistency
const Library = ({ size, className, strokeWidth }: { size?: number, className?: string, strokeWidth?: number }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size || 24} 
    height={size || 24} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth={strokeWidth || 2} 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="m16 6 4 14"/><path d="M12 6v14"/><path d="M8 8v12"/><path d="M4 4v16"/>
  </svg>
);
