import React, { useState, useCallback } from 'react';
import { useLiveSession } from './hooks/useLiveSession';
import Visualizer from './components/Visualizer';
import Controls from './components/Controls';
import StarBackground from './components/StarBackground'; // Import new background
import { VisualizerState } from './types';

const App: React.FC = () => {
  const [visualizerState, setVisualizerState] = useState<VisualizerState>({ volume: 0, isTalking: false });
  
  // Callback to update visualizer from the audio loop
  const handleVisualizerUpdate = useCallback((volume: number, isTalking: boolean) => {
    setVisualizerState({ volume, isTalking });
  }, []);

  const { isConnected, connect, disconnect, error, history, realtimeTranscript } = useLiveSession({ 
    onVisualizerUpdate: handleVisualizerUpdate 
  });

  return (
    <div className="relative w-full h-screen bg-[#020205] overflow-hidden text-white selection:bg-indigo-500/30">
      
      {/* Layer 0: Deep Space Background (Always Active) */}
      <StarBackground />
      
      {/* Layer 1: Visualizer (Subtle Orbs - visible mostly when active) */}
      <div className={`transition-opacity duration-1000 ${isConnected ? 'opacity-100' : 'opacity-40'}`}>
         <Visualizer state={visualizerState} />
      </div>

      {/* Layer 2: Main Content Layer */}
      <div className="relative z-10 w-full h-full">
        <Controls 
          isConnected={isConnected} 
          onConnect={connect} 
          onDisconnect={disconnect}
          error={error}
          history={history}
          realtimeTranscript={realtimeTranscript}
        />
      </div>
    </div>
  );
};

export default App;