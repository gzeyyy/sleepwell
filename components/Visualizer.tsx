import React, { useRef, useEffect } from 'react';
import { VisualizerState } from '../types';

interface VisualizerProps {
  state: VisualizerState;
}

// Helper for smooth interpolation
const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor;

const Visualizer: React.FC<VisualizerProps> = ({ state }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  
  // Physics state
  const volumeRef = useRef(0); 
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      // Handle high DPI displays for crisp edges
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
    };
    window.addEventListener('resize', resize);
    resize();

    const draw = () => {
      timeRef.current += 0.008; // Silky slow movement
      const t = timeRef.current;
      
      // Smooth Volume Transition
      const targetVol = state.volume > 0.01 ? Math.min(state.volume * 2.0, 1) : 0;
      volumeRef.current = lerp(volumeRef.current, targetVol, 0.08); // Slightly faster response for "lively" feel
      const vol = volumeRef.current;

      const width = window.innerWidth;
      const height = window.innerHeight;

      ctx.clearRect(0, 0, width, height);

      // Only draw if there is some volume or to maintain a faint "breathing" border
      const activeState = vol > 0.01 || state.isTalking;
      
      // Configuration for the "Silk"
      // We draw waves on all 4 edges.
      // Top, Right, Bottom, Left
      
      const layers = 3; // Number of overlapping silk sheets
      const maxReach = Math.min(width, height) * 0.15; // Max distance inward from edge
      
      // Colors: Deep, mysterious, not bright.
      // Idle: Transparent.
      // Active: Indigo/Violet/Cyan gradient feels.
      
      ctx.globalCompositeOperation = 'screen'; // Soft glowing blending
      
      // Function to draw a wave along an edge
      const drawEdge = (edge: 'top' | 'right' | 'bottom' | 'left') => {
        for (let i = 0; i < layers; i++) {
            ctx.beginPath();
            
            // Color calculation based on layer and state
            // Layer 0: Inner core (brighter), Layer 2: Outer mist (fainter)
            const alpha = activeState 
                ? (0.15 - i * 0.03) + (vol * 0.2) // Volume boosts alpha
                : 0.02; // Very faint idle state
            
            // Hue shift: 
            // AI (Talking) -> Warm/Purple (260-300)
            // User -> Cool/Cyan (180-220)
            const baseHue = state.isTalking ? 270 : 200;
            const hue = baseHue + (i * 15) + Math.sin(t) * 10;
            
            ctx.fillStyle = `hsla(${hue}, 60%, 60%, ${alpha})`;

            // Wave parameters
            // Amplitude grows with volume
            const amplitude = (activeState ? 10 + (vol * 50) : 5) * (1 - i * 0.2); 
            const frequency = 0.005 + (i * 0.002);
            const phase = t * (2 + i) + (i * 10);
            
            // The "Reach" determines how thick the silk band is
            const currentReach = (activeState ? maxReach * vol : 10) + (Math.sin(t + i)*5);

            if (edge === 'top') {
                ctx.moveTo(0, 0);
                for (let x = 0; x <= width; x += 20) {
                    const y = Math.sin(x * frequency + phase) * amplitude + (Math.sin(x * frequency * 2 + t) * amplitude * 0.5);
                    // Bias y downwards
                    ctx.lineTo(x, Math.abs(y) + (currentReach * (Math.sin(x/width * Math.PI)))); 
                }
                ctx.lineTo(width, 0);
                ctx.closePath();
            } else if (edge === 'bottom') {
                ctx.moveTo(0, height);
                for (let x = 0; x <= width; x += 20) {
                    const y = Math.sin(x * frequency + phase) * amplitude;
                    ctx.lineTo(x, height - (Math.abs(y) + (currentReach * (Math.sin(x/width * Math.PI)))));
                }
                ctx.lineTo(width, height);
                ctx.closePath();
            } else if (edge === 'left') {
                ctx.moveTo(0, 0);
                for (let y = 0; y <= height; y += 20) {
                    const x = Math.sin(y * frequency + phase) * amplitude;
                    ctx.lineTo(Math.abs(x) + (currentReach * (Math.sin(y/height * Math.PI))), y);
                }
                ctx.lineTo(0, height);
                ctx.closePath();
            } else if (edge === 'right') {
                ctx.moveTo(width, 0);
                for (let y = 0; y <= height; y += 20) {
                    const x = Math.sin(y * frequency + phase) * amplitude;
                    ctx.lineTo(width - (Math.abs(x) + (currentReach * (Math.sin(y/height * Math.PI)))), y);
                }
                ctx.lineTo(width, height);
                ctx.closePath();
            }

            ctx.fill();
        }
      };

      drawEdge('top');
      drawEdge('bottom');
      drawEdge('left');
      drawEdge('right');

      frameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(frameRef.current);
    };
  }, [state]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 pointer-events-none z-20 mix-blend-screen" 
    />
  );
};

export default Visualizer;