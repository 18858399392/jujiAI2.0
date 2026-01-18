
import React, { useEffect, useState } from 'react';

interface IntroScreenProps {
  isLoading: boolean;
  onFinished: () => void;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({ isLoading, onFinished }) => {
  const [shouldRender, setShouldRender] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      // Trigger exit animation
      setIsExiting(true);
      // Wait for animation to finish before unmounting
      const timer = setTimeout(() => {
        setShouldRender(false);
        onFinished();
      }, 1000); // 1s matches the transition duration
      return () => clearTimeout(timer);
    }
  }, [isLoading, onFinished]);

  if (!shouldRender) return null;

  return (
    <div className={`fixed inset-0 z-[999] bg-black flex flex-col items-center justify-between overflow-hidden cursor-none select-none transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] ${isExiting ? 'opacity-0 pointer-events-none scale-105' : 'opacity-100 scale-100'}`}>
      
      {/* 1. Top Section: Logo/Pinyin */}
      <div className="pt-20 md:pt-24 flex flex-col items-center opacity-0 animate-fade-in fill-mode-forwards">
        <h1 className="text-white font-serif text-3xl md:text-4xl tracking-[0.5em] font-light ml-2">
          juji
        </h1>
      </div>

      {/* 2. Center Section: The Couplet (Vertical Writing) */}
      <div className="flex-1 flex items-center justify-center gap-8 md:gap-16">
        
        {/* Left Line (Read Second): 眼纳太虚 帧帧造化 */}
        {/* Vertical text flow for classical feel */}
        <div className="writing-vertical-rl text-orientation-upright h-auto opacity-0 animate-blur-reveal-slow delay-300 fill-mode-forwards">
          <p className="text-white/90 font-serif text-lg md:text-2xl tracking-[0.4em] leading-relaxed border-l border-white/10 pl-4 md:pl-6 py-4">
            眼纳太虚 帧帧造化
          </p>
        </div>

        {/* Right Line (Read First): 内观外照 境随心转 */}
        <div className="writing-vertical-rl text-orientation-upright h-auto opacity-0 animate-blur-reveal-slow delay-100 fill-mode-forwards">
          <p className="text-white/90 font-serif text-lg md:text-2xl tracking-[0.4em] leading-relaxed border-l border-white/10 pl-4 md:pl-6 py-4">
            内观外照 境随心转
          </p>
        </div>

      </div>

      {/* 3. Bottom Section: Spinner & Tagline */}
      <div className="pb-16 md:pb-20 flex flex-col items-center gap-6 opacity-0 animate-fade-in-up delay-700 fill-mode-forwards">
        {/* Spinner (Above Tagline) */}
        <div className="w-5 h-5 border border-white/10 border-t-white/50 rounded-full animate-spin" />
        
        {/* Tagline */}
        <p className="text-white/30 font-serif text-[10px] md:text-xs tracking-[0.3em] font-light">
          最触动你 &bull; 即属于你
        </p>
      </div>

      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent opacity-50 pointer-events-none" />
      
      <style>{`
        .writing-vertical-rl {
          writing-mode: vertical-rl;
          -webkit-writing-mode: vertical-rl;
        }
        .text-orientation-upright {
          text-orientation: upright;
          -webkit-text-orientation: upright;
        }
        
        @keyframes fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        
        @keyframes blur-reveal-slow {
          0% { 
            opacity: 0; 
            filter: blur(10px); 
            transform: translateY(20px); 
          }
          100% { 
            opacity: 1; 
            filter: blur(0); 
            transform: translateY(0); 
          }
        }

        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in {
          animation: fade-in 1.5s ease-out forwards;
        }
        .animate-blur-reveal-slow {
          animation: blur-reveal-slow 2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-fade-in-up {
          animation: fade-in-up 1.5s ease-out forwards;
        }
        .fill-mode-forwards {
          animation-fill-mode: forwards;
        }
      `}</style>
    </div>
  );
};
