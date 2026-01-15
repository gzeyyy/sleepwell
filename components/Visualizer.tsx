import React, { useRef, useEffect } from 'react';
import { VisualizerState } from '../types';

interface VisualizerProps {
  state: VisualizerState;
}

// Helper: Linear Interpolation for smooth animation
const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor;

// Helper: Organic Noise function (Sum of sines)
// More complexity = more "liquid" feel
const getWaveHeight = (x: number, t: number, frequency: number, complexity: number) => {
  let y = Math.sin(x * frequency + t);
  if (complexity > 1) y += Math.sin(x * frequency * 2.1 + t * 1.5) * 0.5;
  if (complexity > 2) y += Math.sin(x * frequency * 1.72 - t * 0.4) * 0.3; 
  if (complexity > 3) y += Math.sin(x * frequency * 3.5 + t * 2.0) * 0.1; // Fine detail
  return y;
};

const Visualizer: React.FC<VisualizerProps> = ({ state }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  
  // Physics State Refs (to keep values between renders)
  const volumeRef = useRef(0);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configuration for the "Aurora" layers
    const WAVE_LAYERS = [
      // Base Layer: Deep Ocean (Slow, wide)
      { color: 'rgba(30, 58, 138, 0.5)', speed: 0.002, freq: 0.0015, ampScale: 0.2, yOffset: 40 }, 
      // Mid Layer: Indigo Mist (Medium speed)
      { color: 'rgba(99, 102, 241, 0.4)', speed: 0.004, freq: 0.0025, ampScale: 0.5, yOffset: 60 },
      // Top Layer: Violet Ether (Fastest, reactive)
      { color: 'rgba(167, 139, 250, 0.35)', speed: 0.007, freq: 0.0035, ampScale: 0.8, yOffset: 90 },
      // Highlight Layer: Cyan tint (Only visible when loud)
      { color: 'rgba(34, 211, 238, 0.2)', speed: 0.01, freq: 0.005, ampScale: 1.0, yOffset: 100 },
    ];

    const resize = () => {
      // Lower DPR creates a softer, more analog look which is good for this effect
      const dpr = 1; 
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    window.addEventListener('resize', resize);
    resize();

    const draw = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;

      // 1. Physics & Time Update
      // Smooth volume interpolation
      const targetVol = state.volume > 0.01 ? Math.min(state.volume * 2.5, 1.5) : 0;
      // Fast attack, very slow release for "lingering" feel
      const lerpFactor = targetVol > volumeRef.current ? 0.15 : 0.03;
      volumeRef.current = lerp(volumeRef.current, targetVol, lerpFactor);
      
      const vol = volumeRef.current;
      
      // Time moves faster when loud
      const timeSpeed = 0.5 + (vol * 1.5); 
      timeRef.current += 0.008 * timeSpeed;
      const t = timeRef.current;

      // Clear Canvas
      ctx.clearRect(0, 0, w, h);

      // 2. Draw Layers
      WAVE_LAYERS.forEach((layer, i) => {
        ctx.fillStyle = layer.color;
        
        ctx.beginPath();
        ctx.moveTo(0, h);

        const vertexCount = 40; // More points for smoother curves
        const step = w / vertexCount;

        for (let x = 0; x <= w + step; x += step) {
          // Noise inputs
          const noise = getWaveHeight(x, t * layer.speed * 100, layer.freq, 4);
          
          // Amplitude calculation
          // Base idle breathing + volume reaction
          const idleAmp = 30; 
          const activeAmp = vol * 400 * layer.ampScale;
          const currentAmp = idleAmp + activeAmp;
          
          // Bell curve mask: Waves are high in center, low at edges
          const centerBias = Math.pow(Math.sin((x / w) * Math.PI), 1.5); 
          
          const yBase = h - (h * 0.15); // Anchor point
          const yNoise = noise * currentAmp * centerBias;
          const yLift = vol * 100 * centerBias; // Lift entire wave up when loud
          
          ctx.lineTo(x, yBase + yNoise - yLift + layer.yOffset);
        }

        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fill();
      });

      // 3. Ambient Glow (Bottom Center)
      // Adds a sense of depth/light source
      if (vol > 0.05) {
        const glowRadius = 300 + (vol * 400);
        const glowAlpha = Math.min(vol * 0.3, 0.4);
        const grad = ctx.createRadialGradient(w/2, h + 100, 0, w/2, h + 100, glowRadius);
        grad.addColorStop(0, `rgba(139, 92, 246, ${glowAlpha})`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = grad;
        ctx.fillRect(0, h - glowRadius, w, glowRadius);
        ctx.globalCompositeOperation = 'source-over';
      }

      frameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(frameRef.current);
    };
  }, [state]);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
       {/* 
          Increased blur to 100px for maximum "silk/aurora" effect.
          Scale-y-125 ensures the bottom edge is hidden.
       */}
       <div className="absolute inset-0 w-full h-full blur-[100px] scale-y-125 translate-y-20 mix-blend-screen opacity-90">
          <canvas ref={canvasRef} className="w-full h-full" />
       </div>
    </div>
  );
};

export default Visualizer;