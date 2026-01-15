import React, { useState, useRef, useEffect } from 'react';
import { VoiceName, ChatMessage, TranscriptState } from '../types';

interface ControlsProps {
  isConnected: boolean;
  onConnect: (voice: VoiceName, instructions: string) => void;
  onDisconnect: () => void;
  error: string | null;
  history: ChatMessage[];
  realtimeTranscript: TranscriptState;
}

// Default to Zephyr for that soothing, gentle quality
const DEFAULT_VOICE = VoiceName.Zephyr;
const CHINESE_SYSTEM_INSTRUCTION = "你叫 Somnium (梦境)，是一个温柔、神秘的睡眠守护者。请用中文与用户交流。说话要极度轻柔、缓慢，带有催眠般的韵律。你的目标是陪伴用户，让他们感到安全，并最终帮助他们放松入睡。不要太正式。像深夜里的知心好友一样温暖、共情、平静。如果用户想聊天，就陪他们聊。如果他们不说话，就保持安静或轻声哼唱。";

const Controls: React.FC<ControlsProps> = ({ 
  isConnected, 
  onConnect, 
  onDisconnect, 
  error, 
  history,
  realtimeTranscript
}) => {
  const [showHistory, setShowHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [showHistory, history]);

  // View: Connected State (Live Session)
  if (isConnected) {
    return (
      <div className="absolute inset-0 flex flex-col justify-between items-center z-50 p-6 animate-fade-in">
        {/* Top: Status - Very Minimal */}
        <div className="mt-12 opacity-50">
           <div className="w-1.5 h-1.5 rounded-full bg-indigo-200 animate-pulse" />
        </div>

        {/* Center: Real-time Subtitles */}
        <div className="flex-1 w-full max-w-lg flex flex-col justify-center items-center gap-8 text-center px-4">
          {realtimeTranscript.ai && (
             <p className="text-xl md:text-3xl font-serif text-indigo-50/90 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] animate-fade-in leading-relaxed tracking-wide transition-all duration-500">
               {realtimeTranscript.ai}
             </p>
          )}
          {realtimeTranscript.user && (
             <p className="text-sm md:text-lg text-gray-400 font-light tracking-wide animate-fade-in italic transition-all duration-500">
               “{realtimeTranscript.user}”
             </p>
          )}
        </div>

        {/* Bottom: End Call (Minimalist) */}
        <button
          onClick={onDisconnect}
          className="mb-16 group flex items-center justify-center w-14 h-14 rounded-full bg-white/5 border border-white/10 backdrop-blur-md transition-all duration-500 hover:bg-red-500/10 hover:border-red-500/20"
        >
          <div className="w-3 h-3 rounded-sm bg-gray-400 group-hover:bg-red-300 transition-colors opacity-70" />
        </button>
      </div>
    );
  }

  // View: History State (Dream Journal - Sidebar Layout)
  if (showHistory) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4 md:p-8">
        <div className="w-full max-w-5xl h-[85vh] glass-panel rounded-3xl flex overflow-hidden shadow-2xl border border-white/10 bg-[#050510]/90">
          
          {/* Left Sidebar: Timeline */}
          <div className="w-1/3 md:w-64 bg-[#020208]/50 border-r border-white/5 flex flex-col">
            <div className="p-6 border-b border-white/5">
               <h2 className="text-lg text-white font-serif tracking-wider">梦境时间轴</h2>
               <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-1">Timeline</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
               {/* Current Session (Active) */}
               <button className="w-full text-left px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 group transition-all">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-indigo-200 font-medium tracking-wide">今夜</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_5px_rgba(129,140,248,0.5)]"></div>
                  </div>
                  <p className="text-[10px] text-gray-400 truncate">
                     {history.length > 0 ? history[history.length-1].text : "新梦境..."}
                  </p>
               </button>

               {/* Mock Past Sessions (Disabled style) */}
               <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/5 border border-transparent transition-all opacity-50 cursor-not-allowed">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-400 font-medium tracking-wide">昨夜</span>
                  </div>
                  <p className="text-[10px] text-gray-600 truncate">星空很美，不是吗...</p>
               </button>
               <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/5 border border-transparent transition-all opacity-50 cursor-not-allowed">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-400 font-medium tracking-wide">3天前</span>
                  </div>
                  <p className="text-[10px] text-gray-600 truncate">放松呼吸，慢慢来...</p>
               </button>
            </div>
            
            {/* Back Button Mobile Only (or hidden if desktop has close) */}
            <div className="p-4 border-t border-white/5 md:hidden">
              <button onClick={() => setShowHistory(false)} className="text-xs text-gray-400 hover:text-white">关闭</button>
            </div>
          </div>

          {/* Right Content: Chat Details */}
          <div className="flex-1 flex flex-col bg-gradient-to-b from-transparent to-[#0A0A15]/50">
             {/* Header */}
             <div className="h-16 border-b border-white/5 flex items-center justify-between px-8">
                <div>
                   <span className="text-xs text-indigo-300/60 uppercase tracking-widest">记录详情</span>
                </div>
                <button 
                  onClick={() => setShowHistory(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
             </div>

             {/* Chat Area */}
             <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth">
                {history.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-30">
                      <div className="w-16 h-16 border border-dashed border-gray-500 rounded-full flex items-center justify-center mb-4">
                        <span className="text-2xl">☾</span>
                      </div>
                      <p className="text-xs tracking-[0.2em] uppercase">空空如也的梦</p>
                  </div>
                ) : (
                  history.map((msg, idx) => (
                    <div 
                      key={idx} 
                      className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-fade-in-up`}
                      style={{ animationDelay: `${idx * 0.05}s` }}
                    >
                      <div className={`max-w-[75%] px-6 py-5 text-sm leading-8 tracking-wide font-light shadow-lg backdrop-blur-md ${
                        msg.role === 'user' 
                          ? 'bg-[#1a1a2e]/60 border border-indigo-500/10 text-indigo-50 rounded-2xl rounded-tr-sm' 
                          : 'bg-white/5 border border-white/5 text-gray-200 rounded-2xl rounded-tl-sm'
                      }`}>
                        {msg.text}
                      </div>
                      <span className="text-[9px] text-gray-600 mt-2 px-2 uppercase tracking-wider opacity-60">
                        {msg.role === 'user' ? 'You' : 'Somnium'} • {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  ))
                )}
             </div>
          </div>

        </div>
      </div>
    );
  }

  // View: Initial Start Screen (Homepage)
  return (
    <div className="relative z-50 w-full h-full flex flex-col items-center justify-between py-16 px-6">
      
      {/* 1. Header Area - Subtle & Elegant */}
      <div className="mt-12 text-center">
        <h1 className="text-4xl md:text-5xl text-indigo-100/80 font-serif tracking-[0.2em] mb-3 drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">
          SOMNIUM
        </h1>
        <p className="text-indigo-200/30 text-[10px] tracking-[0.5em] uppercase font-light">
          Dream Companion
        </p>
      </div>

      {/* 2. Main Action Area - "The Dream Bubble" */}
      <div className="flex-1 flex flex-col items-center justify-center w-full relative">
         
         <button
            onClick={() => onConnect(DEFAULT_VOICE, CHINESE_SYSTEM_INSTRUCTION)}
            className="group relative focus:outline-none"
         >
            {/* The Breathing Glow (Behind) - Reduced brightness */}
            <div className="absolute inset-0 bg-indigo-600 rounded-full blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity duration-[2000ms]"></div>
            
            {/* The Bubble Itself - More glass, less opaque */}
            <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-full bg-gradient-to-b from-white/5 to-transparent backdrop-blur-[2px] border border-white/10 shadow-[inset_0_0_30px_rgba(255,255,255,0.05)] flex items-center justify-center transition-transform duration-[4000ms] ease-in-out transform hover:scale-105 animate-breathe">
                
                {/* Inner Moon Texture (Very Subtle) */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-indigo-200/5 to-white/10 opacity-50"></div>
                
                {/* Text */}
                <div className="relative z-10 flex flex-col items-center gap-2">
                   <span className="text-xl md:text-2xl text-white/70 font-serif tracking-widest drop-shadow-sm group-hover:text-white transition-colors duration-500">
                     入 梦
                   </span>
                   <span className="text-[9px] text-indigo-200/30 tracking-[0.2em] uppercase group-hover:text-indigo-200/50 transition-colors">
                     Enter
                   </span>
                </div>
            </div>
         </button>

         {error && (
            <div className="absolute top-[75%] text-center animate-pulse">
               <p className="text-red-300/40 text-[10px] tracking-wider">{error}</p>
            </div>
         )}
      </div>

      {/* 3. Bottom Module: Dream Journal - Minimalist Bar */}
      <div className="w-full max-w-xs mb-8">
         <button 
           onClick={() => setShowHistory(true)}
           className="w-full group rounded-full bg-white/5 hover:bg-white/10 border border-white/5 transition-all duration-500 px-6 py-3 flex items-center justify-between backdrop-blur-sm"
         >
             <div className="flex items-center gap-3">
               <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/30 group-hover:bg-indigo-400 transition-colors"></div>
               <span className="text-[10px] text-indigo-200/50 uppercase tracking-widest group-hover:text-indigo-100 transition-colors">
                 Dream Journal
               </span>
             </div>
             <span className="text-gray-600 group-hover:text-gray-400 transition-colors text-[10px] transform group-hover:translate-x-1 duration-300">→</span>
         </button>
      </div>

      <style>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        .animate-breathe {
          animation: breathe 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Controls;