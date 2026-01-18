
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { QuoteCard } from './components/QuoteCard';
import { Controls } from './components/Controls';
import { Gallery } from './components/Gallery';
import { GestureOverlay } from './components/GestureOverlay';
import { AmbientPlayer } from './components/AmbientPlayer';
import { LikeFeedback, LikeVariant } from './components/LikeFeedback';
import { IntroScreen } from './components/IntroScreen';
import { UserGuide } from './components/UserGuide';
import { Quote, CollectionItem } from './types';
import { fetchRandomQuote } from './services/api';
import { X, Sparkles, Eye, Zap, Hand, MousePointer2, Keyboard } from 'lucide-react';

declare const html2canvas: any;

interface Feedback {
  message: string;
  type: 'success' | 'info';
  visible: boolean;
}

function App() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isAmbientOpen, setIsAmbientOpen] = useState(false);
  
  // Initialize isLoading to true so IntroScreen shows immediately
  const [isLoading, setIsLoading] = useState(true);
  const [showIntro, setShowIntro] = useState(true);
  const [showGuide, setShowGuide] = useState(false);

  const [isGestureActive, setIsGestureActive] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>({ message: '', type: 'info', visible: false });
  const [likeTrigger, setLikeTrigger] = useState<number>(0);
  
  const LIKE_VARIANT: LikeVariant = 'hologram';

  const containerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  
  const downloadedQuotesRef = useRef<Set<string | number>>(new Set());
  const isDownloadingRef = useRef(false);

  const showFeedback = (message: string, type: 'success' | 'info' = 'success') => {
    setFeedback({ message, type, visible: true });
    setTimeout(() => {
      setFeedback(prev => ({ ...prev, visible: false }));
    }, 2500);
  };

  useEffect(() => {
    const saved = localStorage.getItem('juji_collections');
    if (saved) {
      try {
        setCollections(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse collections", e);
      }
    }
    
    initialLoad();

    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    if (quotes.length === 0) return;

    const preloadIndices = [currentIndex + 1, currentIndex + 2];
    
    preloadIndices.forEach(idx => {
      if (quotes[idx]) {
        const img = new Image();
        img.crossOrigin = "anonymous"; 
        img.src = quotes[idx].imageUrl;
      }
    });
  }, [currentIndex, quotes]);

  const initialLoad = async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    // Ensure loading state is true at start (though useState default handles it mostly)
    setIsLoading(true);
    
    try {
      const firstQuote = await fetchRandomQuote();
      setQuotes([firstQuote]);
      
      // Load finished for first screen
      setIsLoading(false); 
      loadingRef.current = false;

      const others = await Promise.all(
        Array.from({ length: 3 }).map(() => fetchRandomQuote())
      );
      setQuotes(prev => [...prev, ...others]);
    } catch (e) {
      console.error("Initial load failed", e);
      setIsLoading(false);
      loadingRef.current = false;
    }
  };

  const handleIntroFinished = () => {
    setShowIntro(false);
    // Check if user has seen the guide
    const hasSeenGuide = localStorage.getItem('juji_guide_seen');
    if (!hasSeenGuide) {
      // Small delay to let the intro fade out smoothly before guide appears
      setTimeout(() => {
        setShowGuide(true);
      }, 800);
    }
  };

  const loadMoreQuotes = async (count: number) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    
    try {
      const newQuotes = await Promise.all(
        Array.from({ length: count }).map(() => fetchRandomQuote())
      );
      setQuotes(prev => [...prev, ...newQuotes]);
    } finally {
      loadingRef.current = false;
    }
  };

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const scrollPos = containerRef.current.scrollTop;
    const height = containerRef.current.clientHeight;
    const newIndex = Math.round(scrollPos / height);
    
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
      if (newIndex >= quotes.length - 3) {
        loadMoreQuotes(3);
      }
    }
  }, [currentIndex, quotes.length]);

  const handleLike = useCallback(() => {
    const current = quotes[currentIndex];
    if (!current) return;
    
    setLikeTrigger(Date.now());

    const exists = collections.find(c => c.id === current.id);
    
    if (exists) {
      showFeedback('已在珍藏中', 'success');
    } else {
      const newCollections = [...collections, current];
      setCollections(newCollections);
      localStorage.setItem('juji_collections', JSON.stringify(newCollections));
      showFeedback('已添加到我的收藏');
    }
  }, [quotes, currentIndex, collections]);

  const handleShare = useCallback(async () => {
    const currentQuote = quotes[currentIndex];
    if (!currentQuote) return;

    const shareText = `“${currentQuote.text}” —— ${currentQuote.author}\n\n来自 句己(Juji) - 沉浸式语录`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: '句己 (Juji)',
          text: shareText,
        });
      } catch (err) {
        console.log('Share canceled or failed');
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        showFeedback('语录已复制到剪贴板');
      } catch (err) {
        showFeedback('复制失败', 'info');
      }
    }
  }, [quotes, currentIndex]);

  const handleDownload = useCallback(async () => {
    const currentQuote = quotes[currentIndex];
    if (!currentQuote) return;

    if (isDownloadingRef.current) return;

    if (downloadedQuotesRef.current.has(currentQuote.id)) {
      showFeedback('这张壁纸已保存', 'info');
      return;
    }

    const currentElement = document.getElementById(`quote-${currentIndex}`);
    if (!currentElement) return;

    try {
      isDownloadingRef.current = true;
      showFeedback('正在生成艺术壁纸...', 'info');
      
      const canvas = await html2canvas(currentElement, {
        useCORS: true,
        allowTaint: false,
        scale: window.devicePixelRatio * 1.5,
        backgroundColor: '#000',
        logging: false,
      });

      const link = document.createElement('a');
      link.download = `juji_${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      downloadedQuotesRef.current.add(currentQuote.id);
      showFeedback('高清壁纸已保存');
    } catch (err) {
      console.error('Download failed:', err);
      showFeedback('壁纸生成失败', 'info');
    } finally {
      setTimeout(() => {
        isDownloadingRef.current = false;
      }, 500);
    }
  }, [currentIndex, quotes]);

  const navigatePrev = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ top: -containerRef.current.clientHeight, behavior: 'smooth' });
    }
  }, []);

  const navigateNext = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ top: containerRef.current.clientHeight, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isGalleryOpen || isAboutOpen || isAmbientOpen || showGuide) return;
      if (!containerRef.current) return;
      const key = e.key.toLowerCase();
      
      switch (key) {
        case 's':
        case 'arrowdown':
        case 'arrowright':
        case ' ':
          e.preventDefault();
          navigateNext();
          break;
        case 'a':
        case 'arrowup':
        case 'arrowleft':
          e.preventDefault();
          navigatePrev();
          break;
        case 'd':
          e.preventDefault();
          handleDownload();
          break;
        case 'f':
          e.preventDefault();
          handleLike();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGalleryOpen, isAboutOpen, isAmbientOpen, showGuide, handleDownload, handleLike, navigateNext, navigatePrev]);

  const removeCollectionItem = (id: string | number) => {
    const newCollections = collections.filter(c => c.id !== id);
    setCollections(newCollections);
    localStorage.setItem('juji_collections', JSON.stringify(newCollections));
    showFeedback('已移除收藏', 'info');
  };

  const navigateToItem = (index: number) => {
    setIsGalleryOpen(false);
  };

  const isLiked = quotes[currentIndex] ? collections.some(c => c.id === quotes[currentIndex].id) : false;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
      
      {/* IntroScreen Component */}
      {showIntro && (
        <IntroScreen 
          isLoading={isLoading || quotes.length === 0} 
          onFinished={handleIntroFinished} 
        />
      )}

      {/* First Time User Guide */}
      {showGuide && !showIntro && (
        <UserGuide onClose={() => setShowGuide(false)} />
      )}

      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="snap-container"
      >
        {quotes.map((quote, index) => (
          <QuoteCard 
            key={`${quote.id}-${index}`} 
            quote={quote} 
            id={`quote-${index}`}
            onDoubleClick={handleLike}
          />
        ))}
        
        {/* Spinner at the bottom when loading more items */}
        {loadingRef.current && quotes.length > 0 && (
          <div className="h-20 flex items-center justify-center text-white/10">
            <div className="w-6 h-6 border-2 border-white/5 border-t-white/30 rounded-full animate-spin" />
          </div>
        )}
      </div>

      <GestureOverlay 
        isActive={isGestureActive} 
        onPrev={navigatePrev} 
        onNext={navigateNext} 
        onAction={handleLike}
        onDownload={handleDownload}
      />
      
      <LikeFeedback trigger={likeTrigger} variant={LIKE_VARIANT} />

      <div className={`fixed bottom-12 left-1/2 -translate-x-1/2 z-[60] transition-all duration-700 pointer-events-none ${
        feedback.visible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95'
      }`}>
        <div className="px-6 py-2.5 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex items-center gap-3">
          <div className={`w-1.5 h-1.5 rounded-full ${feedback.type === 'success' ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
          <span className="text-white/90 text-xs tracking-[0.2em] font-light">
            {feedback.message}
          </span>
        </div>
      </div>

      {quotes.length > 0 && (
        <div className={`fixed-controls-wrapper transition-opacity duration-1000 ${showIntro || showGuide ? 'opacity-0' : 'opacity-100'}`}>
          <Controls 
            isLiked={isLiked}
            onLike={handleLike}
            onDownload={handleDownload}
            onShare={handleShare}
            onOpenGallery={() => setIsGalleryOpen(true)}
            onOpenAbout={() => setIsAboutOpen(true)}
            onOpenAmbient={() => setIsAmbientOpen(true)}
            isGestureActive={isGestureActive}
            onToggleGesture={() => setIsGestureActive(!isGestureActive)}
          />
        </div>
      )}

      <AmbientPlayer 
        isOpen={isAmbientOpen} 
        onClose={() => setIsAmbientOpen(false)} 
      />

      {isGalleryOpen && (
        <Gallery 
          items={collections}
          onClose={() => setIsGalleryOpen(false)}
          onRemove={removeCollectionItem}
          onSelect={navigateToItem}
        />
      )}

      {isAboutOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-500 pointer-events-auto">
          <div className="relative max-w-2xl w-full bg-zinc-950/90 border border-white/10 rounded-[3rem] p-10 md:p-14 shadow-2xl backdrop-blur-3xl animate-in zoom-in-95 duration-500 overflow-y-auto max-h-[90vh] custom-scrollbar">
            <button 
              onClick={() => setIsAboutOpen(false)}
              className="absolute top-10 right-10 text-white/20 hover:text-white transition-colors p-2"
            >
              <X size={24} />
            </button>

            <div className="space-y-12">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                   <h3 className="text-white text-6xl font-black tracking-tighter italic">句己</h3>
                   <div className="h-px flex-1 bg-white/5" />
                   <Sparkles className="text-blue-500" size={24} />
                </div>
                <p className="text-blue-400 text-xl md:text-2xl font-light tracking-widest italic leading-tight">
                  “如果你也喜欢这句话，那它就属于你了。”
                </p>
                <p className="text-white/30 text-sm leading-relaxed max-w-md font-light">
                  句己（Juji）是一个融合了 AI 空间计算的沉浸式名言空间。通过自然感官交互，让每一句触动心灵的文字与你建立数字联结。
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-10">
                <div className="space-y-6">
                   <div className="flex items-center gap-3">
                      <Hand className="text-blue-500" size={16} />
                      <h4 className="text-white/80 text-[10px] font-bold tracking-[0.4em] uppercase">AI 空间交互</h4>
                   </div>
                   <div className="space-y-4">
                     <div className="flex items-start gap-4">
                        <Eye className="text-blue-400 mt-1" size={18} />
                        <div>
                          <p className="text-white text-sm font-bold">沉浸翻页</p>
                          <p className="text-white/40 text-[10px] leading-relaxed">手势：食指快速上划/下划<br/>面部：双眼闭合 1 秒</p>
                        </div>
                     </div>
                     <div className="flex items-start gap-4">
                        <Zap className="text-amber-400 mt-1" size={18} />
                        <div>
                          <p className="text-white text-sm font-bold">灵感捕捉</p>
                          <p className="text-white/40 text-[10px] leading-relaxed">手势：比耶(Victory)✌️<br/>面部：快速连眨两下</p>
                        </div>
                     </div>
                     <div className="flex items-start gap-4">
                        <Hand className="text-emerald-400 mt-1" size={18} />
                        <div>
                          <p className="text-white text-sm font-bold">保存壁纸</p>
                          <p className="text-white/40 text-[10px] leading-relaxed">手势：张开手掌悬停 1 秒</p>
                        </div>
                     </div>
                   </div>
                </div>

                <div className="space-y-6">
                   <div className="flex items-center gap-3">
                      <Keyboard className="text-emerald-500" size={16} />
                      <h4 className="text-white/80 text-[10px] font-bold tracking-[0.4em] uppercase">传统控制方案</h4>
                   </div>
                   <div className="space-y-4">
                     <div className="flex items-start gap-4">
                        <MousePointer2 className="text-emerald-400 mt-1" size={18} />
                        <div>
                          <p className="text-white text-sm font-bold">双击屏幕</p>
                          <p className="text-white/40 text-[10px] leading-relaxed">快速双击屏幕中心即可收藏/喜欢当前语录。</p>
                        </div>
                     </div>
                     <div className="flex items-start gap-4">
                        <div className="flex gap-1.5 mt-1 text-emerald-400">
                          <span className="px-1 border border-current rounded text-[10px]">S</span>
                          <span className="px-1 border border-current rounded text-[10px]">D</span>
                          <span className="px-1 border border-current rounded text-[10px]">F</span>
                        </div>
                        <div>
                          <p className="text-white text-sm font-bold">快捷操作</p>
                          <p className="text-white/40 text-[10px] leading-relaxed">S(下一句) / A(上一句) / D(下载) / F(收藏)</p>
                        </div>
                     </div>
                   </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-1.5 pt-2">
                 <p className="text-white/20 text-[10px] tracking-[0.2em]">作者：李小白</p>
                 <p className="text-white/20 text-[10px] tracking-[0.1em] font-mono opacity-80">反馈与建议：vx 18858399392</p>
              </div>

              <button 
                onClick={() => setIsAboutOpen(false)}
                className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black tracking-[0.4em] text-[10px] uppercase hover:bg-blue-500 transition-all active:scale-95 shadow-[0_20px_50px_rgba(37,99,235,0.3)]"
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
