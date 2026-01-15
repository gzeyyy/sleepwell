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

const DEFAULT_VOICE = VoiceName.Zephyr;
const CHINESE_SYSTEM_INSTRUCTION = "你叫 Somnium，是用户的入眠伴侣。请用中文交流。你的声音需要极度轻柔、缓慢、慵懒，像深夜的耳语。不要使用激动的语气。你的任务是帮助用户放松神经，引导他们入睡。如果用户想聊天，就温柔地回应；如果用户不说话，就保持安静或哼唱轻柔的旋律。永远保持耐心和温暖。";

const Controls: React.FC<ControlsProps> = ({ 
  isConnected, 
  onConnect, 
  onDisconnect, 
  error, 
  history,
  realtimeTranscript
}) => {
  const [showHistory, setShowHistory] = useState(false);
  const [showMobileList, setShowMobileList] = useState(false); // Mobile: controls visibility of the list/menu
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logic
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [showHistory, history, showMobileList]);

  // Handle Disconnect Wrapper
  const handleEndCall = () => {
    onDisconnect();
    // Show history view
    setShowHistory(true);
    // On mobile, default to showing the chat detail, not the list
    setShowMobileList(false);
  };

  const handleStartNew = () => {
      setShowHistory(false); 
  };

  // View: Connected State (Live Session)
  if (isConnected) {
    return (
      <div className="absolute inset-0 flex flex-col justify-between items-center z-50 p-6 animate-fade-in">
        
        {/* Top: Status & Live Indicator */}
        <div className="mt-12 flex flex-col items-center gap-2 opacity-80">
           <div className="flex items-center gap-2 px-4 py-1 rounded-full bg-white/5 backdrop-blur-md border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
              <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse shadow-[0_0_10px_rgba(129,140,248,0.8)]" />
              <span className="text-xs text-indigo-100 font-medium tracking-wide">Live</span>
           </div>
        </div>

        {/* Center: Real-time Interaction */}
        <div className="flex-1 w-full max-w-xl flex flex-col justify-center items-center text-center px-4 relative">
          
          {/* Interruption Hint */}
          <div className="absolute top-[20%] w-full opacity-0 animate-[fadeIn_2s_ease-in_2s_forwards]">
             <p className="text-white/30 text-sm font-light tracking-widest drop-shadow-md">
                如要打断，请点按或开始讲话
             </p>
          </div>

          {/* Transcript Area */}
          <div className="space-y-8 mt-10 w-full px-2">
            {realtimeTranscript.ai && (
               <div className="animate-fade-in-up">
                 <p className="text-xs text-indigo-300/50 mb-3 uppercase tracking-wider font-medium">Somnium</p>
                 <p className="text-2xl md:text-3xl font-light text-white/95 leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)]">
                   {realtimeTranscript.ai}
                 </p>
               </div>
            )}
            
            {realtimeTranscript.user && (
               <div className="animate-fade-in-up opacity-60">
                 <p className="text-xs text-gray-400/50 mb-3 uppercase tracking-wider font-medium">你</p>
                 <p className="text-xl md:text-2xl text-white/80 font-light italic">
                   “{realtimeTranscript.user}”
                 </p>
               </div>
            )}
          </div>
        </div>

        {/* Bottom: Controls */}
        <div className="mb-20 flex items-center justify-center gap-8">
            {/* Visualizer/Placeholder Button */}
             <div className="w-12 h-12 rounded-full bg-white/5 backdrop-blur-sm flex items-center justify-center opacity-30 border border-white/5">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
            </div>

            {/* End Call Button */}
            <button
              onClick={handleEndCall}
              className="group flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 shadow-[0_0_30px_rgba(220,38,38,0.3)] transition-all duration-300 hover:scale-105 active:scale-95 border border-white/10"
            >
              <svg className="w-8 h-8 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Hidden Placeholder for symmetry (Keyboard icon removed as per request) */}
            <div className="w-12 h-12 opacity-0"></div>
        </div>
      </div>
    );
  }

  // View: History State (Sleep Records)
  if (showHistory) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl animate-fade-in">
        {/* Main Card Container */}
        <div className="w-full h-full md:max-w-6xl md:h-[85vh] md:rounded-[2rem] md:border border-white/10 flex overflow-hidden bg-[#0c0c14]/40 shadow-2xl relative">
          
          {/* ================= Sidebar / Menu List ================= */}
          {/* Desktop: Always visible. Mobile: Overlay when toggled */}
          <div className={`
              absolute inset-0 z-30 bg-[#0c0c14]/95 backdrop-blur-xl transition-transform duration-500 ease-out
              md:relative md:inset-auto md:w-80 md:bg-white/5 md:backdrop-blur-none md:border-r border-white/5 md:transform-none md:flex md:flex-col
              ${showMobileList ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          `}>
            
            {/* Sidebar Header with Elegant "Start New" */}
            <div className="p-6 md:pt-10">
                {/* Mobile Only: Close Menu Button */}
                <div className="flex justify-between items-center mb-8 md:hidden">
                    <span className="text-sm font-serif text-gray-400 tracking-[0.2em] uppercase">Menu</span>
                    <button onClick={() => setShowMobileList(false)} className="p-2 text-gray-400 hover:text-white">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* The "Start New" Button - Organic & Ethereal Style */}
                <button 
                   onClick={handleStartNew}
                   className="w-full group relative overflow-hidden rounded-2xl p-[1px] shadow-lg shadow-indigo-900/30 transition-transform active:scale-[0.98]"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 animate-spin-slow opacity-70"></div>
                    <div className="relative bg-[#1a1a2e] rounded-2xl px-4 py-4 flex items-center justify-center gap-3 transition-colors group-hover:bg-[#1f1f35]">
                         <span className="text-indigo-300">✦</span>
                         <span className="text-sm font-medium text-white tracking-widest uppercase">发起新入眠</span>
                    </div>
                </button>

                {/* Search - Minimalist */}
                <div className="mt-8 mb-4 relative">
                    <input 
                      type="text" 
                      placeholder="Search dreams..." 
                      className="w-full bg-transparent border-b border-white/10 py-2 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                    />
                     <svg className="absolute right-0 top-2 h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            {/* List Items - Clean & Flowing */}
            <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-2">
               <p className="px-2 text-[10px] font-medium text-gray-500 uppercase tracking-[0.2em] mb-4">Timeline</p>
               
               {/* Active Item */}
               <div 
                 onClick={() => setShowMobileList(false)}
                 className="group cursor-pointer p-4 rounded-xl hover:bg-white/5 transition-all duration-300"
               >
                   <div className="flex justify-between items-baseline mb-1">
                    <h3 className="text-sm font-medium text-indigo-200 group-hover:text-white transition-colors">本次入眠记录</h3>
                    <span className="text-[10px] text-indigo-400/50">Just now</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 truncate group-hover:text-gray-400 transition-colors">
                    {history.length > 0 ? history[history.length-1].text : "开始入睡..."}
                  </p>
               </div>

               {/* Mock Past Items */}
               <div className="group cursor-pointer p-4 rounded-xl hover:bg-white/5 transition-all duration-300 opacity-60">
                  <h3 className="text-sm font-medium text-gray-400 group-hover:text-gray-300">睡前冥想引导</h3>
                  <p className="text-xs text-gray-600 mt-1 truncate">Somnium: 深呼吸，感受...</p>
               </div>
               
               <div className="group cursor-pointer p-4 rounded-xl hover:bg-white/5 transition-all duration-300 opacity-60">
                  <h3 className="text-sm font-medium text-gray-400 group-hover:text-gray-300">深夜故事会</h3>
                  <p className="text-xs text-gray-600 mt-1 truncate">你: 讲个关于星星的故事吧</p>
               </div>
            </div>
            
             {/* Mobile Footer Area */}
            <div className="p-6 md:hidden border-t border-white/5 text-center">
                <button 
                    onClick={() => setShowHistory(false)}
                    className="text-xs text-gray-600 hover:text-white uppercase tracking-widest transition-colors"
                >
                   Exit
                </button>
            </div>
          </div>


          {/* ================= Right Content (Chat Detail) ================= */}
          <div className="flex-1 flex flex-col relative bg-transparent">
             
             {/* Header */}
             <div className="h-20 border-b border-white/5 flex items-center justify-between px-6 bg-gradient-to-b from-white/5 to-transparent backdrop-blur-md sticky top-0 z-20">
                <div className="flex items-center gap-4">
                    {/* Hamburger Button (Mobile Only) */}
                    <button 
                        onClick={() => setShowMobileList(true)}
                        className="md:hidden p-2 -ml-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8h16M4 16h16" />
                        </svg>
                    </button>
                    
                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                        <span className="text-indigo-300 text-lg">✦</span>
                    </div>
                    <div>
                        <h2 className="text-sm font-medium text-white tracking-wide font-serif">Somnium Log</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]"></span>
                            <span className="text-[10px] text-gray-400 tracking-wider uppercase">Archived</span>
                        </div>
                    </div>
                </div>

                {/* Desktop Return Home */}
                <button 
                    onClick={() => setShowHistory(false)}
                    className="hidden md:flex w-8 h-8 items-center justify-center rounded-full border border-white/10 text-gray-400 hover:bg-white/10 hover:text-white transition-all"
                    title="返回主页"
                >
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                   </svg>
                </button>
             </div>

             {/* Messages Area */}
             <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-10 space-y-8 scroll-smooth">
                {history.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-white/5 to-transparent border border-white/5 flex items-center justify-center mb-6 animate-pulse-slow">
                            <svg className="w-10 h-10 text-indigo-300/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                        </div>
                        <p className="text-sm text-indigo-200/30 tracking-[0.2em] uppercase">No dreams recorded</p>
                    </div>
                ) : (
                    history.map((msg, idx) => {
                        const isUser = msg.role === 'user';
                        return (
                            <div key={idx} className={`flex gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'} group animate-fade-in-up`} style={{ animationDelay: `${idx * 0.05}s` }}>
                                {/* Avatar */}
                                <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center shadow-lg border border-white/5 ${isUser ? 'bg-indigo-600/20 backdrop-blur-sm' : 'bg-purple-900/20 backdrop-blur-sm'}`}>
                                    {isUser ? (
                                        <span className="text-[10px] text-indigo-200 font-bold">U</span>
                                    ) : (
                                        <span className="text-[10px] text-purple-200">AI</span>
                                    )}
                                </div>
                                
                                {/* Message Body */}
                                <div className={`flex flex-col max-w-[85%] md:max-w-[70%] ${isUser ? 'items-end' : 'items-start'}`}>
                                    <div className={`px-6 py-4 rounded-2xl text-sm md:text-base leading-relaxed backdrop-blur-md shadow-sm border ${
                                        isUser 
                                        ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-100 rounded-tr-none' 
                                        : 'bg-white/5 border-white/5 text-gray-200 rounded-tl-none'
                                    }`}>
                                        {msg.text}
                                    </div>
                                    <span className="text-[9px] text-gray-600 mt-2 px-1 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wider">
                                        {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                </div>
                            </div>
                        );
                    })
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
      
      {/* 1. Header */}
      <div className="mt-20 text-center opacity-70 hover:opacity-90 transition-opacity duration-1000">
        <h1 className="text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-b from-gray-100 via-gray-300 to-transparent font-serif tracking-[0.25em]">
          SOMNIUM
        </h1>
        <p className="text-[10px] text-indigo-200/40 tracking-[0.8em] uppercase mt-4 ml-3">入眠伴侣</p>
      </div>

      {/* 2. Main Action */}
      <div className="flex-1 flex flex-col items-center justify-center w-full relative">
         
         <button
            onClick={() => onConnect(DEFAULT_VOICE, CHINESE_SYSTEM_INSTRUCTION)}
            className="group relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center focus:outline-none"
         >
            {/* Aura */}
            <div className="absolute inset-0 bg-indigo-500/5 blur-[80px] rounded-full group-hover:bg-indigo-500/15 transition-colors duration-1000" />

            {/* Rotating Rings */}
            <div className="absolute inset-2 rounded-full opacity-50 blur-md group-hover:opacity-100 transition-opacity duration-1000 animate-spin-slow"
                 style={{ background: 'conic-gradient(from 0deg, transparent 0%, #6366f1 20%, transparent 40%, #818cf8 60%, transparent 100%)' }}>
            </div>
             <div className="absolute inset-2 rounded-full opacity-30 blur-lg group-hover:opacity-70 transition-opacity duration-1000 animate-spin-reverse-slower"
                 style={{ background: 'conic-gradient(from 180deg, transparent 0%, #a855f7 30%, transparent 70%)' }}>
            </div>

            {/* Center Void */}
            <div className="absolute inset-3 rounded-full bg-[#020205] border border-white/5 shadow-[inset_0_0_40px_rgba(0,0,0,1)] z-10 flex items-center justify-center group-hover:scale-[0.98] transition-transform duration-700 ease-in-out">
                <span className="text-sm text-indigo-100/40 font-serif tracking-[0.4em] uppercase group-hover:text-indigo-100/90 transition-colors duration-700 ml-1">
                  入梦
                </span>
            </div>
         </button>

         {error && (
            <div className="absolute top-[80%] text-center animate-fade-in">
               <p className="text-red-400/40 text-[10px] tracking-widest border-b border-red-900/30 pb-1">{error}</p>
            </div>
         )}
      </div>

      {/* 3. Footer */}
      <div className="w-full max-w-xs mb-10 text-center">
         <button 
           onClick={() => setShowHistory(true)}
           className="text-[10px] text-gray-600 uppercase tracking-[0.3em] hover:text-indigo-300 transition-colors duration-500 ml-2"
         >
             入眠记录
         </button>
      </div>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-reverse-slower {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-spin-slow {
          animation: spin-slow 15s linear infinite;
        }
        .animate-spin-reverse-slower {
          animation: spin-reverse-slower 25s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Controls;