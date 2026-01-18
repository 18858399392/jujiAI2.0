
import React, { useRef, useEffect, ReactNode, useState } from 'react';
import { FaceLandmarker, HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

interface GestureOverlayProps {
  onPrev: () => void;
  onNext: () => void;
  onAction: () => void; // Like
  onDownload: () => void; // Download
  isActive: boolean;
}

// 辅助函数：多源加载模型文件
// 依次尝试 URL 列表，直到下载成功并返回 Blob URL
const loadModelAsset = async (urls: string[]): Promise<string> => {
  for (const url of urls) {
    try {
      console.log(`Trying to load model from: ${url}`);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Status ${response.status}`);
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (e) {
      console.warn(`Failed to load from ${url}, trying next...`);
    }
  }
  throw new Error("Failed to load model from all mirrors.");
};

export const GestureOverlay: React.FC<GestureOverlayProps> = ({ onPrev, onNext, onAction, onDownload, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<string>('');
  const [cooldownProgress, setCooldownProgress] = useState(100);
  const [isModelLoading, setIsModelLoading] = useState(false);

  const faceLandmarker = useRef<FaceLandmarker | null>(null);
  const handLandmarker = useRef<HandLandmarker | null>(null);
  const lastTriggerTime = useRef<number>(0);
  const isActiveRef = useRef(isActive);
  const lastProcessingTime = useRef<number>(0);
  
  // Face Logic Refs
  const eyeClosedStart = useRef<number | null>(null);
  const blinkCount = useRef<number>(0);
  const lastBlinkTime = useRef<number>(0);
  
  // Hand Logic Refs
  const lastIndexY = useRef<number | null>(null);
  const palmOpenStart = useRef<number | null>(null);
  
  // 增加冷却时间到 2000ms，防止误触和连续触发
  const COOLDOWN_MS = 2000;

  // 使用 ref 保持回调函数的最新引用
  const onPrevRef = useRef(onPrev);
  const onNextRef = useRef(onNext);
  const onActionRef = useRef(onAction);
  const onDownloadRef = useRef(onDownload);

  useEffect(() => {
    onPrevRef.current = onPrev;
    onNextRef.current = onNext;
    onActionRef.current = onAction;
    onDownloadRef.current = onDownload;
  }, [onPrev, onNext, onAction, onDownload]);

  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let animationId: number;
    let isMounted = true;

    // Log suppression logic
    const originalLog = console.log;
    const originalInfo = console.info;
    const originalWarn = console.warn;
    const originalError = console.error;

    const silentLogger = (originalFn: Function) => (...args: any[]) => {
      const isSpam = args.some(arg => 
        typeof arg === 'string' && (
          arg.includes('TensorFlow') || 
          arg.includes('XNNPACK') || 
          arg.includes('delegate') ||
          arg.includes('INFO:')
        )
      );
      if (isSpam) return;
      originalFn.apply(console, args);
    };

    if (isActive) {
      console.log = silentLogger(originalLog);
      console.info = silentLogger(originalInfo);
      console.warn = silentLogger(originalWarn);
      console.error = silentLogger(originalError);
    }

    const initAI = async () => {
      if (!isActive) return;
      setIsModelLoading(true);

      try {
        // 1. WASM 引擎：保持使用 cdn.jsdelivr.net，它对 npm 包的支持比较稳定
        // 如果这里也报错，可以尝试 'https://jsd.cdn.zzko.cn/npm/@mediapipe/tasks-vision@0.10.3/wasm'
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        
        // 2. 模型文件：使用多源自动降级策略
        // 优先尝试国内加速节点，其次 Google 官方，最后 JSDelivr 原源
        
        const FACE_MODEL_MIRRORS = [
            // Mirror 1: China Accelerated JSDelivr
            "https://jsd.cdn.zzko.cn/gh/google-ai-edge/mediapipe-samples@main/examples/face_landmarker/android/app/src/main/assets/face_landmarker.task",
            // Mirror 2: Google Official (Float16)
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            // Mirror 3: Standard JSDelivr (May 403)
            "https://cdn.jsdelivr.net/gh/google-ai-edge/mediapipe-samples@main/examples/face_landmarker/android/app/src/main/assets/face_landmarker.task"
        ];

        const HAND_MODEL_MIRRORS = [
            // Mirror 1: China Accelerated JSDelivr
            "https://jsd.cdn.zzko.cn/gh/google-ai-edge/mediapipe-samples@main/examples/hand_landmarker/android/app/src/main/assets/hand_landmarker.task",
            // Mirror 2: Google Official (Float16)
            "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            // Mirror 3: Standard JSDelivr (May 403)
            "https://cdn.jsdelivr.net/gh/google-ai-edge/mediapipe-samples@main/examples/hand_landmarker/android/app/src/main/assets/hand_landmarker.task"
        ];

        // 并行加载模型文件
        const [faceModelBlobUrl, handModelBlobUrl] = await Promise.all([
            loadModelAsset(FACE_MODEL_MIRRORS),
            loadModelAsset(HAND_MODEL_MIRRORS)
        ]);

        [faceLandmarker.current, handLandmarker.current] = await Promise.all([
          FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: faceModelBlobUrl,
              delegate: "GPU"
            },
            outputFaceBlendshapes: true,
            runningMode: "VIDEO",
            numFaces: 1
          }),
          HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: handModelBlobUrl,
              delegate: "GPU"
            },
            runningMode: "VIDEO",
            numHands: 1 // Only track one hand for control to avoid confusion
          })
        ]);
        
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1280 }, 
            height: { ideal: 720 },
            frameRate: { ideal: 30 } 
          } 
        });
        
        if (!isMounted) {
          mediaStream.getTracks().forEach(t => t.stop());
          return;
        }

        stream = mediaStream;
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          await videoRef.current.play();
          setIsModelLoading(false);
          renderLoop();
        }
      } catch (err) {
        if (err instanceof Error && !err.message.includes('TensorFlow')) {
            originalError("AI Init Error (Network issue?):", err);
            setStatus('NETWORK ERROR');
        }
        setIsModelLoading(false);
      }
    };

    const renderLoop = () => {
      if (!isActiveRef.current || !videoRef.current || !canvasRef.current || !isMounted) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx || !faceLandmarker.current || !handLandmarker.current) return;

      if (video.readyState < 2 || video.currentTime === lastProcessingTime.current) {
        animationId = requestAnimationFrame(renderLoop);
        return;
      }
      lastProcessingTime.current = video.currentTime;

      // 1. Draw Video
      ctx.save();
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.filter = 'contrast(1.1) brightness(0.85) saturate(0.9)';
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      const timestamp = performance.now();
      const faceResults = faceLandmarker.current.detectForVideo(video, timestamp);
      const handResults = handLandmarker.current.detectForVideo(video, timestamp);

      const now = Date.now();
      const timeSinceLast = now - lastTriggerTime.current;
      const isInCooldown = timeSinceLast < COOLDOWN_MS;

      // Cooldown visualization
      if (isInCooldown) {
        setCooldownProgress((timeSinceLast / COOLDOWN_MS) * 100);
        if (timeSinceLast > 1000) setStatus('');
      } else {
        setCooldownProgress(100);
      }

      // --- FACE LOGIC & VISUALS ---
      let isClosed = false;

      if (faceResults.faceBlendshapes?.[0]) {
        const blendshapes = faceResults.faceBlendshapes[0].categories;
        const eyeBlinkLeft = blendshapes.find(s => s.categoryName === "eyeBlinkLeft")?.score || 0;
        const eyeBlinkRight = blendshapes.find(s => s.categoryName === "eyeBlinkRight")?.score || 0;
        
        // Lowered threshold for better sensitivity
        isClosed = eyeBlinkLeft > 0.4 && eyeBlinkRight > 0.4; 

        if (!isInCooldown) {
          if (isClosed) {
            if (!eyeClosedStart.current) eyeClosedStart.current = now;
            else if (now - eyeClosedStart.current > 1000) {
              setStatus('NEXT (EYES)');
              onNextRef.current();
              triggerAction(now);
            } else {
              setStatus('HOLD...');
            }
          } else if (eyeClosedStart.current) {
            const duration = now - eyeClosedStart.current;
            eyeClosedStart.current = null;
            if (duration > 50 && duration < 500) {
              blinkCount.current++;
              lastBlinkTime.current = now;
              if (blinkCount.current >= 2) {
                setStatus('LIKED (EYES)');
                onActionRef.current();
                triggerAction(now);
              }
            } else {
              if (status === 'HOLD...') setStatus('');
            }
          }
          if (blinkCount.current > 0 && now - lastBlinkTime.current > 600) {
            blinkCount.current = 0;
            setStatus('');
          }
        }
      }

      // --- Face Tech Visualization (EYES ONLY) ---
      if (faceResults.faceLandmarks && faceResults.faceLandmarks.length > 0) {
        const face = faceResults.faceLandmarks[0];
        
        ctx.save();
        // Style configuration matching hand
        ctx.shadowColor = isClosed ? "rgba(59, 130, 246, 0.8)" : "rgba(34, 211, 238, 0.6)"; 
        ctx.shadowBlur = 6;
        ctx.strokeStyle = "rgba(103, 232, 249, 0.25)"; 
        ctx.lineWidth = 0.6;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        // Only draw connections for Left Eye and Right Eye
        const FACE_CONNECTIONS = [
            // Left Eye Ring
            [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246, 33],
            // Right Eye Ring
            [263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388, 466, 263]
        ];

        FACE_CONNECTIONS.forEach(path => {
            ctx.beginPath();
            if (face[path[0]]) {
              ctx.moveTo((1 - face[path[0]].x) * canvas.width, face[path[0]].y * canvas.height);
              for (let i = 1; i < path.length; i++) {
                  if (face[path[i]]) {
                    ctx.lineTo((1 - face[path[i]].x) * canvas.width, face[path[i]].y * canvas.height);
                  }
              }
              ctx.stroke();
            }
        });

        // Glowing Key Points (Only Inner/Outer eye corners)
        const highlightPoints = [33, 133, 362, 263]; 
        
        ctx.fillStyle = isClosed ? "#60a5fa" : "#ffffff";
        ctx.shadowBlur = 10;
        ctx.shadowColor = isClosed ? "#2563eb" : "#22d3ee";
        
        highlightPoints.forEach(idx => {
            if(face[idx]) {
                const x = (1 - face[idx].x) * canvas.width;
                const y = face[idx].y * canvas.height;
                ctx.beginPath();
                ctx.arc(x, y, 1.5, 0, 2 * Math.PI);
                ctx.fill();
            }
        });
        
        ctx.restore();
      }

      // --- HAND LOGIC ---
      if (handResults.landmarks && handResults.landmarks.length > 0) {
        const hand = handResults.landmarks[0]; // Use first detected hand
        
        // --- VISUALIZATION: FUTURE TECH HUD STYLE ---
        ctx.save();
        
        // 1. Config for Tech Lines
        ctx.shadowColor = "rgba(34, 211, 238, 0.6)"; // cyan-400
        ctx.shadowBlur = 6;
        ctx.strokeStyle = "rgba(103, 232, 249, 0.3)"; // cyan-200 low opacity
        ctx.lineWidth = 0.8;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        const connections = [
          [0, 1, 2, 3, 4], [0, 5, 6, 7, 8], [5, 9, 13, 17, 0],
          [9, 10, 11, 12], [13, 14, 15, 16], [17, 18, 19, 20]
        ];
        
        // Draw Skeleton Lines
        connections.forEach(path => {
          ctx.beginPath();
          ctx.moveTo((1 - hand[path[0]].x) * canvas.width, hand[path[0]].y * canvas.height);
          for (let i = 1; i < path.length; i++) {
            ctx.lineTo((1 - hand[path[i]].x) * canvas.width, hand[path[i]].y * canvas.height);
          }
          ctx.stroke();
        });
        
        // Draw Nodes
        hand.forEach((pt, index) => {
            const x = (1 - pt.x) * canvas.width;
            const y = pt.y * canvas.height;
            const isTip = [4, 8, 12, 16, 20].includes(index);
            const isWrist = index === 0;
            
            ctx.beginPath();
            
            if (isTip) {
                // Active fingertips: White core, Cyan glow
                ctx.fillStyle = "#ffffff";
                ctx.shadowColor = "rgba(34, 211, 238, 1)";
                ctx.shadowBlur = 12;
                ctx.arc(x, y, 2, 0, Math.PI * 2);
                ctx.fill();
                
                // Outer ring for UI feel
                ctx.beginPath();
                ctx.strokeStyle = "rgba(34, 211, 238, 0.8)";
                ctx.lineWidth = 0.5;
                ctx.shadowBlur = 0;
                ctx.arc(x, y, 5, 0, Math.PI * 2);
                ctx.stroke();
            } else if (isWrist) {
                // Wrist: Anchor point
                ctx.fillStyle = "rgba(34, 211, 238, 0.8)";
                ctx.shadowBlur = 8;
                ctx.shadowColor = "rgba(34, 211, 238, 0.5)";
                ctx.arc(x, y, 2.5, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Joints: Small, subtle
                ctx.fillStyle = "rgba(165, 243, 252, 0.6)"; // cyan-100
                ctx.shadowBlur = 0;
                ctx.arc(x, y, 1.2, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        
        ctx.restore();
        
        // Key Landmarks for Logic
        const thumbTip = hand[4];
        const indexTip = hand[8];
        const middleTip = hand[12];
        const ringTip = hand[16];
        const pinkyTip = hand[20];
        const wrist = hand[0];

        // 1. Victory (Peace Sign) Detection -> Like
        // Index and Middle fingers Extended (Tip higher than PIP), Ring and Pinky Curled (Tip lower than PIP)
        // Note: Y increases downwards. Smaller Y is "higher".
        const isVictory = 
            hand[8].y < hand[6].y &&   // Index UP
            hand[12].y < hand[10].y && // Middle UP
            hand[16].y > hand[14].y && // Ring DOWN
            hand[20].y > hand[18].y;   // Pinky DOWN

        // 2. Open Palm Detection -> Download
        // All fingers UP, and NOT Victory
        const isPalmOpen = 
            hand[4].y < hand[3].y && 
            hand[8].y < hand[6].y && 
            hand[12].y < hand[10].y && 
            hand[16].y < hand[14].y && 
            hand[20].y < hand[18].y &&
            !isVictory;

        // 3. Vertical Swipe Detection
        const currentY = indexTip.y;

        if (!isInCooldown) {
          // --- Hand Action Triggers ---

          if (isVictory) {
             setStatus('LIKED (PEACE)');
             onActionRef.current();
             triggerAction(now);
          }
          else if (isPalmOpen) {
            if (!palmOpenStart.current) palmOpenStart.current = now;
            else if (now - palmOpenStart.current > 1000) {
                setStatus('DOWNLOAD');
                onDownloadRef.current();
                triggerAction(now);
            } else {
                setStatus('HOLD FOR DL...');
            }
          } else {
            palmOpenStart.current = null;
            if (status === 'HOLD FOR DL...') setStatus('');
          }

          // Swipe Logic
          if (lastIndexY.current !== null && !isVictory && !isPalmOpen) {
            const deltaY = currentY - lastIndexY.current;
            const THRESHOLD = 0.08; 

            // Note: Y increases downwards in Mediapipe
            if (deltaY < -THRESHOLD) {
              // Moving UP significantly
              setStatus('PREV (UP)');
              onPrevRef.current();
              triggerAction(now);
            } else if (deltaY > THRESHOLD) {
              // Moving DOWN significantly
              setStatus('NEXT (DOWN)');
              onNextRef.current();
              triggerAction(now);
            }
          }
        }
        
        // Better swipe logic:
        // Only update `lastIndexY` if it's null (start of tracking) or after Action.
        // Actually, let's just use a lagging pointer.
        if (!lastIndexY.current) lastIndexY.current = currentY;
        // Move lastIndexY towards currentY slowly (smoothing)
        lastIndexY.current = lastIndexY.current * 0.8 + currentY * 0.2; 
        
        const diff = currentY - lastIndexY.current;
        if (!isInCooldown) {
            if (diff < -0.06) { // Fast Up
                 setStatus('PREV');
                 onPrevRef.current();
                 triggerAction(now);
            } else if (diff > 0.06) { // Fast Down
                 setStatus('NEXT');
                 onNextRef.current();
                 triggerAction(now);
            }
        }
      } else {
          lastIndexY.current = null;
          palmOpenStart.current = null;
      }

      animationId = requestAnimationFrame(renderLoop);
    };

    const triggerAction = (time: number) => {
      lastTriggerTime.current = time;
      eyeClosedStart.current = null;
      blinkCount.current = 0;
      lastIndexY.current = null; // Reset swipe tracker
      palmOpenStart.current = null;
    };

    if (isActive) initAI();

    return () => {
      isMounted = false;
      cancelAnimationFrame(animationId);
      if (stream) stream.getTracks().forEach(track => track.stop());
      [faceLandmarker.current, handLandmarker.current].forEach(m => m?.close());
      
      console.log = originalLog;
      console.info = originalInfo;
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div className="fixed bottom-8 right-8 z-[90] flex items-end pointer-events-none">
      <div className="flex flex-col items-center gap-3 group">
        <div className={`relative w-72 h-48 rounded-[2rem] overflow-hidden border-2 transition-all duration-1000 bg-zinc-900 shadow-[0_30px_90px_rgba(0,0,0,0.9)] ${
          cooldownProgress < 100 ? 'border-blue-500/20 scale-95 opacity-80' : 'border-white/10'
        }`}>
          <video ref={videoRef} className="hidden" playsInline muted />
          <canvas ref={canvasRef} width="720" height="480" className="w-full h-full object-cover" />
          
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              {isModelLoading && (
                  <div className="flex flex-col items-center gap-3 animate-pulse">
                    <div className="w-4 h-4 border border-white/20 border-t-blue-500 rounded-full animate-spin" />
                    <span className="text-[6px] text-white/30 tracking-[0.6em] uppercase font-bold">Neural Link</span>
                  </div>
              )}
              {status && !isModelLoading && (
                  <div className="px-5 py-2 bg-blue-600/70 text-white text-[8px] rounded-full font-black shadow-2xl animate-pulse uppercase tracking-[0.3em] border border-white/10 backdrop-blur-md">
                      {status}
                  </div>
              )}
          </div>
          <div className="absolute bottom-0 left-0 h-[1.5px] bg-blue-500/80 shadow-[0_0_10px_#3b82f6] transition-all duration-100" style={{ width: `${cooldownProgress}%` }} />
        </div>
        <div className="flex items-center gap-2 px-5 py-2 bg-black/60 backdrop-blur-2xl rounded-full border border-white/10 shadow-xl">
            <div className={`w-1 h-1 rounded-full ${cooldownProgress < 100 ? 'bg-amber-500' : 'bg-blue-500 animate-pulse'}`} />
            <span className="text-[7px] text-white/40 tracking-[0.5em] uppercase font-black">
                {cooldownProgress < 100 ? 'Syncing Flow' : 'Spatial Interface'}
            </span>
        </div>
      </div>
    </div>
  );
};
