import React, { useEffect, useState } from 'react';
import { Heart, Sparkles } from 'lucide-react';

export type LikeVariant = 'hologram' | 'ripple' | 'orb';

interface LikeFeedbackProps {
  trigger: number; // Timestamp trigger
  variant?: LikeVariant;
}

export const LikeFeedback: React.FC<LikeFeedbackProps> = ({ trigger, variant = 'hologram' }) => {
  const [active, setActive] = useState(false);
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (trigger === 0) return;
    setActive(false);
    // Force re-render to restart animation
    setTimeout(() => {
        setKey(prev => prev + 1);
        setActive(true);
    }, 10);

    const timer = setTimeout(() => {
      setActive(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [trigger]);

  if (!active) return null;

  // Position: Bottom Center, above the toast message
  const containerClass = "fixed bottom-28 left-1/2 -translate-x-1/2 z-[80] pointer-events-none";

  return (
    <div key={key} className={containerClass}>
      {variant === 'hologram' && <HologramEffect />}
      {variant === 'ripple' && <RippleEffect />}
      {variant === 'orb' && <OrbEffect />}
    </div>
  );
};

// 方案 A: Hologram (全息投影 - 赛博故障风)
// 适合：硬核科技、现代感
const HologramEffect = () => {
  return (
    <div className="relative flex items-center justify-center">
      {/* 核心心跳 */}
      <div className="relative z-10 animate-hologram-glitch">
        <Heart 
            size={40} 
            className="text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)] fill-cyan-400" 
            strokeWidth={0}
        />
        {/* RGB Shift Effects */}
        <div className="absolute inset-0 text-red-500 opacity-50 translate-x-[2px] animate-pulse">
            <Heart size={40} className="fill-red-500" strokeWidth={0} />
        </div>
        <div className="absolute inset-0 text-blue-500 opacity-50 -translate-x-[2px] animate-pulse">
            <Heart size={40} className="fill-blue-500" strokeWidth={0} />
        </div>
      </div>
      
      {/* 扫描线效果 */}
      <div className="absolute w-full h-1 bg-white/80 top-0 animate-scan-down opacity-0" />
      
      <style>{`
        @keyframes hologram-glitch {
          0% { opacity: 0; transform: scale(0.8); filter: blur(4px); }
          10% { opacity: 1; transform: scale(1.1); filter: blur(0); }
          20% { transform: scale(0.95) skewX(-10deg); }
          40% { transform: scale(1.05) skewX(10deg); }
          60% { transform: scale(1); }
          90% { opacity: 1; transform: scale(1); filter: blur(0); }
          100% { opacity: 0; transform: scale(0) translateY(-20px); filter: blur(10px); }
        }
        .animate-hologram-glitch {
          animation: hologram-glitch 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        @keyframes scan-down {
            0% { top: -20%; opacity: 0; }
            20% { opacity: 1; }
            80% { top: 120%; opacity: 1; }
            100% { top: 120%; opacity: 0; }
        }
        .animate-scan-down {
            animation: scan-down 0.6s linear forwards;
        }
      `}</style>
    </div>
  );
};

// 方案 B: Ripple (光之涟漪 - 极简科技)
// 适合：精致、Apple Style
const RippleEffect = () => {
  return (
    <div className="relative flex items-center justify-center">
      {/* 冲击波光环 */}
      <div className="absolute inset-0 rounded-full border border-emerald-400/50 animate-tech-ripple" />
      <div className="absolute inset-0 rounded-full border border-blue-400/30 animate-tech-ripple delay-75" />
      
      {/* 核心 */}
      <div className="relative animate-tech-pop">
         <div className="bg-gradient-to-tr from-blue-500 to-emerald-400 p-2.5 rounded-full shadow-[0_0_20px_rgba(52,211,153,0.5)]">
            <Heart size={20} className="text-white fill-white" />
         </div>
      </div>

      <style>{`
        @keyframes tech-ripple {
            0% { transform: scale(0.8); opacity: 1; border-width: 2px; }
            100% { transform: scale(2.5); opacity: 0; border-width: 0px; }
        }
        .animate-tech-ripple {
            animation: tech-ripple 0.8s cubic-bezier(0, 0, 0.2, 1) forwards;
        }
        @keyframes tech-pop {
            0% { transform: scale(0); opacity: 0; }
            40% { transform: scale(1.2); opacity: 1; }
            60% { transform: scale(0.9); }
            100% { transform: scale(1); opacity: 0; translate: 0 -20px; }
        }
        .animate-tech-pop {
            animation: tech-pop 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </div>
  );
};

// 方案 C: Orb (灵动光珠 - 玻璃拟态)
// 适合：深邃、沉浸
const OrbEffect = () => {
    return (
      <div className="relative flex items-center justify-center animate-orb-float">
        {/* 玻璃外壳 */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative overflow-hidden">
            {/* 内部高光流转 */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent translate-x-[-100%] animate-shine" />
            
            <Heart size={24} className="text-pink-500 fill-pink-500 drop-shadow-md animate-heartbeat-small" />
        </div>
        
        {/* 粒子装饰 */}
        <Sparkles size={16} className="absolute -top-2 -right-2 text-amber-300 animate-ping opacity-75" />
  
        <style>{`
          @keyframes orb-float {
              0% { opacity: 0; transform: translateY(20px) scale(0.8); }
              20% { opacity: 1; transform: translateY(0) scale(1); }
              80% { opacity: 1; transform: translateY(0) scale(1); }
              100% { opacity: 0; transform: translateY(-10px) scale(0.9); }
          }
          .animate-orb-float {
              animation: orb-float 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          @keyframes shine {
              0% { transform: translateX(-100%) skewX(-15deg); }
              100% { transform: translateX(200%) skewX(-15deg); }
          }
          .animate-shine {
              animation: shine 1s ease-in-out infinite;
          }
          @keyframes heartbeat-small {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.2); }
          }
          .animate-heartbeat-small {
              animation: heartbeat-small 0.6s ease-in-out infinite;
          }
        `}</style>
      </div>
    );
};