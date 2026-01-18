
import React, { useState, useEffect, useRef } from 'react';
import { CloudRain, Waves, Coffee, Trees, Flame, Volume2, VolumeX, X, Loader2, AlertCircle } from 'lucide-react';

interface AmbientPlayerProps {
  isOpen: boolean;
  onClose: () => void;
}

// 定义音频源，使用多 CDN 冗余策略
// Repo: https://github.com/kravets-levko/moodist
// Branch: master
// Mirrors:
// 1. cdn.jsdelivr.net (Default, Cloudflare)
// 2. fastly.jsdelivr.net (Fastly)
// 3. gcore.jsdelivr.net (Gcore, often better connectivity in specific regions)
const AMBIENT_SOUNDS = [
  {
    id: 'rain',
    name: '雨夜',
    icon: CloudRain,
    urls: [
      'https://cdn.jsdelivr.net/gh/kravets-levko/moodist@master/src/assets/sounds/rain.mp3',
      'https://fastly.jsdelivr.net/gh/kravets-levko/moodist@master/src/assets/sounds/rain.mp3',
      'https://gcore.jsdelivr.net/gh/kravets-levko/moodist@master/src/assets/sounds/rain.mp3'
    ]
  },
  {
    id: 'ocean',
    name: '流水',
    icon: Waves,
    urls: [
      'https://cdn.jsdelivr.net/gh/kravets-levko/moodist@master/src/assets/sounds/stream.mp3',
      'https://fastly.jsdelivr.net/gh/kravets-levko/moodist@master/src/assets/sounds/stream.mp3',
      'https://gcore.jsdelivr.net/gh/kravets-levko/moodist@master/src/assets/sounds/stream.mp3'
    ]
  },
  {
    id: 'cafe',
    name: '午后',
    icon: Coffee,
    urls: [
      'https://cdn.jsdelivr.net/gh/kravets-levko/moodist@master/src/assets/sounds/cafe.mp3',
      'https://fastly.jsdelivr.net/gh/kravets-levko/moodist@master/src/assets/sounds/cafe.mp3',
      'https://gcore.jsdelivr.net/gh/kravets-levko/moodist@master/src/assets/sounds/cafe.mp3'
    ]
  },
  {
    id: 'forest',
    name: '鸟鸣',
    icon: Trees,
    urls: [
      'https://cdn.jsdelivr.net/gh/kravets-levko/moodist@master/src/assets/sounds/birds.mp3',
      'https://fastly.jsdelivr.net/gh/kravets-levko/moodist@master/src/assets/sounds/birds.mp3',
      'https://gcore.jsdelivr.net/gh/kravets-levko/moodist@master/src/assets/sounds/birds.mp3'
    ]
  },
  {
    id: 'fire',
    name: '炉火',
    icon: Flame,
    urls: [
      'https://cdn.jsdelivr.net/gh/kravets-levko/moodist@master/src/assets/sounds/fireplace.mp3',
      'https://fastly.jsdelivr.net/gh/kravets-levko/moodist@master/src/assets/sounds/fireplace.mp3',
      'https://gcore.jsdelivr.net/gh/kravets-levko/moodist@master/src/assets/sounds/fireplace.mp3'
    ]
  }
];

