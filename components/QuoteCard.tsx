
import React, { useState, useRef, useEffect } from 'react';
import { Quote } from '../types';

interface QuoteCardProps {
  quote: Quote;
  id: string;
  onDoubleClick?: () => void;
}

export const QuoteCard: React.FC<QuoteCardProps> = ({ quote, id, onDoubleClick }) => {
  const [imgError, setImgError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false); // 控制入场动画的状态
  
  const imgRef = useRef<HTMLImageElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Logic: 
  // Desktop: Treated as "short" if <= 30 chars (single line centered).
  const isShortDesktop = quote.text.length <= 30;

  // 组件挂载时立即检查图片是否已在缓存中
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      setImageLoaded(true);
    }
  }, []);

  // 使用 IntersectionObserver 监听卡片是否进入视口中心
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // 当卡片有 50% 进入视口时触发动画
        if (entry.isIntersecting) {
            setIsVisible(true);
        } else {
            // 划出视口后重置状态，这样划回来时可以重新播放动画
            setIsVisible(false);
        }
      },
      { threshold: 0.5 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleDoubleClick = (e: React.MouseEvent) => {
    // 防止冒泡影响其他可能的交互
    e.preventDefault();
    e.stopPropagation();

    // 触发外部的点赞逻辑
    onDoubleClick?.();
  };

  // Format date for display
  const dateStr = new Date(quote.timestamp).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '.');

  // 计算背景层的动态样式类名
  const backgroundStateClass = !imageLoaded 
    ? 'opacity-0 scale-105 blur-xl' 
    : isVisible 
        ? 'opacity-70 blur-0 scale-100' 
        : 'opacity-40 blur-2xl scale-110'; 

  return (
    <div 
      id={id}
      ref={cardRef}
      className="snap-item relative overflow-hidden flex items-center justify-center bg-black select-none"
      onDoubleClick={handleDoubleClick}
    >
      {/* 1. Background Layer (Image) */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Fallback Gradient (Loading State) */}
        <div className={`absolute inset-0 bg-gradient-to-br from-zinc-900 via-black to-zinc-900 transition-opacity duration-1000 ${imageLoaded && !imgError ? 'opacity-0' : 'opacity-100'}`} />

        {/* 
            Image Container: 负责由模糊到清晰的变焦过渡
        */}
        {!imgError && (
            <div className={`
                w-full h-full 
                transition-all duration-[2000ms] ease-[cubic-bezier(0.22,1,0.36,1)]
                ${backgroundStateClass}
            `}>
                <img 
                    ref={imgRef}
                    src={quote.imageUrl} 
                    alt="Background"
                    loading="eager"
                    crossOrigin="anonymous"
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImgError(true)}
                    className={`
                        w-full h-full object-cover
                        ${isVisible && imageLoaded ? 'animate-ken-burns' : ''}
                    `}
                />
            </div>
        )}
        
        {/* Masks: Different for Mobile vs Desktop */}
        {/* Desktop Mask */}
        <div className="hidden md:block absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none" />
        <div className="hidden md:block absolute inset-0 bg-black/20 backdrop-blur-[0.5px] pointer-events-none" />
        
        {/* Mobile Mask: Darker, more uniform for readability */}
        <div className="md:hidden absolute inset-0 bg-black/40 pointer-events-none" />
        <div className="md:hidden absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/60 pointer-events-none" />
      </div>


      {/* --- MOBILE LAYOUT CONTAINER --- */}
      <div className="md:hidden relative z-10 w-full h-full pointer-events-none">
         {/* 1. Mobile Date (Top Left Vertical) */}
         <div className={`
             absolute top-12 left-6 border-l border-white/20 pl-2
             transition-all duration-1000 delay-300
             ${isVisible ? 'opacity-60 translate-y-0' : 'opacity-0 -translate-y-4'}
         `}>
            <span className="writing-vertical-rl text-[10px] tracking-[0.3em] font-light text-white/80">
                {dateStr}
            </span>
         </div>

         {/* 2. Mobile Main Text */}
         <div className="absolute top-[30%] left-14 right-8">
            <h1 className={`
                text-white font-serif text-2xl leading-loose tracking-[0.1em] text-left indent-8 shadow-black drop-shadow-lg
                transition-all duration-[1500ms] delay-200 ease-[cubic-bezier(0.16,1,0.3,1)]
                ${isVisible ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-8 blur-sm'}
            `}>
              {quote.text}
            </h1>
         </div>

         {/* 3. Mobile Author */}
         <div className={`absolute bottom-24 left-10 transition-all duration-1000 delay-[800ms] ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="flex flex-col items-center">
              <div className={`bg-white/30 w-px mb-3 transition-all duration-1000 delay-[900ms] ${isVisible ? 'h-8' : 'h-0'}`} />
              <span className="text-white/90 font-light tracking-[0.3em] writing-vertical-rl text-orientation-upright text-sm">
                {quote.author}
              </span>
              {quote.from && (
                <span className="text-white/40 font-light italic mt-2 writing-vertical-rl text-orientation-upright text-[10px] tracking-widest mr-2">
                   {quote.from}
                </span>
              )}
            </div>
         </div>
      </div>


      {/* --- DESKTOP LAYOUT CONTAINER --- */}
      <div className="hidden md:flex relative z-10 w-full max-w-5xl px-20 text-center flex-col items-center justify-center pointer-events-none">
        
        {/* Main Quote Text */}
        <div className="relative group perspective-[1000px]">
          <h1 className={`
            text-white font-extralight leading-[1.8] tracking-[0.15em] drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]
            ${isShortDesktop 
              ? 'text-4xl lg:text-5xl whitespace-nowrap' 
              : 'text-3xl lg:text-4xl px-4 text-justify'
            }
            transition-all duration-[1800ms] delay-300 ease-[cubic-bezier(0.16,1,0.3,1)]
            ${isVisible ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-12 blur-sm'}
          `}
          style={{ 
            textShadow: '0 0 30px rgba(0,0,0,0.5)',
            fontFamily: "'Noto Serif SC', serif"
          }}>
            {quote.text}
          </h1>
          
          {isShortDesktop && (
            <>
              <div className={`absolute -left-12 top-1/2 -translate-y-1/2 h-[1px] bg-white/20 hidden lg:block transition-all duration-[1500ms] delay-[1000ms] ease-out ${isVisible ? 'w-12 opacity-100' : 'w-0 opacity-0'}`} />
              <div className={`absolute -right-12 top-1/2 -translate-y-1/2 h-[1px] bg-white/20 hidden lg:block transition-all duration-[1500ms] delay-[1000ms] ease-out ${isVisible ? 'w-12 opacity-100' : 'w-0 opacity-0'}`} />
            </>
          )}
        </div>

        {/* Author/Source Section */}
        <div className={`mt-20 flex flex-col items-center space-y-4`}>
           <div className={`h-px bg-white/30 transition-all duration-1000 delay-[600ms] ease-out ${isVisible ? 'w-8 opacity-100' : 'w-0 opacity-0'}`} />
           
           <div className={`flex flex-col items-center transition-all duration-1000 delay-[800ms] ${isVisible ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-4 blur-sm'}`}>
             <span className="text-white/90 text-base font-normal tracking-[0.4em]">
               {quote.author}
             </span>
             {quote.from && (
               <span className="mt-2 text-white/40 text-xs tracking-[0.2em] font-light italic">
                 VIA &bull; {quote.from}
               </span>
             )}
           </div>
        </div>
      </div>

      {/* Vignette & Edge Shadow */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.7)]" />
      
      {/* Desktop Date Marker */}
      <div className={`hidden md:block absolute bottom-10 left-10 transition-all duration-1000 delay-[1200ms] ${isVisible ? 'opacity-30 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
        <span className="text-white text-[9px] tracking-[0.5em] font-light">
          {dateStr.replace(/\./g, ' . ')}
        </span>
      </div>
    </div>
  );
};
