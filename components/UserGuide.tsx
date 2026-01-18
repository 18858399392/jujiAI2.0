
import React, { useState } from 'react';
import { MousePointer2, Keyboard, ScanFace, ChevronRight, Check } from 'lucide-react';

interface UserGuideProps {
  onClose: () => void;
}

const STEPS = [
  {
    title: "隔空手势 · 意念操控",
    desc: "开启右上角手势模式。挥手翻页，比耶✌️收藏。闭眼 1 秒即可沉浸式切换下一句。",
    icon: <ScanFace size={32} className="text-blue-400" strokeWidth={1.5} />,
    color: "blue"
  },
  {
    title: "鼠标交互 · 双击珍藏",
    desc: "像刷视频一样滑动滚轮切换内容。遇到触动心灵的文字，双击屏幕即可加入收藏。",
    icon: <MousePointer2 size={32} className="text-red-400" strokeWidth={1.5} />,
    color: "red"
  },
  {
    title: "键盘捷径 · 高效浏览",
    desc: "S 下一句 / A 上一句 / F 收藏 / D 下载。指尖跳跃，畅享极速流览体验。",
    icon: <Keyboard size={32} className="text-amber-400" strokeWidth={1.5} />,
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
  const colorMap: Record<string, { border: string, glow: string, bg: string, text: string }> = {
    blue: { border: 'border-blue-500/40', glow: 'shadow-[0_0_40px_rgba(59,130,246,0.3)]', bg: 'bg-blue-500/20', text: 'group-hover:text-blue-400' },
    red: { border: 'border-red-500/40', glow: 'shadow-[0_0_40px_rgba(239,68,68,0.3)]', bg: 'bg-red-500/20', text: 'group-hover:text-red-400' },
    amber: { border: 'border-amber-500/40', glow: 'shadow-[0_0_40px_rgba(245,158,11,0.3)]', bg: 'bg-amber-500/20', text: 'group-hover:text-amber-400' }
  };

  const theme = colorMap[stepData.color];

  return (
    <div className={`fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl transition-opacity duration-700 ${isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      
      {/* Card Container */}
      <div className={`relative w-[90vw] max-w-[420px] bg-zinc-950 border border-white/10 p-8 md:p-12 shadow-2xl flex flex-col items-center text-center transition-all duration-500 ${isExiting ? 'scale-95 blur-sm' : 'scale-100 blur-0'}`}>
        
        {/* Decorative Tech Corners (Thinner, sharper) */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-white/40" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-white/40" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-white/40" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-white/40" />
        
        {/* Background Grid Lines (Subtle Tech Feel) */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />

        {/* Header: System Info */}
        <div className="w-full flex justify-between items-end mb-12 relative z-10">
            <span className="text-[10px] font-mono text-white/40 tracking-[0.2em] uppercase flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full bg-current animate-pulse`} />
                交互指南_v1.0
            </span>
            <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-white/40 tracking-widest">
                    0{currentStep + 1} / 0{STEPS.length}
                </span>
                <div className="flex gap-1">
                    {STEPS.map((_, idx) => (
                        <div 
                        key={idx} 
                        className={`h-0.5 transition-all duration-500 ${
                            idx === currentStep ? 'w-4 bg-white' : 'w-1.5 bg-white/10'
                        }`} 
                        />
                    ))}
                </div>
            </div>
        </div>

        {/* Icon Section (HUD Style - Enhanced) */}
        <div key={`icon-${currentStep}`} className="relative mb-10 animate-in zoom-in-50 fade-in duration-500">
             {/* Glow Blob */}
             <div className={`absolute inset-0 ${theme.bg} blur-3xl rounded-full opacity-30`} />
             
             {/* Main Ring */}
             <div className={`relative w-24 h-24 flex items-center justify-center rounded-full border ${theme.border} bg-black/40 backdrop-blur-sm ${theme.glow}`}>
                {stepData.icon}
                
                {/* Rotating Tech Rings */}
                <div className="absolute inset-0 rounded-full border border-white/5 border-t-white/30 animate-spin duration-[5000ms]" />
                <div className="absolute -inset-3 rounded-full border border-dashed border-white/5 animate-spin duration-[10000ms] reverse" />
             </div>
        </div>

        {/* Text Content */}
        <div key={`text-${currentStep}`} className="space-y-6 animate-in slide-in-from-bottom-2 fade-in duration-500 w-full relative z-10 px-2">
          <h3 className="text-xl text-white font-bold tracking-[0.15em] uppercase drop-shadow-lg">
            {stepData.title}
          </h3>
          <p className="text-gray-300 text-sm leading-7 tracking-wide font-mono min-h-[4.5rem] flex items-center justify-center">
            {stepData.desc}
          </p>
        </div>

        {/* Action Button (Tech Style Redesign) */}
        <button 
          onClick={handleNext}
          className={`mt-14 group relative w-full h-12 overflow-hidden bg-transparent border border-white/20 hover:border-white/50 transition-all duration-500 z-10`}
        >
            {/* Sliding Background Fill */}
            <div className="absolute inset-0 bg-white/10 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-500 ease-out" />
            
            {/* Button Content */}
            <div className={`relative z-10 w-full h-full flex items-center justify-center gap-3 text-white tracking-[0.3em] text-xs font-bold uppercase transition-colors ${theme.text}`}>
                 <span>{currentStep === STEPS.length - 1 ? '启动系统' : '下一节点'}</span>
                 {currentStep === STEPS.length - 1 ? <Check size={14} /> : <ChevronRight size={14} />}
            </div>

            {/* Corner Decos for Button (HUD feel) */}
            <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-white/60 group-hover:border-white transition-colors" />
            <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-white/60 group-hover:border-white transition-colors" />
            <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-white/60 group-hover:border-white transition-colors" />
            <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-white/60 group-hover:border-white transition-colors" />
        </button>

        {/* Skip Link */}
        <button 
          onClick={handleClose}
          className="mt-6 text-[10px] text-white/20 hover:text-white/60 tracking-[0.2em] transition-colors font-mono uppercase z-10 flex items-center gap-2 group"
        >
          <span className="w-1 h-1 bg-white/20 rounded-full group-hover:bg-white/60 transition-colors"></span>
          跳过引导
          <span className="w-1 h-1 bg-white/20 rounded-full group-hover:bg-white/60 transition-colors"></span>
        </button>
      </div>
      
      <style>{`
        .reverse { animation-direction: reverse; }
      `}</style>
    </div>
  );
};