export const AmbientPlayer: React.FC<AmbientPlayerProps> = ({ isOpen, onClose }) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.5);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorDetail, setErrorDetail] = useState<string>('');
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentSoundRef = useRef<{ id: string, urlIndex: number } | null>(null);

  // 初始化 Audio 对象
  useEffect(() => {
    const audio = new Audio();
    audio.loop = true;
    audio.volume = volume;
    audio.preload = "auto";
    // 明确设置跨域，以便正确处理 CDN 资源
    audio.crossOrigin = "anonymous";
    
    audio.onerror = (e) => {
      console.warn("Audio element error:", e);
    };

    audioRef.current = audio;
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, []);

  // 监听 volume 变化
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  /**
   * 尝试播放音频，如果失败则递归尝试备用源
   */
  const playAudio = async (soundId: string, urlIndex: number = 0) => {
    const audio = audioRef.current;
    if (!audio) return;

    const sound = AMBIENT_SOUNDS.find(s => s.id === soundId);
    if (!sound) return;

    // 检查是否还有可用的 URL
    if (urlIndex >= sound.urls.length) {
      setHasError(true);
      setErrorDetail('网络连接超时，请检查代理');
      setIsLoading(false);
      setActiveId(null);
      currentSoundRef.current = null;
      return;
    }

    const url = sound.urls[urlIndex];
    
    try {
      // 设置当前播放状态
      currentSoundRef.current = { id: soundId, urlIndex };
      
      // 添加时间戳防止缓存问题
      // 注意：某些 CDN 可能对 query params 敏感，但 jsdelivr 没问题
      audio.src = url;
      
      // 尝试播放
      await audio.play();
      
      // 播放成功
      setIsLoading(false);
      setHasError(false);
      setErrorDetail('');
    } catch (error: any) {
      console.warn(`Play failed for ${soundId} (Source ${urlIndex + 1}/${sound.urls.length}):`, error);
      
      if (error.name === 'AbortError') {
        return;
      }

      // 如果不是 AbortError，尝试下一个源
      if (currentSoundRef.current?.id === soundId) {
        // 递归尝试下一个 URL
        await playAudio(soundId, urlIndex + 1);
      }
    }
  };

  const toggleSound = async (id: string) => {
    const audio = audioRef.current;
    if (!audio) return;

    // 1. 停止当前播放
    if (activeId === id) {
      audio.pause();
      setActiveId(null);
      setIsLoading(false);
      currentSoundRef.current = null;
      return;
    }

    // 2. 播放新的
    setIsLoading(true);
    setHasError(false);
    setErrorDetail('');
    setActiveId(id);

    // 从第一个 URL 开始尝试
    await playAudio(id, 0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center pointer-events-none animate-in fade-in zoom-in-95 duration-300">
        <div className="absolute inset-0 bg-black/20 pointer-events-auto" onClick={onClose} />
        
        <div className="relative pointer-events-auto w-[85vw] max-w-sm bg-zinc-900/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-6">
            
            {/* Header */}
            <div className="flex justify-between items-center">
                <h3 className="text-white/90 text-sm font-bold tracking-[0.2em] uppercase flex items-center gap-2">
                    {isLoading ? (
                        <Loader2 size={16} className="text-blue-400 animate-spin" />
                    ) : hasError ? (
                        <AlertCircle size={16} className="text-red-400" />
                    ) : (
                        <Volume2 size={16} className="text-blue-400" />
                    )}
                    {isLoading ? '连接中...' : hasError ? '连接失败' : '环境音效'}
                </h3>
                <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                    <X size={20} />
                </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-5 gap-2">
                {AMBIENT_SOUNDS.map((sound) => {
                    const isActive = activeId === sound.id;
                    const Icon = sound.icon;
                    return (
                        <button
                            key={sound.id}
                            onClick={() => toggleSound(sound.id)}
                            className={`group flex flex-col items-center gap-2 py-3 rounded-2xl transition-all duration-300 ${
                                isActive 
                                ? 'bg-blue-600/20 shadow-[0_0_20px_rgba(37,99,235,0.3)] scale-105 ring-1 ring-blue-500/50' 
                                : 'hover:bg-white/5'
                            }`}
                        >
                            <div className="relative">
                                <Icon 
                                    size={24} 
                                    className={`transition-all duration-300 ${
                                        isActive ? 'text-blue-400' : 'text-white/40 group-hover:text-white/80'
                                    }`} 
                                />
                                {isActive && isLoading && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/50 rounded-full">
                                    <Loader2 size={12} className="text-white animate-spin" />
                                  </div>
                                )}
                            </div>
                            <span className={`text-[9px] tracking-widest transition-colors ${
                                isActive ? 'text-blue-200' : 'text-white/30'
                            }`}>
                                {sound.name}
                            </span>
                        </button>
                    )
                })}
            </div>

            {/* Volume Slider */}
            <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                <button onClick={() => setVolume(0)} className="text-white/40 hover:text-white transition-colors">
                    {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-blue-400 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:hover:scale-125 [&::-webkit-slider-thumb]:transition-all"
                />
                <span className="text-white/30 text-[10px] w-8 text-right font-mono">
                    {Math.round(volume * 100)}%
                </span>
            </div>
            
            {/* Error Detail Display */}
            {hasError && errorDetail && (
                <p className="text-[10px] text-red-400/80 text-center bg-red-500/10 py-1 rounded animate-pulse">
                    {errorDetail}
                </p>
            )}
        </div>
    </div>
  );
};
