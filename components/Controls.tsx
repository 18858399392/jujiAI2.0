
import React, { useState, useEffect, useRef } from 'react';
import { Heart, Download, Library, Hand, Info, Share2, Headphones } from 'lucide-react';

interface ControlsProps {
  isLiked: boolean;
  onLike: () => void;
  onDownload: () => void;
  onShare: () => void;
  onOpenGallery: () => void;
  onOpenAbout: () => void;
  onOpenAmbient: () => void;
  isGestureActive: boolean;
  onToggleGesture: () => void;
}

export const Controls: React.FC<ControlsProps> = ({ 
  isLiked, 
  onLike, 
  onDownload, 
  onShare,
  onOpenGallery,
  onOpenAbout,
  onOpenAmbient,
  isGestureActive,
  onToggleGesture
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const timerRef = useRef<number | null>(null);

  const startTimer = () => {
    clearTimer();
    // 修改为 2000ms (2秒) 后自动关闭
    timerRef.current = window.setTimeout(() => {
      setIsExpanded(false);
    }, 2000);
  };

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleMouseEnter = () => {
    setIsExpanded(true);
    // 鼠标进入时清除定时器，保持展开
    clearTimer();
  };

  const handleMouseLeave = () => {
    // 鼠标移出时开始倒计时
    startTimer();
  };

  useEffect(() => {
    return () => clearTimer();
  }, []);

  return (
    <div 
      className="fixed top-8 right-8 z-50 flex items-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div 
        className={`flex items-center gap-2 p-1.5 rounded-full border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl transition-[all] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isExpanded 
            ? 'px-4 translate-x-0 opacity-100' 
            : 'px-1.5 translate-x-4 opacity-80'
        }`}
      >
        {/* Expanded Buttons */}
        <div 
            className={`flex items-center gap-3 overflow-hidden transition-[max-width,opacity] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                isExpanded ? 'max-w-xl opacity-100' : 'max-w-0 opacity-0 pointer-events-none'
            }`}
        >
          {/* Gesture Toggle Button */}
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleGesture(); startTimer(); }}
            className={`p-2.5 rounded-full transition-all duration-300 hover:scale-110 active:scale-90 ${
              isGestureActive ? 'text-blue-400 bg-blue-500/10' : 'text-white/70 hover:text-white'
            }`}
            title={isGestureActive ? "关闭手势识别" : "开启手势识别"}
          >
            <Hand size={18} className={isGestureActive ? 'animate-pulse' : ''} />
          </button>

          <button 
            onClick={(e) => { e.stopPropagation(); onLike(); startTimer(); }}
            className={`p-2.5 rounded-full transition-all duration-300 hover:scale-110 active:scale-90 ${
              isLiked ? 'text-red-500 bg-white/5' : 'text-white/70 hover:text-white'
            }`}
            title="收藏"
          >
            <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
          </button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); onShare(); startTimer(); }}
            className="p-2.5 rounded-full text-white/70 hover:text-white transition-all duration-300 hover:scale-110 active:scale-90"
            title="分享语录"
          >
            <Share2 size={18} />
          </button>

          <button 
            onClick={(e) => { e.stopPropagation(); onDownload(); startTimer(); }}
            className="p-2.5 rounded-full text-white/70 hover:text-white transition-all duration-300 hover:scale-110 active:scale-90"
            title="下载壁纸"
          >
            <Download size={18} />
          </button>

          <button 
            onClick={(e) => { e.stopPropagation(); onOpenAbout(); startTimer(); }}
            className="p-2.5 rounded-full text-white/70 hover:text-white transition-all duration-300 hover:scale-110 active:scale-90"
            title="关于句己"
          >
            <Info size={18} />
          </button>

          <button 
            onClick={(e) => { e.stopPropagation(); onOpenAmbient(); startTimer(); }}
            className="p-2.5 rounded-full text-white/70 hover:text-white transition-all duration-300 hover:scale-110 active:scale-90"
            title="环境音效"
          >
            <Headphones size={18} />
          </button>
          
          <div className="w-px h-4 bg-white/10 mx-1" />
        </div>

        {/* Main Trigger Button (Gallery) */}
        <button 
          onClick={(e) => { e.stopPropagation(); onOpenGallery(); }}
          className="p-2.5 rounded-full text-white transition-all duration-500 hover:bg-white/10 relative z-10"
          title="我的收藏"
        >
          <Library size={20} className={`transition-colors duration-500 ${isExpanded ? 'text-amber-400' : 'text-white'}`} />
        </button>
      </div>
    </div>
  );
};
