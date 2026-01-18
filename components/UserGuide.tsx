
import React, { useState } from 'react';
import { MousePointer2, Keyboard, ScanFace, ChevronRight, Check } from 'lucide-react';

interface UserGuideProps {
  onClose: () => void;
}

const STEPS = [
  {
    title: "隔空手势 · 意念操控",
    desc: "开启右上角手势模式。挥手翻页，比耶✌️收藏。闭眼 1 秒即可沉浸式切换下一句。",
    icon: <ScanFace size={28} className="text-blue-400" strokeWidth={1.5} />,
    color: "blue"
  },
  {
    title: "鼠标交互 · 双击珍藏",
    desc: "像刷视频一样滑动滚轮切换内容。遇到触动心灵的文字，双击屏幕即可加入收藏。",
    icon: <MousePointer2 size={28} className="text-red-400" strokeWidth={1.5} />,
    color: "red"
  },
  {
    title: "键盘捷径 · 高效浏览",
    desc: "S 下一句 / A 上一句 / F 收藏 / D 下载。指尖跳跃，畅享极速流览体验。",
    icon: <Keyboard size={28} className="text-amber-400" strokeWidth={1.5} />,
    color: "amber"
  }
];

export const UserGuide: React.FC<UserGuideProps> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setIsExiting(true);
    localStorage.setItem('juji_guide_seen', 'true');
    setTimeout(onClose, 600);
  };

  const stepData = STEPS[currentStep];

  // Map colors explicitly to avoid Tailwind purging dynamic classes
  const colorMap: Record<string, { border: string, glow: string, bg: string }> = {
    blue: { border: 'border-blue-500/30', glow: 'shadow-[0_0_30px_rgba(59,130,246,0.2)]', bg: 'bg-blue-500/20' },
    red: { border: 'border-red-500/30', glow: 'shadow-[0_0_30px_rgba(239,68,68,0.2)]', bg: 'bg-red-500/20' },
    amber: { border: 'border-amber-500/30', glow: 'shadow-[0_0_30px_rgba(245,158,11,0.2)]', bg: 'bg-amber-500/20' }
  };

  const theme = colorMap[stepData.color];

  return (
    <div className={`fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md transition-opacity duration-700 ${isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      
      {/* Card Container */}
      <div className={`relative w-[85vw] max-w-sm bg-black border border-white/10 p-8 md:p-10 shadow-2xl flex flex-col items-center text-center transition-all duration-500 ${isExiting ? 'scale-95 blur-sm' : 'scale-100 blur-0'}`}>
        
        {/* Decorative Tech Corners */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-white/60" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-white/60" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-white/60" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-white/60" />
        
        {/* Background Grid Lines */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

        {/* Header: System Info */}
        <div className="w-full flex justify-between items-end mb-12 relative z-10">
            <span className="text-[9px] font-mono text-white/30 tracking-[0.2em] uppercase">
                交互指南_v1.0
            </span>
            <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono text-white/30 tracking-widest">
                    步骤_0{currentStep + 1}
                </span>
                <div className="flex gap-0.5">
                    {STEPS.map((_, idx) => (
                        <div 
                        key={idx} 
                        className={`h-0.5 transition-all duration-500 ${
                            idx === currentStep ? 'w-3 bg-white' : 'w-1 bg-white/10'
                        }`} 
                        />
                    ))}
                </div>
            </div>
        </div>

        {/* Icon Section (HUD Style) */}
        <div key={`icon-${currentStep}`} className="relative mb-10 animate-in zoom-in-50 fade-in duration-500">
             {/* Glow Blob */}
             <div className={`absolute inset-0 ${theme.bg} blur-2xl rounded-full opacity-40`} />
             
             {/* Main Ring */}
             <div className={`relative w-20 h-20 flex items-center justify-center rounded-full border ${theme.border} bg-black/40 backdrop-blur-sm ${theme.glow}`}>
                {stepData.icon}
                
                {/* Rotating Tech Ring */}
                <div className="absolute inset-0 rounded-full border border-white/5 border-t-white/40 animate-spin duration-[4000ms]" />
                <div className="absolute -inset-2 rounded-full border border-white/5 border-b-white/20 animate-spin duration-[6000ms] reverse" />
             </div>
        </div>

        {/* Text Content */}
        <div key={`text-${currentStep}`} className="space-y-5 animate-in slide-in-from-bottom-2 fade-in duration-500 w-full relative z-10">
          <h3 className="text-lg text-white font-bold tracking-[0.2em] uppercase">
            {stepData.title}
          </h3>
          <p className="text-gray-300 text-xs leading-relaxed tracking-wide font-mono min-h-[3rem] flex items-center justify-center px-1">
            {stepData.desc}
          </p>
        </div>

        {/* Action Button */}
        <button 
          onClick={handleNext}
          className="mt-12 group relative w-full h-10 bg-white hover:bg-white/90 active:scale-95 transition-all flex items-center justify-center overflow-hidden z-10"
        >
            <div className="flex items-center gap-2 text-black font-mono font-bold tracking-[0.2em] text-[10px] uppercase">
                {currentStep === STEPS.length - 1 ? (
                    <>启动系统 <Check size={10} /></>
                ) : (
                    <>下一节点 <ChevronRight size={10} /></>
                )}
            </div>
            {/* Button Decoration */}
            <div className="absolute right-0 bottom-0 w-2 h-2 border-l border-t border-black/20" />
        </button>

        {/* Skip Link */}
        <button 
          onClick={handleClose}
          className="mt-5 text-[9px] text-white/20 hover:text-white/50 tracking-[0.3em] transition-colors font-mono uppercase z-10"
        >
          [ 跳过引导 ]
        </button>
      </div>
      
      <style>{`
        .reverse { animation-direction: reverse; }
      `}</style>
    </div>
  );
};
